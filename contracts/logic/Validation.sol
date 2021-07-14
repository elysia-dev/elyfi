// SPDX-License-Identifier: MIT
pragma solidity 0.8.3;

import '../libraries/DataStruct.sol';
import '../libraries/Math.sol';
import '../interfaces/ILToken.sol';

library Validation {
  using WadRayMath for uint256;
  using Validation for DataStruct.ReserveData;

  /**
   * @dev Validate Deposit
   * Check reserve state
   * @param reserve The reserve object
   * @param amount Deposit amount
   **/
<<<<<<< HEAD
  function validateDeposit(DataStruct.ReserveData storage reserve, uint256 amount) internal view {
    require(amount != 0, 'InvalidAmount');
    require(reserve.isPaused, 'ReservePaused');
    require(!reserve.isActivated, 'ReserveInactivated');
=======
  function validateDeposit(DataStruct.ReserveData storage reserve, uint256 amount) external view {
    if (amount == 0) revert MoneyPoolErrors.InvalidAmount(amount);
    if (reserve.isPaused == true) revert MoneyPoolErrors.ReservePaused();
    if (reserve.isActivated == false) revert MoneyPoolErrors.ReserveInactivated();
>>>>>>> Feat/SeperateLibrary
  }

  /**
   * @dev Validate Withdraw
   * Check reserve state
   * Check user amount
   * Check user total debt(later)
   * @param reserve The reserve object
   * @param amount Withdraw amount
   **/
  function validateWithdraw(
    DataStruct.ReserveData storage reserve,
    address asset,
    uint256 amount,
    uint256 userLTokenBalance
<<<<<<< HEAD
  ) internal view {
    require(amount != 0, 'InvalidAmount');
    require(reserve.isPaused, 'ReservePaused');
    require(!reserve.isActivated, 'ReserveInactivated');
    require(amount <= userLTokenBalance, 'WithdrawInsufficientBalance');
=======
  ) external view {
    if (amount == 0) revert MoneyPoolErrors.InvalidAmount(amount);
    if (reserve.isPaused == true) revert MoneyPoolErrors.ReservePaused();
    if (reserve.isActivated == false) revert MoneyPoolErrors.ReserveInactivated();
    if (amount > userLTokenBalance)
      revert MoneyPoolErrors.WithdrawInsufficientBalance(amount, userLTokenBalance);
>>>>>>> Feat/SeperateLibrary
    uint256 availableLiquidity = IERC20(asset).balanceOf(reserve.lTokenAddress);
    require(availableLiquidity > amount, 'NotEnoughLiquidityToWithdraw');
  }

  function validateBorrow(
    DataStruct.ReserveData storage reserve,
    DataStruct.AssetBondData memory assetBond,
    address asset,
    uint256 borrowAmount
<<<<<<< HEAD
  ) internal view {
    require(reserve.isPaused, 'ReservePaused');
    require(!reserve.isActivated, 'ReserveInactivated');
    require(assetBond.state == DataStruct.AssetBondState.CONFIRMED, 'OnlySignedTokenBorrowAllowed');
    require(msg.sender == assetBond.collateralServiceProvider, 'OnlyAssetBondOwnerBorrowAllowed');
=======
  ) external view {
    if (reserve.isPaused == true) revert MoneyPoolErrors.ReservePaused();
    if (reserve.isActivated == false) revert MoneyPoolErrors.ReserveInactivated();

    if (assetBond.state != DataStruct.AssetBondState.CONFIRMED)
      revert MoneyPoolErrors.OnlySignedTokenBorrowAllowed();

    if (msg.sender != assetBond.collateralServiceProvider)
      revert MoneyPoolErrors.OnlyAssetBondOwnerBorrowAllowed();

>>>>>>> Feat/SeperateLibrary
    uint256 availableLiquidity = IERC20(asset).balanceOf(reserve.lTokenAddress);
    require(availableLiquidity > borrowAmount, 'NotEnoughLiquidityToLoan');
    require(block.timestamp >= assetBond.loanStartTimestamp, 'NotTimeForLoanStart');
    require(assetBond.loanStartTimestamp + 18 hours >= block.timestamp, 'TimeOutForCollateralize');
  }

  function validateLTokenTrasfer() internal pure {}

  function validateRepay(
    DataStruct.ReserveData storage reserve,
    DataStruct.AssetBondData memory assetBond
<<<<<<< HEAD
  ) internal view {
    require(!reserve.isActivated, 'ReserveInactivated');
    require(block.timestamp < assetBond.liquidationTimestamp, 'LoanExpired');
    require(
      (assetBond.state == DataStruct.AssetBondState.COLLATERALIZED ||
        assetBond.state == DataStruct.AssetBondState.DELINQUENT),
      'OnlyCollateralizedOrDelinquentAssetBondRepayable'
    );
=======
  ) external view {
    if (reserve.isActivated == false) revert MoneyPoolErrors.ReserveInactivated();
    if (block.timestamp >= assetBond.liquidationTimestamp) revert MoneyPoolErrors.LoanExpired();
    if (
      !(assetBond.state == DataStruct.AssetBondState.COLLATERALIZED ||
        assetBond.state == DataStruct.AssetBondState.DELINQUENT)
    )
      revert MoneyPoolErrors.OnlyCollateralizedOrDelinquentAssetBondRepayable(
        uint256(assetBond.state)
      );
>>>>>>> Feat/SeperateLibrary
  }

  function validateLiquidation(
    DataStruct.ReserveData storage reserve,
    DataStruct.AssetBondData memory assetBond
<<<<<<< HEAD
  ) internal view {
    require(!reserve.isActivated, 'ReserveInactivated');
    require(
      assetBond.state == DataStruct.AssetBondState.LIQUIDATED,
      'OnlyNotPerformedAssetBondLiquidatable'
    );
  }

  function validateSignAssetBond(DataStruct.AssetBondData storage assetBond) internal view {
    require(assetBond.state == DataStruct.AssetBondState.SETTLED, 'OnlySettledTokenSignAllowed');
    require(assetBond.signer == msg.sender, 'OnlyDesignatedSignerAllowed');
  }

  function validateSettleAssetBond(DataStruct.AssetBondData memory assetBond) internal view {
    require(block.timestamp < assetBond.loanStartTimestamp, 'SettledLoanStartTimestampInvalid');
    require(assetBond.loanStartTimestamp != assetBond.maturityTimestamp, 'LoanDurationInvalid');
=======
  ) external view {
    if (reserve.isActivated == false) revert MoneyPoolErrors.ReserveInactivated();
    if (assetBond.state != DataStruct.AssetBondState.LIQUIDATED)
      revert MoneyPoolErrors.OnlyNotPerformedAssetBondLiquidatable(uint256(assetBond.state));
  }

  function validateSignAssetBond(DataStruct.AssetBondData storage assetBond) external view {
    if (assetBond.state != DataStruct.AssetBondState.SETTLED)
      revert TokenizerErrors.OnlySettledTokenSignAllowed();
    if (assetBond.signer != msg.sender) revert TokenizerErrors.OnlyDesignatedSignerAllowed();
  }

  function validateSettleAssetBond(DataStruct.AssetBondData memory assetBond) external view {
    if (block.timestamp >= assetBond.loanStartTimestamp)
      revert TokenizerErrors.SettledLoanStartTimestampInvalid();
    if (assetBond.loanStartTimestamp == assetBond.maturityTimestamp)
      revert TokenizerErrors.LoanDurationInvalid();
>>>>>>> Feat/SeperateLibrary
  }

  function validateTokenId(DataStruct.AssetBondIdData memory idData) internal pure {
    require(idData.collateralLatitude < 90, 'InvaildLatitude');
    require(idData.collateralLongitude < 180, 'InvaildLongitude');
  }
}
