// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import './MoneyPoolStorage.sol';
import './interfaces/ILToken.sol';
import './interfaces/IMoneyPool.sol';
import './interfaces/ITokenizer.sol';
import './logic/Index.sol';
import './logic/Rate.sol';
import './logic/AssetBond.sol';
import './logic/Validation.sol';
import './libraries/DataStruct.sol';
import 'hardhat/console.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155ReceiverUpgradeable.sol';

contract MoneyPool is IMoneyPool, IERC1155ReceiverUpgradeable, MoneyPoolStorage {
  using SafeERC20Upgradeable for IERC20Upgradeable;
  using Index for DataStruct.ReserveData;
  using Index for DataStruct.AssetBondData;
  using Validation for DataStruct.ReserveData;
  using Rate for DataStruct.ReserveData;
  using AssetBond for DataStruct.AssetBondData;

  function initialize(uint256 maxReserveCount_, address connector) public initializer {
    _connector = connector;
    _maxReserveCount = maxReserveCount_;
    _reserveCount += 1;
  }

  /************ MoneyPool Investment Functions ************/

  /**
   * @dev Invests an amount of underlying asset and receive corresponding LTokens.
   * @param asset The address of the underlying asset to invest
   * @param account The address that will receive the LToken
   * @param amount Investment amount
   **/
  function investMoneyPool(
    address asset,
    address account,
    uint256 amount
  ) external override {
    DataStruct.ReserveData storage reserve = _reserves[asset];

    // validation
    // Check pool activation
    Validation.validateInvestMoneyPool(reserve, amount);

    // update indexes and mintToReserve
    reserve.updateState();

    // for test
    console.log(
      'hardhat updateIndex console:',
      reserve.lTokenInterestIndex,
      reserve.lastUpdateTimestamp
    );

    // update rates
    reserve.updateRates(asset, amount, 0);

    // transfer underlying asset
    // If transfer fail, reverts
    IERC20Upgradeable(asset).safeTransferFrom(msg.sender, reserve.lTokenAddress, amount);

    // Mint ltoken
    ILToken(reserve.lTokenAddress).mint(account, amount, reserve.lTokenInterestIndex);

    emit InvestMoneyPool(asset, account, amount);
  }

  function withdrawMoneyPool(
    address asset,
    address account,
    uint256 amount
  ) external override returns (uint256) {
    DataStruct.ReserveData storage reserve = _reserves[asset];

    address lToken = reserve.lTokenAddress;
    address tokenizer = reserve.tokenizerAddress;

    uint256 userLTokenBalance = ILToken(lToken).balanceOf(msg.sender);

    uint256 amountToWithdraw = amount;

    if (amount == type(uint256).max) {
      amountToWithdraw == userLTokenBalance;
    }

    // validation
    // Without digital asset borrow, validation might be quite simple.
    Validation.validateWithdrawMoneyPool(
      reserve,
      asset,
      amount,
      userLTokenBalance,
      _reservesList,
      _reserveCount
    );

    // update indexes and mintToReserve
    reserve.updateState();

    // update rates
    reserve.updateRates(asset, 0, amount);

    // Burn ltoken
    ILToken(lToken).burn(msg.sender, account, amount, reserve.lTokenInterestIndex);

    emit WithdrawMoneyPool(asset, msg.sender, account, amountToWithdraw);
  }

  /************ View Functions ************/

  /**
   * @dev Returns LToken Interest index of asset
   * @param asset The address of the underlying asset of the reserve
   * @return The LToken interest index of reserve
   */
  function getLTokenInterestIndex(address asset) external view override returns (uint256) {
    return _reserves[asset].getLTokenInterestIndex();
  }

  /**
   * @dev Returns the state and configuration of the reserve
   * @param asset The address of the underlying asset of the reserve
   * @return The state of the reserve
   **/
  function getReserveData(address asset)
    external
    view
    override
    returns (DataStruct.ReserveData memory)
  {
    return _reserves[asset];
  }

  /************ ABToken Formation Functions ************/

  // need access control signer: only lawfirm or asset owner

  // need access control : only minter
  function borrowAgainstABToken(
    address asset,
    address receiver,
    uint256 borrowAmount,
    uint256 tokenId
  ) external override {
    DataStruct.ReserveData storage reserve = _reserves[asset];
    DataStruct.AssetBondData memory assetBond =
      ITokenizer(reserve.tokenizerAddress).getAssetBondData(tokenId);

    // Check if borrow amount exceeds collateral value
    // Check if borrow amount exceeds liquidity available
    Validation.validateBorrowAgainstAssetBond(reserve, assetBond, asset, borrowAmount);

    reserve.updateState();

    // update interest rate
    reserve.updateRates(asset, 0, borrowAmount);

    ITokenizer(reserve.tokenizerAddress).depositAssetBond(
      msg.sender,
      tokenId,
      borrowAmount,
      reserve.borrowAPR
    );

    // transfer asset bond
    // or lock NFT?

    // transfer Underlying asset
    ILToken(reserve.lTokenAddress).transferUnderlyingTo(receiver, borrowAmount);
  }

  /************ External Functions ************/

  /**
   * @dev Validate and finalize LToken transfer
   * @notice In beta version, there's no need for validation
   */
  function validateLTokenTransfer(
    address asset,
    address from,
    address to,
    uint256 amount,
    uint256 previousFromBalance,
    uint256 previousToBalance
  ) external override {
    if (msg.sender == _reserves[asset].lTokenAddress) revert(); ////

    // For beta version, there's no need for validate LToken transfer
    Validation.validateLTokenTrasfer();
  }

  /************ Configuration Functions ************/

  // Need access control, onlyConfigurator can add new reserve.
  function addNewReserve(
    address asset,
    address lToken,
    address interestModel,
    address tokenizer,
    uint256 moneyPoolFactor_
  ) external override {
    DataStruct.ReserveData memory newReserveData =
      DataStruct.ReserveData({
        moneyPoolFactor: moneyPoolFactor_,
        lTokenInterestIndex: WadRayMath.ray(),
        borrowAPR: 0,
        supplyAPR: 0,
        totalDepositedAssetBondCount: 0,
        lastUpdateTimestamp: uint40(block.timestamp),
        lTokenAddress: lToken,
        interestModelAddress: interestModel,
        tokenizerAddress: tokenizer,
        id: 0,
        isPaused: false,
        isActivated: true
      });

    _reserves[asset] = newReserveData;
    _addNewReserveToList(asset);
  }

  function _addNewReserveToList(address asset) internal {
    uint256 reserveCount = _reserveCount;

    if (reserveCount >= _maxReserveCount) revert(); ////MaxReserveCountExceeded();

    if (_reserves[asset].id != 0) revert(); ////DigitalAssetAlreadyAdded(address asset);

    _reserves[asset].id = uint8(reserveCount);
    _reservesList[reserveCount] = asset;

    _reserveCount = reserveCount + 1;
  }

  /**
        @dev Handles the receipt of a single ERC1155 token type. This function is
        called at the end of a `safeTransferFrom` after the balance has been updated.
        To accept the transfer, this must return
        `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))`
        (i.e. 0xf23a6e61, or its own function selector).
        @param operator The address which initiated the transfer (i.e. msg.sender)
        @param from The address which previously owned the token
        @param tokenId The tokenId of the token being transferred
        @param value The amount of tokens being transferred
        @param data Additional data with no specified format
        @return `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))` if transfer is allowed
    */
  function onERC1155Received(
    address operator,
    address from,
    uint256 tokenId,
    uint256 value,
    bytes calldata data
  ) external override returns (bytes4) {
    return bytes4(keccak256('onERC1155Received(address,address,uint256,uint256,bytes)'));
  }

  /**
        @dev Handles the receipt of a multiple ERC1155 token types. This function
        is called at the end of a `safeBatchTransferFrom` after the balances have
        been updated. To accept the transfer(s), this must return
        `bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))`
        (i.e. 0xbc197c81, or its own function selector).
        @param operator The address which initiated the batch transfer (i.e. msg.sender)
        @param from The address which previously owned the token
        @param ids An array containing ids of each token being transferred (order and length must match values array)
        @param values An array containing amounts of each token being transferred (order and length must match ids array)
        @param data Additional data with no specified format
        @return `bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))` if transfer is allowed
    */
  function onERC1155BatchReceived(
    address operator,
    address from,
    uint256[] calldata ids,
    uint256[] calldata values,
    bytes calldata data
  ) external override returns (bytes4) {
    return bytes4(keccak256('onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)'));
  }

  function supportsInterface(bytes4 interfaceId) external view override returns (bool) {
    return true;
  }
}
