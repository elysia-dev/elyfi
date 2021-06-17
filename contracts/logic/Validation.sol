// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '../libraries/DataStruct.sol';
import '../libraries/Errors.sol';
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
   * @param underlyingAsset Underlying asset address
   * @param amount Withdraw amount
   * @param reserveList reserve list for calculating user total debt
   * @param reserveCount reserve count for iteration
   **/
  function validateWithdraw(
    DataStruct.ReserveData storage reserve,
    address underlyingAsset,
    uint256 amount,
    uint256 userLTokenBalance,
    mapping(uint256 => address) storage reserveList,
    uint256 reserveCount
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

    if (block.timestamp <= assetBond.loanStartTimestamp)
      revert MoneyPoolErrors.NotTimeForLoanStart();
    // check sign logic
    //if (assetBond.isSigned == false) revertNValidationErrors.otSignedAssetBond(id);

    uint256 availableLiquidity = IERC20(asset).balanceOf(reserve.lTokenAddress);

    if (availableLiquidity <= borrowAmount) revert MoneyPoolErrors.NotEnoughLiquidityToLoan();
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
  ) internal view {}

  function validateSignAssetBond(DataStruct.AssetBondData storage assetBond) internal view {
    if (assetBond.state != DataStruct.AssetBondState.SETTLED)
      revert TokenizerErrors.OnlySettledTokenSignAllowed();
  }

  function validateSettleAssetBond(DataStruct.AssetBondData memory assetBond) internal view {
    // checks whether signer authorized
    // checks the asset bond is 'EMPTY' state

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
