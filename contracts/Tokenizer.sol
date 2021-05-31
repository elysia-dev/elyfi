// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol';
import './libraries/WadRayMath.sol';
import './libraries/Errors.sol';
import './libraries/DataStruct.sol';
import './libraries/Math.sol';
import './libraries/Role.sol';
import './logic/AssetBond.sol';
import './logic/TokenizerData.sol';
import './logic/Index.sol';
import './logic/Validation.sol';
import './interfaces/IMoneyPool.sol';
import './interfaces/ITokenizer.sol';
import './TokenizerStorage.sol';
import 'hardhat/console.sol';

/**
 * @title ELYFI Tokenizer
 * @author ELYSIA
 */
contract Tokenizer is ITokenizer, ERC721Upgradeable, TokenizerStorage {
  using WadRayMath for uint256;
  using TokenizerData for DataStruct.TokenizerData;
  using AssetBond for DataStruct.AssetBondData;
  using Index for DataStruct.AssetBondData;

  /************ Initialize Functions ************/

  function initialize(
    address moneyPool,
    string memory name_,
    string memory symbol_
  ) public initializer {
    _moneyPool = IMoneyPool(moneyPool);
    __ERC721_init(name_, symbol_);
  }

  /************ View Functions ************/

  /**
   * @dev Returns AToken Interest index of assetBond
   * @param tokenId The asset bond tokenId
   * @return The AToken interest index of asset bond
   */
  function getATokenInterestIndex(uint256 tokenId) public view override returns (uint256) {
    return _assetBondData[tokenId].getATokenInterestIndex();
  }

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

  function getTokenizerData() external view override returns (DataStruct.TokenizerData memory) {
    return _tokenizerData;
  }

  function getMinter(uint256 tokenId) external view returns (address) {
    return _minter[tokenId];
  }

  /************ ABToken Formation Functions ************/

  // tokenId : bitMask
  // Need access control : only CSP
  function mintABToken(
    address account, // CSP address
    uint256 tokenId // information about CSP and borrower
  ) external override {
    if (_minter[tokenId] != address(0)) revert(); ////error ABTokenIDAlreadyExist(tokenId)

    // mint ABToken to CSP
    _safeMint(account, tokenId, '');

    // validate tokenId : tokenId should have information about
    AssetBond.validateTokenId(tokenId);

    _minter[tokenId] = account;
    _tokenType[tokenId] = Role.ABTOKEN;
  }

  // Access control : only minter
  /**
   * @dev Asset Bond su
   */
  function settleABToken(
    address asset,
    address borrower, // borrower address
    address lawfirm, // lawfirm address
    uint256 tokenId, // tokenId
    uint256 collateralValue, // collateralValue in USD
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

    console.log(
      'hardhat deposit ABToken Tokenizer | borrowAPR | totalSupply | averageATokenAPR',
      borrowAPR,
      _tokenizerData.totalATokenSupply,
      _tokenizerData.averageATokenAPR
    );
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
    if (_msgSender() != address(_moneyPool)) revert(); ////OnlyMoneyPool();
    _;
  }
}
