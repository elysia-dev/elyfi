// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol';
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
import './TokenizerStorage.sol';

/**
 * @title ELYFI Tokenizer
 * @author ELYSIA
 */
contract Tokenizer is ITokenizer, ERC1155Upgradeable, TokenizerStorage {
  using WadRayMath for uint256;
  using AssetBond for DataStruct.TokenizerData;
  using AssetBond for DataStruct.AssetBondData;
  using Index for DataStruct.AssetBondData;

  /************ Initialize Functions ************/

  function initialize(address moneyPool, string memory uri_) public initializer {
    _moneyPool = IMoneyPool(moneyPool);
    __ERC1155_init(uri_);
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
   * @dev This contract overrides `balanceOf` method for calculate increasing balance of
   * securitized asset bond. It returns sum of previous balance and accrued interest of account.
   * If token is NFT, return 1
   * @param account Account address
   * @param tokenId tokenId
   * @return The sum of previous balance and accrued interest
   */
  function balanceOf(address account, uint256 tokenId)
    public
    view
    virtual
    override(ERC1155Upgradeable, IERC1155Upgradeable)
    returns (uint256)
  {
    if (_tokenType[tokenId] == Role.ABTOKEN) {
      return super.balanceOf(account, tokenId);
    }

    uint256 aTokenIndex = getATokenInterestIndex(tokenId);

    return super.balanceOf(account, tokenId).rayMul(aTokenIndex);
  }

  /**
   * @dev Returns sum of previous balance and accrued interest of moneypool
   * @return The sum of previous balance and accrued interest of moneypool
   */
  function totalATokenBalanceOfMoneyPool() public view override returns (uint256) {
    uint256 accruedInterest =
      Math.calculateLinearInterest(
        _tokenizerData.averageATokenAPR,
        _tokenizerData.lastUpdateTimestamp,
        block.timestamp
      );

    return _tokenizerData.totalATokenBalanceOfMoneyPool.rayMul(accruedInterest);
  }

  /**
   * @dev Returns total AToken supply which is sum of previous balance and accrued interest
   * @return The sum of previous balance and accrued interest
   */
  function totalATokenSupply() public view override returns (uint256) {
    uint256 accruedInterest =
      Math.calculateLinearInterest(
        _tokenizerData.averageATokenAPR,
        _tokenizerData.lastUpdateTimestamp,
        block.timestamp
      );

    return _tokenizerData.totalATokenSupply.rayMul(accruedInterest);
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

  function getAverageATokenAPR() external view override returns (uint256) {
    return _tokenizerData.averageATokenAPR;
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
    _mint(account, tokenId, 1, '');

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

  function depositAssetBond(
    address account,
    uint256 tokenId,
    uint256 borrowAmount,
    uint256 realAssetAPR
  ) external override onlyMoneyPool {
    DataStruct.AssetBondData storage assetBond = _assetBondData[tokenId];

    safeTransferFrom(account, address(_moneyPool), tokenId, 1, '');

    assetBond.depositAssetBond(borrowAmount, realAssetAPR);

    _mintAToken(account, tokenId, borrowAmount, realAssetAPR);
  }

  struct MintLocalVars {
    uint256 aTokenId;
    uint256 newAverageATokenRate;
    uint256 newTotalATokenSupply;
  }

  function _mintAToken(
    address account,
    uint256 assetBondId,
    uint256 borrowAmount,
    uint256 realAssetAPR
  ) internal {
    MintLocalVars memory vars;

    // generate AToken tokenId based on the tokenId of asset bond
    vars.aTokenId = _generateATokenId(assetBondId);

    // update total Atoken supply and average AToken rate
    _tokenizerData.increaseTotalAToken(borrowAmount, realAssetAPR);

    // update moneyPool AToken supply and average AToken rate
    _tokenizerData.increaseATokenBalanceOfMoneyPool(vars.aTokenId, borrowAmount, realAssetAPR);

    _mint(address(_moneyPool), vars.aTokenId, borrowAmount, '');

    _tokenType[assetBondId] = Role.ATOKEN;

    emit MintAToken(
      account,
      vars.aTokenId,
      borrowAmount,
      vars.newAverageATokenRate,
      vars.newTotalATokenSupply
    );
  }

  // function burnAToken(
  //     address account,
  //     uint256 assetBondId,
  //     uint256 amount
  // ) external {

  //     // validation : only after maturation

  //     Math.calculateRateInDecreasingBalance(
  //         _tokenizerData.averageMoneyPoolAPR,
  //         _tokenizerData.totalATokenBalanceOfMoneyPool,
  //         amount,
  //         );
  // }

  /************ Token Functions ************/

  /**
   * @dev This contract overrides `safeTransferFrom` method
   * in order to transfer implicit balance.
   * Transfer AToken to moneypool is not allowed in beta version
   */
  function safeTransferFrom(
    address from,
    address to,
    uint256 tokenId,
    uint256 amount,
    bytes memory data
  ) public override(ERC1155Upgradeable, IERC1155Upgradeable) {
    if (_tokenType[tokenId] == Role.ATOKEN) {
      if (to == address(_moneyPool)) revert(); //// TransferATokenToMoneyPoolNotAllowed();

      uint256 index = getATokenInterestIndex(tokenId);

      super.safeTransferFrom(from, to, tokenId, amount.rayDiv(index), data);
    }
  }

  /**
   * @dev Overriding ERC1155 safeBatchTransferFrom to transfer implicit balance
   * Transfer AToken to moneypool is not allowed in beta version
   */
  function safeBatchTransferFrom(
    address from,
    address to,
    uint256[] memory ids,
    uint256[] memory amounts,
    bytes memory data
  ) public override(ERC1155Upgradeable, IERC1155Upgradeable) {
    for (uint256 i = 0; i < ids.length; ++i) {
      uint256 tokenId = ids[i];
      uint256 amount = amounts[i];

      if (_tokenType[tokenId] == Role.ATOKEN) {
        if (to == address(_moneyPool)) revert(); //// TransferATokenToMoneyPoolNotAllowed();

        uint256 index = getATokenInterestIndex(tokenId);

        amounts[i] = amount.rayDiv(index);
      }
    }

    super.safeBatchTransferFrom(from, to, ids, amounts, data);
  }

  /************ MoneyPool Total AToken Balance Manage Functions ************/

  function increaseATokenBalanceOfMoneyPool(
    uint256 tokenId,
    uint256 amount,
    uint256 rate
  ) external override {
    uint256 aTokenId = _generateATokenId(tokenId);

    _tokenizerData.increaseATokenBalanceOfMoneyPool(aTokenId, amount, rate);
  }

  function decreaseATokenBalanceOfMoneyPool(
    uint256 tokenId,
    uint256 amount,
    uint256 rate
  ) external override {
    uint256 aTokenId = _generateATokenId(tokenId);

    _tokenizerData.decreaseATokenBalanceOfMoneyPool(aTokenId, amount, rate);
  }

  // need logic : generate tokenId
  function _generateATokenId(uint256 assetBondId) internal pure returns (uint256) {
    return assetBondId * 10;
  }

  modifier onlyMoneyPool {
    if (_msgSender() != address(_moneyPool)) revert(); ////OnlyMoneyPool();
    _;
  }
}
