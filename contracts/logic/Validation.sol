// SPDX-License-Identifier: MIT
pragma solidity 0.8.3;

import '../libraries/DataStruct.sol';
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
    require(amount != 0, 'InvalidAmount');
    require(reserve.isPaused != true, 'ReservePaused');
    require(reserve.isActivated != false, 'ReserveInactivated');
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
  ) internal view {
    require(amount != 0, 'InvalidAmount');
    require(reserve.isPaused != true, 'ReservePaused');
    require(reserve.isActivated != false, 'ReserveInactivated');
    require(amount <= userLTokenBalance, 'WithdrawInsufficientBalance');
    uint256 availableLiquidity = IERC20(asset).balanceOf(reserve.lTokenAddress);
    require(availableLiquidity > amount, 'NotEnoughLiquidityToWithdraw');
  }

  function validateBorrow(
    DataStruct.ReserveData storage reserve,
    DataStruct.AssetBondData memory assetBond,
    address asset,
    uint256 borrowAmount
  ) internal view {
    require(reserve.isPaused != true, 'ReservePaused');
    require(reserve.isActivated != false, 'ReserveInactivated');
    require(assetBond.state == DataStruct.AssetBondState.CONFIRMED, 'OnlySignedTokenBorrowAllowed');
    require(msg.sender == assetBond.collateralServiceProvider, 'OnlyAssetBondOwnerBorrowAllowed');
    uint256 availableLiquidity = IERC20(asset).balanceOf(reserve.lTokenAddress);
    require(availableLiquidity > borrowAmount, 'NotEnoughLiquidityToLoan');
    require(block.timestamp >= assetBond.loanStartTimestamp, 'NotTimeForLoanStart');
    require(assetBond.loanStartTimestamp + 18 hours >= block.timestamp, 'TimeOutForCollateralize');
  }

  function validateLTokenTrasfer() internal pure {}

  function validateRepay(
    DataStruct.ReserveData storage reserve,
    DataStruct.AssetBondData memory assetBond
  ) internal view {
    require(reserve.isActivated != false, 'ReserveInactivated');
    require(block.timestamp < assetBond.liquidationTimestamp, 'LoanExpired');
    require(
      (assetBond.state == DataStruct.AssetBondState.COLLATERALIZED ||
        assetBond.state == DataStruct.AssetBondState.DELINQUENT),
      'OnlyCollateralizedOrDelinquentAssetBondRepayable'
    );
  }

  function validateLiquidation(
    DataStruct.ReserveData storage reserve,
    DataStruct.AssetBondData memory assetBond
  ) internal view {
    require(reserve.isActivated != false, 'ReserveInactivated');
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
  }

  function validateTokenId(uint256 tokenId) internal pure {
    // validate id
    //// error InvalidAssetBondID(id)
  }
}
