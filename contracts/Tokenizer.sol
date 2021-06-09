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

  /************ View Functions ************/

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

  function getMinter(uint256 tokenId) external view returns (address) {
    return _minter[tokenId];
  }

  /************ AssetBond Formation Functions ************/

  // tokenId : bitMask
  /**
   * @notice This function can be called by collateral service providers when they want to sign a contract.
   * Borrowers who wants to take out a loan backed by real asset must enter into a contract
   * with a collateral service provider to obtain a loan. Borrowers should submit various documents necessary for evaluating a loan secured by
   * real assets to the collateral service provider.
   * @param account CSP address
   * @param tokenId The tokenId is a unique identifier for asset bond.
   */
  function mintAssetBond(address account, uint256 tokenId) external override onlyCSP {
    if (_minter[tokenId] != address(0)) revert TokenizerErrors.AssetBondIDAlreadyExists(tokenId);
    if (!_connector.isCSP(account))
      revert TokenizerErrors.MintedAssetBondReceiverNotAllowed(account, tokenId);

    DataStruct.AssetBondData storage assetBond = _assetBondData[tokenId];

    // validate tokenId : tokenId should have information about
    Validation.validateTokenId(tokenId);

    // mint AssetBond to CSP
    _safeMint(account, tokenId, '');

    _minter[tokenId] = account;

    emit EmptyAssetBondMinted(account, tokenId);
  }

  struct SettleAssetBondLocalVars {
    uint256 maturityTimestamp;
    uint256 liquidationTimestamp;
    uint256 _gracePeriod;
    uint16 _year;
    uint8 year;
    uint8 month;
    uint8 day;
  }

  // Access control : only minter
  /**
   * @notice This function is called after Based on the documents submitted by the loan applicant,
   * risk analysis for the relevant asset is conducted, and the loan availability,
   * maximum loanable amount and the interest rate between collateral service provider
   * and borrower are calculated.
   * @param borrower borrower
   * @param signer A third-party agency address that reviews entities listed on the asset bond data
   * @param tokenId Token Id to settle
   The interest rate paid on a bond by its issuer for the term of the security
   * @param gracePeriod gracePeriod
   * @param maturityDate maturityDate in year, month, day.
   */
  function settleAssetBond(
    address borrower,
    address signer,
    uint256 tokenId,
    uint256 principal,
    uint256 couponRate,
    uint256 overdueInterestRate,
    uint256 debtCeiling,
    uint8 gracePeriod,
    uint8[3] memory maturityDate,
    string memory ipfsHash
  ) external {
    SettleAssetBondLocalVars memory vars;

    (vars.year, vars.month, vars.day) = (maturityDate[0], maturityDate[1], maturityDate[2]);

    vars._year = vars.year + 2000;

    vars.maturityTimestamp = TimeConverter.toTimestamp(vars._year, vars.month, vars.day);

    vars._gracePeriod = uint256(gracePeriod);

    vars.liquidationTimestamp = vars.maturityTimestamp + (vars._gracePeriod * 1 days);

    Validation.validateSettleAssetBond(tokenId, vars.maturityTimestamp, debtCeiling);

    DataStruct.AssetBondData memory newAssetBond =
      DataStruct.AssetBondData({
        state: DataStruct.AssetBondState.SETTLED,
        borrower: borrower,
        signer: signer,
        principal: principal,
        couponRate: couponRate,
        interestRate: 0,
        overdueInterestRate: overdueInterestRate,
        maturityTimestamp: vars.maturityTimestamp,
        liquidationTimestamp: vars.liquidationTimestamp,
        collateralizeTimestamp: 0,
        ipfsHash: ipfsHash,
        signerOpinionHash: ''
      });

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

  function signAssetBond(uint256 tokenId, string memory signerOpinionHash) external {
    DataStruct.AssetBondData storage assetBond = _assetBondData[tokenId];
    Validation.validateSignAssetBond(assetBond);

    assetBond.signAssetBond(signerOpinionHash);
  }

  function collateralizeAssetBond(
    address account,
    uint256 tokenId,
    uint256 borrowAmount,
    uint256 interestRate
  ) external override onlyMoneyPool {
    DataStruct.AssetBondData storage assetBond = _assetBondData[tokenId];

    assetBond.collateralizeAssetBond(interestRate);
  }

  function releaseAssetBond(address account, uint256 tokenId) external override onlyMoneyPool {
    DataStruct.AssetBondData storage assetBond = _assetBondData[tokenId];
  }

  /************ Token Functions ************/

  /************ MoneyPool Total AToken Balance Manage Functions ************/

  // need logic : generate tokenId
  function _generateATokenId(uint256 assetBondId) internal pure returns (uint256) {
    return assetBondId * 10;
  }

  modifier onlyMoneyPool {
    if (_msgSender() != address(_moneyPool)) revert TokenizerErrors.OnlyMoneyPool();
    _;
  }

  modifier onlyCSP {
    if (!_connector.isCSP(msg.sender)) revert TokenizerErrors.OnlyCSP();
    _;
  }

  modifier onlyCouncil {
    if (!_connector.isCouncil(msg.sender)) revert TokenizerErrors.OnlyCouncil();
    _;
  }
}
