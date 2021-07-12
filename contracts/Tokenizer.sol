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
 * @notice Asset bond token is a type of token that records information about real asset-backed bonds
 * and acts as bonds on-chain. It complies with the NFT standard, ERC721 and this token can be deposited
 * in the Money Pool to execute a loan contract.
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
   * @notice Returns the state of the asset bond
   * @dev The state of the asset bond is `LIQUIDATED` when the current timestamp is greater than
   * liquidation timestamp.
   * @param tokenId The asset bond tokenId
   * @return The data struct of the asset bond
   **/
  function getAssetBondData(uint256 tokenId)
    external
    view
    override
    returns (DataStruct.AssetBondData memory)
  {
    DataStruct.AssetBondData memory assetBondData = _assetBondData[tokenId];
    if (
      block.timestamp >= assetBondData.liquidationTimestamp &&
      assetBondData.state == DataStruct.AssetBondState.COLLATERALIZED
    ) {
      assetBondData.state = DataStruct.AssetBondState.LIQUIDATED;
    }

    return assetBondData;
  }

  /**
   * @notice When the borrower takes a loan, the repayment is the sum of two types of amounts:
   * debt on the money pool and fee on the collateral service provider. The former is the amount to be
   * repaid to the moneypool, and the latter is the amount to be paid to collateral service provider as a fee.
   * @dev Returns the state debt of the asset bond
   * @param tokenId The id of the asset bond
   * @return Accrued debt on the moneypool and the fee on the collateral service provider.
   **/
  function getAssetBondDebtData(uint256 tokenId) external view override returns (uint256, uint256) {
    DataStruct.AssetBondData storage assetBond = _assetBondData[tokenId];

    return assetBond.getAssetBondDebtData();
  }

  function getMinter(uint256 tokenId) external view override returns (address) {
    return _minter[tokenId];
  }

  function getAssetBondIdData(uint256 tokenId)
    external
    view
    override
    returns (DataStruct.AssetBondIdData memory)
  {
    DataStruct.AssetBondIdData memory vars = AssetBond.parseAssetBondId(tokenId);
    console.log(vars.nonce, vars.productNumber);
    return AssetBond.parseAssetBondId(tokenId);
  }

  /************ AssetBond Formation Functions ************/

  /**
   * @notice This function can be called by collateral service providers when they want to sign a contract.
   * Borrowers who wants to take out a loan backed by real asset must enter into a contract
   * with a collateral service provider to obtain a loan. Borrowers should submit various documents necessary
   * for evaluating a loan secured by real assets to the collateral service provider.
   * @param account CollateralServiceProvider address
   * @param tokenId Unique identifier for asset bond.
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
   * @notice This function is called after collateral service provider based on the documents submitted by the loan applicant,
   * risk analysis for the relevant asset is conducted, and the loan availability, maximum loanable amount and the interest
   * rate between collateral service provider and borrower are calculated.
   * @param borrower The address of the borrower who must repay and retrieve the asset bond
   * @param signer A third-party agency address that reviews entities listed on the asset bond data
   * @param tokenId Token id to settle
   * @param principle The borrow amount based on the contract between collateral service provider and borrower in reality
   * @param couponRate The coupon rate of the bond
   * @param delinquencyRate The overdue interest rate of the bond. After the loan duration, the borrower
   * @param debtCeiling .
   * @param loanDuration .
   * @param loanStartTimeYear .
   * @param loanStartTimeMonth .
   * @param loanStartTimeDay .
   * @param ipfsHash .
   The interest rate paid on a bond by its issuer for the term of the security
   */
  function settleAssetBond(
    address borrower,
    address signer,
    uint256 tokenId,
    uint256 principle,
    uint256 couponRate,
    uint256 delinquencyRate,
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

    if (!_connector.isCouncil(signer)) revert TokenizerErrors.SignerIsNotCouncil(signer);
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

    DataStruct.AssetBondData memory newAssetBond = DataStruct.AssetBondData({
      state: DataStruct.AssetBondState.SETTLED,
      borrower: borrower,
      signer: signer,
      collateralServiceProvider: msg.sender,
      principle: principle,
      debtCeiling: debtCeiling,
      couponRate: couponRate,
      interestRate: 0,
      delinquencyRate: delinquencyRate,
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
      principle,
      couponRate,
      delinquencyRate,
      debtCeiling,
      vars.maturityTimestamp,
      vars.liquidationTimestamp,
      ipfsHash
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
   * Determination of the value of principle and interest through certificates of seal impressions
   * of real estate owners and lenders
   * Determination of whether the important information entered in smart contracts match the contract content
   * This allows the asset bond tokens to be recognized as collateral on the blockchain.
   * @param tokenId The token Id to release
   * @param signerOpinionHash The signer can upload their opinion as a form of official documents on IPFS server.
   */
  function signAssetBond(uint256 tokenId, string memory signerOpinionHash) external onlyCouncil {
    DataStruct.AssetBondData storage assetBond = _assetBondData[tokenId];
    Validation.validateSignAssetBond(assetBond);

    assetBond.state = DataStruct.AssetBondState.CONFIRMED;
    assetBond.signerOpinionHash = signerOpinionHash;

    emit AssetBondSigned(msg.sender, tokenId, signerOpinionHash);
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

    emit AssetBondCollateralized(account, tokenId, borrowAmount, interestRate);
  }

  /**
   * @notice When the repayment scenario, the dTokens are destroyed and the collateral of the locked up
   * asset bond tokens in the MoneyPool is unlocked. The asset bond tokens are transfered to the
   * address of the borrower for terminating the collateral contract.
   * @dev The releasing asset bond token should be only from the MoneyPool.
   * @param account The borrower
   * @param tokenId The token Id to release
   */
  function releaseAssetBond(address account, uint256 tokenId) external override onlyMoneyPool {
    DataStruct.AssetBondData storage assetBond = _assetBondData[tokenId];
    assetBond.state = DataStruct.AssetBondState.REDEEMED;

    transferFrom(address(_moneyPool), account, tokenId);
    emit AssetBondReleased(account, tokenId);
  }

  /**
   * @notice When the liquidation scenario, the dTokens are destroyed and the collateral of the locked up
   * asset bond tokens in the MoneyPool is transferred to liquidator.
   * @dev The liquidating asset bond token should be only from the MoneyPool.
   * @param account The liquidator
   * @param tokenId The token Id to release
   */
  function liquidateAssetBond(address account, uint256 tokenId) external override onlyMoneyPool {
    DataStruct.AssetBondData storage assetBond = _assetBondData[tokenId];
    assetBond.state = DataStruct.AssetBondState.LIQUIDATED;
    transferFrom(address(_moneyPool), account, tokenId);
    emit AssetBondLiquidated(account, tokenId);
  }

  /************ Access Functions ************/

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
