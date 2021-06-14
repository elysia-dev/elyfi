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
   * @dev Validate Invest
   * Check reserve state
   * @param reserve The reserve object
   * @param amount Investment amount
   **/
  function validateInvest(DataStruct.ReserveData storage reserve, uint256 amount) internal view {
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
    // moneypool validate logic : active, frozen

    // check settled logic
    //if (assetBond.isSettled == true) revert MoneyPoolErrors.NotSettledAssetBond(id);

    // check sign logic
    //if (assetBond.isSigned == false) revertNValidationErrors.otSignedAssetBond(id);

    uint256 availableLiquidity = IERC20(asset).balanceOf(reserve.lTokenAddress);
  }

  function validateLTokenTrasfer() internal pure {}

  function validateRepay(
    DataStruct.ReserveData storage reserve,
    DataStruct.AssetBondData memory assetBond,
    address borrower,
    uint256 userDTokenBalance,
    uint256 feeOnCollateralServiceProvider
  ) internal view {}

  function validateSignAssetBond(DataStruct.AssetBondData storage assetBond) internal view {}

  function validateSettleAssetBond(DataStruct.AssetBondData memory assetBond) internal view {
    // checks whether signer authorized
    // checks the asset bond is 'EMPTY' state
    // access control : check signer
    // it('reverts if block.timestamp exceeds loan start timestamp exceeds', async () => {});
    // it('reverts if loan start timestamp exceeds maturity timestamp', async () => {});
    // it('reverts if signer is not council role', async () => {});
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
