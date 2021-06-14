// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import './libraries/WadRayMath.sol';
import './libraries/Errors.sol';
import './libraries/DataStruct.sol';
import './libraries/Math.sol';
import './libraries/Role.sol';
import './libraries/TimeConverter.sol';
import './logic/AssetBond.sol';
import './logic/Index.sol';
import './logic/Validation.sol';
import './interfaces/IMoneyPool.sol';
import './interfaces/ITokenizer.sol';
import './interfaces/IConnector.sol';
import './TokenizerStorage.sol';
import 'hardhat/console.sol';

/**
 * @title ELYFI Tokenizer
 * @author ELYSIA
 */
contract Tokenizer is ITokenizer, TokenizerStorage, ERC721 {
  using WadRayMath for uint256;
  using AssetBond for DataStruct.AssetBondData;
  using Validation for DataStruct.AssetBondData;
  using Index for DataStruct.AssetBondData;

  /************ Initialize Functions ************/

  constructor(
    address connector,
    address moneyPool,
    string memory name_,
    string memory symbol_
  ) ERC721(name_, symbol_) {
    _connector = IConnector(connector);
    _moneyPool = IMoneyPool(moneyPool);
  }

  /************ View Functions *************/

  /**
   * @dev Returns the state of the asset bond
   * @param tokenId The asset bond tokenId
   * @return The data of the asset bond
   **/
  function getAssetBondData(uint256 tokenId)
    external
    view
    override
    returns (DataStruct.AssetBondData memory)
  {
    return _assetBondData[tokenId];
  }

  function getAssetBondDebtData(uint256 tokenId) external view override returns (uint256, uint256) {
    DataStruct.AssetBondData storage assetBond = _assetBondData[tokenId];
    return assetBond.getAssetBondDebtData();
  }

  function getMinter(uint256 tokenId) external view override returns (address) {
    return _minter[tokenId];
  }

  /************ AssetBond Formation Functions ************/

  // tokenId : bitMask
  /**
   * @notice This function can be called by collateral service providers when they want to sign a contract.
   * Borrowers who wants to take out a loan backed by real asset must enter into a contract
   * with a collateral service provider to obtain a loan. Borrowers should submit various documents necessary for evaluating a loan secured by
   * real assets to the collateral service provider.
   * @param account CollateralServiceProvider address
   * @param tokenId The tokenId is a unique identifier for asset bond.
   */
  function mintAssetBond(address account, uint256 tokenId)
    external
    override
    onlyCollateralServiceProvider
  {
    if (!_connector.isCollateralServiceProvider(account))
      revert TokenizerErrors.MintedAssetBondReceiverNotAllowed(tokenId);

    // validate tokenId : tokenId should have information about
    Validation.validateTokenId(tokenId);

    // mint AssetBond to CollateralServiceProvider
    _safeMint(account, tokenId);

    _minter[tokenId] = msg.sender;

    emit EmptyAssetBondMinted(account, tokenId);
  }

  struct SettleAssetBondLocalVars {
    uint256 loanStartTimestamp;
    uint256 maturityTimestamp;
    uint256 liquidationTimestamp;
  }

  /**
   * @notice This function is called after Based on the documents submitted by the loan applicant,
   * risk analysis for the relevant asset is conducted, and the loan availability,
   * maximum loanable amount and the interest rate between collateral service provider
   * and borrower are calculated.
   * @param borrower borrower
   * @param signer A third-party agency address that reviews entities listed on the asset bond data
   * @param tokenId Token Id to settle
   The interest rate paid on a bond by its issuer for the term of the security
   */
  function settleAssetBond(
    address borrower,
    address signer,
    uint256 tokenId,
    uint256 principal,
    uint256 couponRate,
    uint256 overdueInterestRate,
    uint256 debtCeiling,
    uint16 loanDuration,
    uint16 loanStartTimeYear,
    uint8 loanStartTimeMonth,
    uint8 loanStartTimeDay,
    string memory ipfsHash
  ) external onlyCollateralServiceProvider {
    SettleAssetBondLocalVars memory vars;
    if (ownerOf(tokenId) != msg.sender)
      revert TokenizerErrors.OnlyOwnerHasAuthrotyToSettle(tokenId);

    if (_assetBondData[tokenId].state != DataStruct.AssetBondState.EMPTY)
      revert TokenizerErrors.AssetBondAlreadySettled(tokenId);
    vars.loanStartTimestamp = 0;
    vars.maturityTimestamp = 0;
    vars.liquidationTimestamp = 0;

    vars.loanStartTimestamp = TimeConverter.toTimestamp(
      loanStartTimeYear,
      loanStartTimeMonth,
      loanStartTimeDay
    );
    vars.maturityTimestamp = vars.loanStartTimestamp + (uint256(loanDuration) * 1 days);
    vars.liquidationTimestamp = vars.maturityTimestamp + (10 * 1 days);

    DataStruct.AssetBondData memory newAssetBond =
      DataStruct.AssetBondData({
        state: DataStruct.AssetBondState.SETTLED,
        borrower: borrower,
        signer: signer,
        collateralServiceProvider: msg.sender,
        principal: principal,
        debtCeiling: debtCeiling,
        couponRate: couponRate,
        interestRate: 0,
        overdueInterestRate: overdueInterestRate,
        loanStartTimestamp: vars.loanStartTimestamp,
        maturityTimestamp: vars.maturityTimestamp,
        liquidationTimestamp: vars.liquidationTimestamp,
        collateralizeTimestamp: 0,
        ipfsHash: ipfsHash,
        signerOpinionHash: ''
      });

    Validation.validateSettleAssetBond(newAssetBond);

    _assetBondData[tokenId] = newAssetBond;

    emit AssetBondSettled(
      borrower,
      signer,
      tokenId,
      principal,
      couponRate,
      overdueInterestRate,
      debtCeiling,
      vars.maturityTimestamp,
      vars.liquidationTimestamp
    );
  }

  /**
   * @notice When the collateral service provider settled the informations based on the real world contract
   * in asset bond token, the third party connector such as lawfrim should review this and sign it.
   * The object for this process is to build trust in the token issuance in ELYFI.
   * This final verification process is carried out by reliable parties such as lawfirm.
   * The review is following four items.
   * Determination of the authenticity of collateral security details entered in real estate registration
   * Determination of the authenticity of the contract between a real estate owner and a collateral service provider
   * Determination of the value of principal and interest through certificates of seal impressions
   * of real estate owners and lenders
   * Determination of whether the important information entered in smart contracts match the contract content
   * This allows the asset bond tokens to be recognized as collateral on the blockchain.
   * @param tokenId The token Id to release
   * @param signerOpinionHash The signer can upload their opinion as a form of official documents
   * on IPFS server.
   */
  function signAssetBond(uint256 tokenId, string memory signerOpinionHash) external {
    DataStruct.AssetBondData storage assetBond = _assetBondData[tokenId];
    Validation.validateSignAssetBond(assetBond);

    assetBond.state = DataStruct.AssetBondState.CONFIRMED;
    assetBond.signerOpinionHash = signerOpinionHash;
  }

  /**
   * @notice The collateral service provider can take out a loan of value equivalent to the collateral
   * recored in asset bond tokens. The asset bond tokens are automatically transferred to the MoneyPool
   * by internal function of `borrow` function.
   * @dev The collateralizing asset bond token should be only from the MoneyPool.
   * @param account The owner of asset bond token
   * @param tokenId The token Id to collateralize
   * @param borrowAmount The borrow amount.
   * @param interestRate The interest rate of the loan between MoneyPool and borrower.
   */
  function collateralizeAssetBond(
    address account,
    uint256 tokenId,
    uint256 borrowAmount,
    uint256 interestRate
  ) external override onlyMoneyPool {
    DataStruct.AssetBondData storage assetBond = _assetBondData[tokenId];

    assetBond.state = DataStruct.AssetBondState.COLLATERALIZED;

    // set bond date data
    assetBond.interestRate = interestRate;
    assetBond.collateralizeTimestamp = block.timestamp;

    transferFrom(account, address(_moneyPool), tokenId);
    approve(account, tokenId);
  }

  /**
   * @notice When the repayment scenario, the dTokens are destroyed and the collateral of the locked up
   * asset bond tokens in the MoneyPool is unlocked. The asset bond tokens are transfered to the
   * address of the borrower for terminating the collateral contract.
   * @dev The releasing asset bond token should be only from the MoneyPool.
   * @param account The owner of asset bond token
   * @param tokenId The token Id to release
   */
  function releaseAssetBond(address account, uint256 tokenId) external override onlyMoneyPool {
    DataStruct.AssetBondData storage assetBond = _assetBondData[tokenId];
    assetBond.state = DataStruct.AssetBondState.MATURED;
  }

  /************ Token Functions ************/

  /************ MoneyPool Total AToken Balance Manage Functions ************/
  modifier onlyMoneyPool {
    if (_msgSender() != address(_moneyPool)) revert TokenizerErrors.OnlyMoneyPool();
    _;
  }

  modifier onlyCollateralServiceProvider {
    if (!_connector.isCollateralServiceProvider(msg.sender))
      revert TokenizerErrors.OnlyCollateralServiceProvider();
    _;
  }

  modifier onlyCouncil {
    if (!_connector.isCouncil(msg.sender)) revert TokenizerErrors.OnlyCouncil();
    _;
  }
}
