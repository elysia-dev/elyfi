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
 * to invest and withdraw cryptocurrency and create NFT-backed loans.
 * @author ELYSIA
 * @notice This contract is beta version of ELYFI. The investor and borrower
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

  /************ MoneyPool Investment Functions ************/

  /**
   * @notice By depositing virtual assets in the MoneyPool and supply liquidity,
   * investors can receive interest accruing from the MoneyPool.
   * The return on the investment arises from the interest on real asset backed loans.
   * MoneyPool investors who deposit certain cryptoassets receives LTokens equivalent to the
   * deposit amount. LTokens are backed by cryptoassets deposited in the MoneyPool in a
   * 1:1 ratio.
   * @dev Invests an amount of underlying asset and receive corresponding LTokens.
   * @param asset The address of the underlying asset to invest
   * @param account The address that will receive the LToken
   * @param amount Investment amount
   **/
  function invest(
    address asset,
    address account,
    uint256 amount
  ) external override {
    DataStruct.ReserveData storage reserve = _reserves[asset];

    // validation
    // Check pool activation
    Validation.validateInvest(reserve, amount);

    // update indexes and mintToReserve
    reserve.updateState();

    // update rates
    reserve.updateRates(asset, amount, 0);

    // transfer underlying asset
    // If transfer fail, reverts
    IERC20(asset).safeTransferFrom(msg.sender, reserve.lTokenAddress, amount);

    // Mint ltoken
    ILToken(reserve.lTokenAddress).mint(account, amount, reserve.lTokenInterestIndex);

    /*
    console.log(
      'Invest finalize |amount|lTokenInterestIndex|borrowAPR',
      amount,
      reserve.lastUpdateTimestamp,
      reserve.borrowAPR
    );
    */
    emit Invest(asset, account, amount);
  }

  /**
   * @notice The investors can seize their virtual assets deposited in the MoneyPool whenever they wish.
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

    // validation
    // Without digital asset borrow, validation might be quite simple.
    Validation.validateWithdraw(
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
    reserve.updateRates(asset, 0, amountToWithdraw);

    // Burn ltoken
    ILToken(reserve.lTokenAddress).burn(
      msg.sender,
      account,
      amountToWithdraw,
      reserve.lTokenInterestIndex
    );

    emit Withdraw(asset, msg.sender, account, amountToWithdraw);
  }

  /************ AssetBond Formation Functions ************/

  // need access control signer: only lawfirm or asset owner
  // need access control : only minter

  /**
   * @dev Withdraws an amount of underlying asset from the reserve and burns the corresponding lTokens.
   * @notice
   * @param asset The address of the underlying asset to withdraw
   * @param receiver The address that will receive the underlying asset
   * @param borrowAmount borrowAmount
   **/
  function borrow(
    address asset,
    address receiver,
    uint256 borrowAmount,
    uint256 tokenId
  ) external override onlyCollateralServiceProvider {
    DataStruct.ReserveData storage reserve = _reserves[asset];
    DataStruct.AssetBondData memory assetBond =
      ITokenizer(reserve.tokenizerAddress).getAssetBondData(tokenId);

    // Check if borrow amount exceeds collateral value
    // Check if borrow amount exceeds liquidity available
    Validation.validateBorrow(reserve, assetBond, asset, borrowAmount);

    reserve.updateState();

    // update interest rate

    ITokenizer(reserve.tokenizerAddress).collateralizeAssetBond(
      msg.sender,
      tokenId,
      borrowAmount,
      reserve.borrowAPR
    );

    // transfer asset bond
    // or lock NFT?

    IDToken(reserve.dTokenAddress).mint(msg.sender, receiver, borrowAmount, reserve.borrowAPR);

    reserve.updateRates(asset, 0, borrowAmount);

    // transfer Underlying asset
    ILToken(reserve.lTokenAddress).transferUnderlyingTo(receiver, borrowAmount);

    /*
    console.log(
      'Borrow finalize |amount|lastUpdateTimestamp|borrowAPR',
      borrowAmount,
      reserve.lastUpdateTimestamp,
      reserve.borrowAPR
    );
    */

    emit Borrow(asset, msg.sender, receiver, tokenId, reserve.borrowAPR, borrowAmount);
  }

  /**
   * @dev Withdraws an amount of underlying asset from the reserve and burns the corresponding lTokens.
   * @notice
   * @param asset The address of the underlying asset to withdraw
   * @param amount borrowAmount
   **/
  function repay(
    address asset,
    uint256 amount,
    uint256 tokenId
  ) external {
    DataStruct.ReserveData storage reserve = _reserves[asset];
    DataStruct.AssetBondData memory assetBond =
      ITokenizer(reserve.tokenizerAddress).getAssetBondData(tokenId);

    (uint256 accruedDebtOnMoneyPool, uint256 feeOnCollateralServiceProvider) =
      assetBond.getAssetBondDebtData();

    uint256 totalRetrieveAmount = accruedDebtOnMoneyPool + feeOnCollateralServiceProvider;

    if (amount < totalRetrieveAmount) {
      revert MoneyPoolErrors.EarlyRepaymentNotAllowed(amount, totalRetrieveAmount);
    }

    Validation.validateRepay(
      reserve,
      assetBond,
      assetBond.borrower,
      accruedDebtOnMoneyPool,
      feeOnCollateralServiceProvider
    );

    reserve.updateState();

    IDToken(reserve.dTokenAddress).burn(assetBond.borrower, accruedDebtOnMoneyPool);

    // update interest rate
    reserve.updateRates(asset, totalRetrieveAmount, 0);

    // transfer asset bond
    IERC20(asset).safeTransferFrom(msg.sender, reserve.lTokenAddress, totalRetrieveAmount);

    ITokenizer(reserve.tokenizerAddress).releaseAssetBond(assetBond.borrower, tokenId);

    // Mint ltoken
    ILToken(reserve.lTokenAddress).mint(
      assetBond.collateralServiceProvider,
      feeOnCollateralServiceProvider,
      reserve.lTokenInterestIndex
    );

    /*
    console.log(
      'Borrow finalize |amount|lastUpdateTimestamp|borrowAPR',
      borrowAmount,
      reserve.lastUpdateTimestamp,
      reserve.borrowAPR
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
        borrowAPR: 0,
        supplyAPR: 0,
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
