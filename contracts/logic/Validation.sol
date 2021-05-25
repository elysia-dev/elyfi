// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '../libraries/DataStruct.sol';
import '../libraries/Errors.sol';
import '../libraries/Math.sol';
import '../interfaces/IDToken.sol';

library Validation {
  using WadRayMath for uint256;
  using Validation for DataStruct.ReserveData;

  /**
   * @dev Validate Invest
   * Check reserve state
   * @param reserve The reserve object
   * @param amount Investment amount
   **/
  function validateInvestMoneyPool(DataStruct.ReserveData storage reserve, uint256 amount)
    internal
    view
  {
    if (amount == 0) revert(); //// InvalidAmount(amount)

    if (reserve.isPaused == true) revert(); //// ReservePaused();

    if (reserve.isActivated == false) revert(); //// ReserveInactivated();
  }

  /**
   * @dev Validate WithdrawMoneyPool
   * Check reserve state
   * Check user amount
   * Check user total debt(later)
   * @param reserve The reserve object
   * @param userInfo User info
   * @param underlyingAsset Underlying asset address
   * @param amount Withdraw amount
   * @param reserveList reserve list for calculating user total debt
   * @param reserveCount reserve count for iteration
   **/
  function validateWithdrawMoneyPool(
    DataStruct.ReserveData storage reserve,
    DataStruct.UserInfo storage userInfo,
    address underlyingAsset,
    uint256 amount,
    uint256 userLTokenBalance,
    mapping(uint256 => address) storage reserveList,
    uint256 reserveCount
  ) internal view {
    if (amount == 0) revert(); //// InvalidAmount(amount)
    if (reserve.isPaused == true) revert(); //// ReservePaused();
    if (reserve.isActivated == false) revert(); //// ReserveInactivated();
    if (amount > userLTokenBalance) revert(); //// WithdrawInsufficientBalance(amount, userLTokenBalance);
  }

  /**
   * @dev Validate invest ABToken
   * Check reserve state
   * Check ABToken state
   * Check user amount
   * Check user total debt(later)
   * @param reserve The reserve object
   * @param assetBond The assetBond object
   * @param amount Withdraw amount
   **/
  function validateInvestABToken(
    DataStruct.ReserveData storage reserve,
    DataStruct.AssetBondData memory assetBond,
    uint256 amount,
    uint256 moneyPoolATokenBalance
  ) internal view {
    if (amount == 0) revert(); //// InvalidAmount(amount)
    if (reserve.isPaused == true) revert(); //// ReservePaused();
    if (reserve.isActivated == false) revert(); //// ReserveInactivated();

    //if(assetBond.isMatured == true) revert(); //// MaturedABToken();
    //if(assetBond.isDeposited == false) revert(); //// NotDepositedABToken();
    if (moneyPoolATokenBalance < amount) revert(); //// InsufficientATokenBalance(reserve.totalDepositedATokenBalance);
  }

  function validateBorrowAgainstAssetBond(
    DataStruct.ReserveData storage reserve,
    DataStruct.AssetBondData memory assetBond,
    address asset,
    uint256 borrowAmount
  ) internal view {
    // moneypool validate logic : active, frozen

    // check settled logic
    //if (assetBond.isSettled == true) revert(); //// NotSettledABToken(id);

    // check sign logic
    //if (assetBond.isSigned == false) revert(); ////NotSignedABToken(id);

    uint256 availableLiquidity = IERC20Upgradeable(asset).balanceOf(reserve.lTokenAddress);
  }

  function validateLTokenTrasfer() internal pure {}
}
