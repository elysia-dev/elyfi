// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '../libraries/DataStruct.sol';
import '../libraries/Errors.sol';
import '../libraries/Math.sol';
import '../interfaces/ILToken.sol';
import 'hardhat/console.sol';

library Validation {
  using WadRayMath for uint256;
  using Validation for DataStruct.ReserveData;

  /**
   * @dev Validate Deposit
   * Check reserve state
   * @param reserve The reserve object
   * @param amount Deposit amount
   **/
  function validateDeposit(DataStruct.ReserveData storage reserve, uint256 amount) internal view {
    if (amount == 0) revert MoneyPoolErrors.InvalidAmount(amount);
    if (reserve.isPaused == true) revert MoneyPoolErrors.ReservePaused();
    if (reserve.isActivated == false) revert MoneyPoolErrors.ReserveInactivated();
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
    uint256 amount,
    uint256 userLTokenBalance
  ) internal view {
    if (amount == 0) revert MoneyPoolErrors.InvalidAmount(amount);
    if (reserve.isPaused == true) revert MoneyPoolErrors.ReservePaused();
    if (reserve.isActivated == false) revert MoneyPoolErrors.ReserveInactivated();
    if (amount > userLTokenBalance)
      revert MoneyPoolErrors.WithdrawInsufficientBalance(amount, userLTokenBalance);
  }

  function validateBorrow(
    DataStruct.ReserveData storage reserve,
    DataStruct.AssetBondData memory assetBond,
    address asset,
    uint256 borrowAmount
  ) internal view {
    if (reserve.isPaused == true) revert MoneyPoolErrors.ReservePaused();
    if (reserve.isActivated == false) revert MoneyPoolErrors.ReserveInactivated();

    if (assetBond.state != DataStruct.AssetBondState.CONFIRMED)
      revert MoneyPoolErrors.OnlySignedTokenBorrowAllowed();

    if (msg.sender != assetBond.collateralServiceProvider)
      revert MoneyPoolErrors.OnlyAssetBondOwnerBorrowAllowed();

    uint256 availableLiquidity = IERC20(asset).balanceOf(reserve.lTokenAddress);

    if (availableLiquidity <= borrowAmount) revert MoneyPoolErrors.NotEnoughLiquidityToLoan();

    if (block.timestamp < assetBond.loanStartTimestamp)
      revert MoneyPoolErrors.NotTimeForLoanStart();

    if (assetBond.loanStartTimestamp + 18 hours < block.timestamp)
      revert MoneyPoolErrors.TimeOutForCollateralize();
  }

  function validateLTokenTrasfer() internal pure {}

  function validateRepay(
    DataStruct.ReserveData storage reserve,
    DataStruct.AssetBondData memory assetBond
  ) internal view {
    if (reserve.isActivated == false) revert MoneyPoolErrors.ReserveInactivated();
    if (block.timestamp >= assetBond.liquidationTimestamp) revert MoneyPoolErrors.LoanExpired();
  }

  function validateLiquidation(
    DataStruct.ReserveData storage reserve,
    DataStruct.AssetBondData memory assetBond
  ) internal view {
    if (assetBond.state != DataStruct.AssetBondState.NOT_PERFORMED)
      revert MoneyPoolErrors.OnlyNotPerformedAssetBondLiquidatable(uint256(assetBond.state));
  }

  function validateSignAssetBond(DataStruct.AssetBondData storage assetBond) internal view {
    if (assetBond.state != DataStruct.AssetBondState.SETTLED)
      revert TokenizerErrors.OnlySettledTokenSignAllowed();
    if (assetBond.signer != msg.sender) revert TokenizerErrors.OnlyDesignatedSignerAllowed();
  }

  function validateSettleAssetBond(DataStruct.AssetBondData memory assetBond) internal view {
    if (block.timestamp >= assetBond.loanStartTimestamp)
      revert TokenizerErrors.SettledLoanStartTimestampInvalid();
    if (assetBond.loanStartTimestamp == assetBond.maturityTimestamp)
      revert TokenizerErrors.LoanDurationInvalid();
  }

  function validateTokenId(uint256 tokenId) internal {
    // validate id
    //// error InvalidAssetBondID(id)
  }
}
