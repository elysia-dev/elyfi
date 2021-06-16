// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import './InterestRateModelStorage.sol';
import './libraries/WadRayMath.sol';
import './interfaces/IInterestRateModel.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import 'hardhat/console.sol';

/**
 * @title ELYFI InterestRateModel
 * @author ELYSIA
 * @notice Interest rates model in ELYFI. ELYFI's interest rates are determined by algorithms.
 * When borrowing demand increases, borrowing interest and MoneyPool ROI increase,
 * suppressing excessove borrowing demand and inducing depositors to supply liquidity.
 * Therefore, ELYFI's interest rates are influenced by the Money Pool `utilizationRatio`.
 * The Money Pool utilization ratio is a variable representing the current borrowing
 * and deposit status of the Money Pool. The interest rates of ELYFI exhibits some form of kink.
 * They sharply change at some defined threshold, `optimalUtilazationRate`.
 */
contract InterestRateModel is IInterestRateModel, InterestRateModelStorage {
  using WadRayMath for uint256;

  /**
   * @param optimalUtilizationRate When the MoneyPool utilization ratio exceeds this parameter,
   * `optimalUtilizationRate`, the kinked rates model adjusts interests.
   * @param borrowRateBase The base interest rate.
   * @param borrowRateOptimal Interest rate when the Money Pool utilization ratio is optimal
   * @param borrowRateMax Interest rate when the Money Pool utilization ratio is 1
   */
  constructor(
    uint256 optimalUtilizationRate,
    uint256 borrowRateBase,
    uint256 borrowRateOptimal,
    uint256 borrowRateMax
  ) {
    _optimalUtilizationRate = optimalUtilizationRate;
    _borrowRateBase = borrowRateBase;
    _borrowRateOptimal = borrowRateOptimal;
    _borrowRateMax = borrowRateMax;
  }

  struct calculateRatesLocalVars {
    uint256 totalDebt;
    uint256 utilizationRate;
    uint256 newBorrowAPY;
    uint256 newDepositAPY;
  }

  /**
   * @dev
   * Calculation Example
   * Case1: under optimal U
   * baseRate = 2%, util = 40%, optimalRate = 10%, optimalUtil = 80%
   * result = 2+40*(10-2)/80 = 4%
   * Case2: over optimal U
   * optimalRate = 10%, util = 90%, maxRate = 100%, optimalUtil = 80%
   * result = 10+(90-80)*(100-10)/(100-80) = 55%
   */
  function calculateRates(
    uint256 lTokenAssetBalance,
    uint256 totalDTokenBalance,
    uint256 depositAmount,
    uint256 borrowAmount,
    uint256 moneyPoolFactor
  ) public view override returns (uint256, uint256) {
    calculateRatesLocalVars memory vars;

    vars.totalDebt = totalDTokenBalance;

    uint256 availableLiquidity = lTokenAssetBalance + depositAmount - borrowAmount;

    vars.utilizationRate = vars.totalDebt == 0
      ? 0
      : vars.totalDebt.rayDiv(availableLiquidity + vars.totalDebt);

    vars.newBorrowAPY = 0;

    if (vars.utilizationRate <= _optimalUtilizationRate) {
      vars.newBorrowAPY =
        _borrowRateBase +
        (
          (_borrowRateOptimal - _borrowRateBase).rayDiv(_optimalUtilizationRate).rayMul(
            vars.utilizationRate
          )
        );
    } else {
      vars.newBorrowAPY =
        _borrowRateOptimal +
        (
          (_borrowRateMax - _borrowRateOptimal)
            .rayDiv(WadRayMath.ray() - _optimalUtilizationRate)
            .rayMul(vars.utilizationRate - _borrowRateOptimal)
        );
    }

    vars.newDepositAPY = vars.newBorrowAPY.rayMul(vars.utilizationRate);

    return (vars.newBorrowAPY, vars.newDepositAPY);
  }
}
