// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import './MoneyPoolStorage.sol';
import './interfaces/ILToken.sol';
import './interfaces/IDToken.sol';
import './interfaces/IMoneyPool.sol';
import './interfaces/ITokenizer.sol';
import './logic/Index.sol';
import './logic/Rate.sol';
import './logic/Validation.sol';
import './logic/AssetBond.sol';
import './libraries/DataStruct.sol';
import 'hardhat/console.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

/**
 * @title Main contract for ELYFI beta. This contract manages the ability
 * to deposit and withdraw cryptocurrency and create NFT-backed loans.
 * @author ELYSIA
 * @notice This contract is beta version of ELYFI. The depositor and borrower
 * should approve the ELYFI moneypool contract to move their AssetBond token
 * or ERC20 tokens on their behalf.
 **/
contract MoneyPool is IMoneyPool, MoneyPoolStorage {
  using SafeERC20 for IERC20;
  using Index for DataStruct.ReserveData;
  using Validation for DataStruct.ReserveData;
  using Rate for DataStruct.ReserveData;
  using AssetBond for DataStruct.AssetBondData;

  constructor(uint256 maxReserveCount_, address connector) {
    _connector = IConnector(connector);
    _maxReserveCount = maxReserveCount_;
    _reserveCount += 1;
  }

  /************ MoneyPool Deposit Functions ************/

  /**
   * @notice By depositing virtual assets in the MoneyPool and supply liquidity,
   * depositors can receive interest accruing from the MoneyPool.
   * The return on the deposit arises from the interest on real asset backed loans.
   * MoneyPool depositors who deposit certain cryptoassets receives LTokens equivalent to the
   * deposit amount. LTokens are backed by cryptoassets deposited in the MoneyPool in a
   * 1:1 ratio.
   * @dev Deposits an amount of underlying asset and receive corresponding LTokens.
   * @param asset The address of the underlying asset to deposit
   * @param account The address that will receive the LToken
   * @param amount Deposit amount
   **/
  function deposit(
    address asset,
    address account,
    uint256 amount
  ) external override {
    DataStruct.ReserveData storage reserve = _reserves[asset];

    Validation.validateDeposit(reserve, amount);

    reserve.updateState(asset);

    reserve.updateRates(asset, amount, 0);

    IERC20(asset).safeTransferFrom(msg.sender, reserve.lTokenAddress, amount);

    ILToken(reserve.lTokenAddress).mint(account, amount, reserve.lTokenInterestIndex);

    /*
    console.log(
      'Deposit finalize |amount|lTokenInterestIndex|borrowAPY',
      amount,
      reserve.lastUpdateTimestamp,
      reserve.borrowAPY
    );
    */
    emit Deposit(asset, account, amount);
  }

  /**
   * @notice The depositors can seize their virtual assets deposited in the MoneyPool whenever they wish.
   * @dev Withdraws an amount of underlying asset from the reserve and burns the corresponding lTokens.
   * @param asset The address of the underlying asset to withdraw
   * @param account The address that will receive the underlying asset
   * @param amount Withdrawl amount
   **/
  function withdraw(
    address asset,
    address account,
    uint256 amount
  ) external override {
    DataStruct.ReserveData storage reserve = _reserves[asset];

    uint256 userLTokenBalance = ILToken(reserve.lTokenAddress).balanceOf(msg.sender);

    uint256 amountToWithdraw = amount;

    if (amount == type(uint256).max) {
      amountToWithdraw = userLTokenBalance;
    }

    Validation.validateWithdraw(
      reserve,
      asset,
      amount,
      userLTokenBalance,
      _reservesList,
      _reserveCount
    );

    reserve.updateState(asset);

    reserve.updateRates(asset, 0, amountToWithdraw);

    ILToken(reserve.lTokenAddress).burn(
      msg.sender,
      account,
      amountToWithdraw,
      reserve.lTokenInterestIndex
    );

    emit Withdraw(asset, msg.sender, account, amountToWithdraw);
  }

  /************ AssetBond Formation Functions ************/

  /**
   * @dev Withdraws an amount of underlying asset from the reserve and burns the corresponding lTokens.
   * @notice
   * @param asset The address of the underlying asset to withdraw
   **/
  function borrow(address asset, uint256 tokenId) external override onlyCollateralServiceProvider {
    DataStruct.ReserveData storage reserve = _reserves[asset];
    DataStruct.AssetBondData memory assetBond =
      ITokenizer(reserve.tokenizerAddress).getAssetBondData(tokenId);

    uint256 borrowAmount = assetBond.principal;
    address receiver = assetBond.borrower;

    Validation.validateBorrow(reserve, assetBond, asset, borrowAmount);

    reserve.updateState(asset);

    ITokenizer(reserve.tokenizerAddress).collateralizeAssetBond(
      msg.sender,
      tokenId,
      borrowAmount,
      reserve.borrowAPY
    );

    IDToken(reserve.dTokenAddress).mint(msg.sender, receiver, borrowAmount, reserve.borrowAPY);

    reserve.updateRates(asset, 0, borrowAmount);

    ILToken(reserve.lTokenAddress).transferUnderlyingTo(receiver, borrowAmount);

    /*
    console.log(
      'Borrow finalize |amount|lastUpdateTimestamp|borrowAPY',
      borrowAmount,
      reserve.lastUpdateTimestamp,
      reserve.borrowAPY
    );
    */

    emit Borrow(asset, msg.sender, receiver, tokenId, reserve.borrowAPY, borrowAmount);
  }

  /**
   * @dev repays an amount of underlying asset from the reserve and burns the corresponding lTokens.
   * @notice
   * @param asset The address of the underlying asset to withdraw
   **/
  function repay(address asset, uint256 tokenId) external override {
    DataStruct.ReserveData storage reserve = _reserves[asset];
    DataStruct.AssetBondData memory assetBond =
      ITokenizer(reserve.tokenizerAddress).getAssetBondData(tokenId);

    (uint256 accruedDebtOnMoneyPool, uint256 feeOnCollateralServiceProvider) =
      assetBond.getAssetBondDebtData();

    uint256 totalRetrieveAmount = accruedDebtOnMoneyPool + feeOnCollateralServiceProvider;

    Validation.validateRepay(reserve, assetBond);

    reserve.updateState(asset);

    IDToken(reserve.dTokenAddress).burn(assetBond.borrower, accruedDebtOnMoneyPool);

    reserve.updateRates(asset, totalRetrieveAmount, 0);

    IERC20(asset).safeTransferFrom(msg.sender, reserve.lTokenAddress, totalRetrieveAmount);

    ITokenizer(reserve.tokenizerAddress).releaseAssetBond(assetBond.borrower, tokenId);

    ILToken(reserve.lTokenAddress).mint(
      assetBond.collateralServiceProvider,
      feeOnCollateralServiceProvider,
      reserve.lTokenInterestIndex
    );

    /*
    console.log(
      'Borrow finalize |amount|lastUpdateTimestamp|borrowAPY',
      borrowAmount,
      reserve.lastUpdateTimestamp,
      reserve.borrowAPY
    );
    */

    emit Repay(
      asset,
      assetBond.borrower,
      tokenId,
      accruedDebtOnMoneyPool,
      feeOnCollateralServiceProvider
    );
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

  /************ Configuration Functions ************/

  // Need access control, onlyConfigurator can add new reserve.
  function addNewReserve(
    address asset,
    address lToken,
    address dToken,
    address interestModel,
    address tokenizer,
    uint256 moneyPoolFactor_
  ) external override {
    DataStruct.ReserveData memory newReserveData =
      DataStruct.ReserveData({
        moneyPoolFactor: moneyPoolFactor_,
        lTokenInterestIndex: WadRayMath.ray(),
        borrowAPY: 0,
        depositAPY: 0,
        totalDepositedAssetBondCount: 0,
        lastUpdateTimestamp: block.timestamp,
        lTokenAddress: lToken,
        dTokenAddress: dToken,
        interestModelAddress: interestModel,
        tokenizerAddress: tokenizer,
        id: 0,
        isPaused: false,
        isActivated: true
      });

    _reserves[asset] = newReserveData;
    _addNewReserveToList(asset);

    emit NewReserve(asset, lToken, dToken, interestModel, tokenizer, moneyPoolFactor_);
  }

  function _addNewReserveToList(address asset) internal {
    uint256 reserveCount = _reserveCount;

    if (reserveCount >= _maxReserveCount) revert MoneyPoolErrors.MaxReserveCountExceeded();

    if (_reserves[asset].id != 0) revert MoneyPoolErrors.DigitalAssetAlreadyAdded(asset);

    _reserves[asset].id = uint8(reserveCount);
    _reservesList[reserveCount] = asset;

    _reserveCount = reserveCount + 1;
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
