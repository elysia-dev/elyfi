// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import './libraries/WadRayMath.sol';
import './libraries/Errors.sol';
import './libraries/DataStruct.sol';
import './libraries/Math.sol';
import './libraries/Role.sol';
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
  using Index for DataStruct.AssetBondData;

  /************ Initialize Functions ************/

  constructor(
    address connector,
    string memory name_,
    string memory symbol_
  ) ERC721(name_, symbol_) {
    _connector = IConnector(connector);
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

  /************ ABToken Formation Functions ************/

  // tokenId : bitMask
  /**
   * @notice This function can be called by collateral service providers when they want to sign a contract.
   * Borrowers who wants to take out a loan backed by real asset must enter into a contract
   * with a collateral service provider to obtain a loan. Borrowers should submit various documents necessary for evaluating a loan secured by
   * real assets to the collateral service provider.
   * @param account CSP address
   * @param tokenId The tokenId is a unique identifier for asset bond.
   */
  function mintABToken(address account, uint256 tokenId) external override onlyCSP {
    if (_minter[tokenId] != address(0)) revert TokenizerErrors.ABTokenIDAlreadyExists(tokenId);
    if (!_connector.isCSP(account))
      revert TokenizerErrors.MintedABTokenReceiverNotAllowed(account, tokenId);

    // validate tokenId : tokenId should have information about
    AssetBond.validateTokenId(tokenId);

    // mint ABToken to CSP
    _safeMint(account, tokenId, '');

    _minter[tokenId] = account;

    emit EmptyABTokenMinted(account, tokenId);
  }

  // Access control : only minter
  /**
   * @notice This function is called after Based on the documents submitted by the loan applicant,
   * risk analysis for the relevant asset is conducted, and the loan availability,
   * maximum loanable amount and the interest rate between collateral service provider
   * and borrower are calculated.
   * @param borrower borrower
   * @param tokenId tokenId
   * @param collateralValue collateralValue in USD
   */
  function settleABToken(
    address asset,
    address borrower,
    address lawfirm,
    uint256 tokenId,
    uint256 collateralValue,
    uint256 dueDate,
    string memory ipfsHash
  ) external {
    // Validate init asset bond
    // lawfirm should be authorized
    // Asset bond state should be empty
    AssetBond.validateSettleABToken(tokenId, lawfirm);

    _assetBondData[tokenId].settleAssetBond(
      asset,
      borrower,
      lawfirm,
      collateralValue,
      dueDate,
      ipfsHash
    );
  }

  function signABToken(uint256 tokenId, address signer) external {}

  function collateralizeAssetBond(
    address account,
    uint256 tokenId,
    uint256 borrowAmount,
    uint256 borrowAPR
  ) external override onlyMoneyPool {
    DataStruct.AssetBondData storage assetBond = _assetBondData[tokenId];

    assetBond.collateralizeAssetBond(borrowAmount, borrowAPR);
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
    if (!_connector.isMoneyPool((msg.sender))) revert();
    revert TokenizerErrors.OnlyMoneyPool();
    _;
  }

  modifier onlyCSP {
    if (!_connector.isCSP(msg.sender)) revert();
    revert TokenizerErrors.OnlyCSP();
    _;
  }

  modifier onlyCouncil {
    if (!_connector.isCouncil(msg.sender)) revert();
    revert TokenizerErrors.OnlyCouncil();
    _;
  }
}
