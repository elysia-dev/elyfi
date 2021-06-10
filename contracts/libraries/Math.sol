// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import './WadRayMath.sol';
import './TimeConverter.sol';

library Math {
  using WadRayMath for uint256;

  uint256 internal constant SECONDSPERYEAR = 365 days;

  function calculateLinearInterest(
    uint256 rate,
    uint256 lastUpdateTimestamp,
    uint256 currentTimestamp
  ) internal pure returns (uint256) {
    uint256 timeDelta = currentTimestamp - uint256(lastUpdateTimestamp);

    return ((rate * timeDelta) / SECONDSPERYEAR) + WadRayMath.ray();
  }

  /**
   * @notice Author : AAVE
   * @dev Function to calculate the interest using a compounded interest rate formula
   * To avoid expensive exponentiation, the calculation is performed using a binomial approximation:
   *  (1+x)^n = 1+n*x+[n/2*(n-1)]*x^2+[n/6*(n-1)*(n-2)*x^3...
   *
   * The approximation slightly underpays liquidity providers and undercharges borrowers, with the advantage of great gas cost reductions
   * The whitepaper contains reference to the approximation and a table showing the margin of error per different time periods
   *
   * @param rate The interest rate, in ray
   * @param lastUpdateTimestamp The timestamp of the last update of the interest
   * @return The interest rate compounded during the timeDelta, in ray
   **/
  function calculateCompoundedInterest(
    uint256 rate,
    uint256 lastUpdateTimestamp,
    uint256 currentTimestamp
  ) internal pure returns (uint256) {
    //solium-disable-next-line
    uint256 exp = currentTimestamp - uint256(lastUpdateTimestamp);

    if (exp == 0) {
      return WadRayMath.ray();
    }

    uint256 expMinusOne = exp - 1;

    uint256 expMinusTwo = exp > 2 ? exp - 2 : 0;

    uint256 ratePerSecond = rate / SECONDSPERYEAR;

    uint256 basePowerTwo = ratePerSecond.rayMul(ratePerSecond);
    uint256 basePowerThree = basePowerTwo.rayMul(ratePerSecond);

    uint256 secondTerm = (exp * expMinusOne * basePowerTwo) / 2;
    uint256 thirdTerm = (exp * expMinusOne * expMinusTwo * basePowerThree) / 6;

    return WadRayMath.ray() + (ratePerSecond * exp) + secondTerm + thirdTerm;
  }

  function calculateRateInIncreasingBalance(
    uint256 averageRate,
    uint256 totalBalance,
    uint256 amountIn,
    uint256 rate
  ) internal pure returns (uint256, uint256) {
    uint256 weightedAverageRate = totalBalance.wadToRay().rayMul(averageRate);
    uint256 weightedAmountRate = amountIn.wadToRay().rayMul(rate);

    uint256 newTotalBalance = totalBalance + amountIn;
    uint256 newAverageRate =
      (weightedAverageRate + weightedAmountRate).rayDiv(newTotalBalance.wadToRay());

    return (newTotalBalance, newAverageRate);
  }

  function calculateRateInDecreasingBalance(
    uint256 averageRate,
    uint256 totalBalance,
    uint256 amountOut,
    uint256 rate
  ) internal pure returns (uint256, uint256) {
    // if decreasing amount exceeds totalBalance,
    // overall rate and balacne would be set 0
    if (totalBalance <= amountOut) {
      return (0, 0);
    }

    uint256 weightedAverageRate = totalBalance.wadToRay().rayMul(averageRate);
    uint256 weightedAmountRate = amountOut.wadToRay().rayMul(rate);

    if (weightedAverageRate <= weightedAmountRate) {
      return (0, 0);
    }

    uint256 newTotalBalance = totalBalance - amountOut;

    uint256 newAverageRate =
      (weightedAverageRate - weightedAmountRate).rayDiv(newTotalBalance.wadToRay());

    return (newTotalBalance, newAverageRate);
  }

  struct CalculateFeeOnRepaymentLocalVars {
    TimeConverter.DateTime paymentDateTimeStruct;
    uint256 paymentDate;
    uint256 firstTermRate;
    uint256 secondTermRate;
    uint256 secondTermOverdueRate;
    uint256 thirdTermRate;
    uint256 totalRate;
  }

  function calculateFeeOnRepayment(
    uint256 principal,
    uint256 couponRate,
    uint256 interestRate,
    uint256 overdueInterestRate,
    uint256 paymentTimestamp,
    uint256 effectiveTimestamp,
    uint256 collateralizeTimestamp,
    uint256 maturityTimestamp,
    uint256 liquidationTimestamp
  ) internal pure returns (uint256) {
    CalculateFeeOnRepaymentLocalVars memory vars;

    vars.firstTermRate = calculateCompoundedInterest(
      couponRate,
      effectiveTimestamp,
      collateralizeTimestamp
    );

    vars.paymentDateTimeStruct = TimeConverter.parseTimestamp(paymentTimestamp);
    vars.paymentDate = TimeConverter.toTimestamp(
      vars.paymentDateTimeStruct.year,
      vars.paymentDateTimeStruct.month,
      vars.paymentDateTimeStruct.day + 1
    );

    if (paymentTimestamp <= liquidationTimestamp) {
      vars.secondTermRate =
        calculateCompoundedInterest(
          couponRate - interestRate,
          collateralizeTimestamp,
          paymentTimestamp
        ) -
        WadRayMath.ray();
      vars.thirdTermRate =
        calculateCompoundedInterest(couponRate, paymentTimestamp, vars.paymentDate) -
        WadRayMath.ray();

      vars.totalRate = vars.firstTermRate + vars.secondTermRate + vars.thirdTermRate;

      return principal.rayMul(vars.totalRate);
    }

    vars.secondTermRate =
      calculateCompoundedInterest(
        couponRate - interestRate,
        collateralizeTimestamp,
        maturityTimestamp
      ) -
      WadRayMath.ray();
    vars.secondTermOverdueRate =
      calculateCompoundedInterest(
        couponRate + overdueInterestRate - interestRate,
        maturityTimestamp,
        paymentTimestamp
      ) -
      WadRayMath.ray();
    vars.thirdTermRate =
      calculateCompoundedInterest(
        couponRate + overdueInterestRate,
        paymentTimestamp,
        vars.paymentDate
      ) -
      WadRayMath.ray();

    vars.totalRate =
      vars.firstTermRate +
      vars.secondTermRate +
      vars.secondTermOverdueRate +
      vars.thirdTermRate;

    return principal.rayMul(vars.totalRate);
  }

  struct CalculateDebtAmountToLiquidationLocalVars {
    TimeConverter.DateTime paymentDateTimeStruct;
    uint256 paymentDate;
    uint256 firstTermRate;
    uint256 secondTermRate;
    uint256 totalRate;
  }

  function calculateDebtAmountToLiquidation(
    uint256 principal,
    uint256 couponRate,
    uint256 overdueInterestRate,
    uint256 effectiveTimestamp,
    uint256 paymentTimestamp,
    uint256 maturityTimestamp
  ) internal pure returns (uint256) {
    CalculateDebtAmountToLiquidationLocalVars memory vars;
    vars.firstTermRate = calculateCompoundedInterest(
      couponRate,
      effectiveTimestamp,
      maturityTimestamp
    );

    vars.paymentDateTimeStruct = TimeConverter.parseTimestamp(paymentTimestamp);
    vars.paymentDate = TimeConverter.toTimestamp(
      vars.paymentDateTimeStruct.year,
      vars.paymentDateTimeStruct.month,
      vars.paymentDateTimeStruct.day + 1
    );

    vars.secondTermRate =
      calculateCompoundedInterest(
        couponRate + overdueInterestRate,
        maturityTimestamp,
        vars.paymentDate
      ) -
      WadRayMath.ray();
    vars.totalRate = vars.firstTermRate + vars.secondTermRate;
    return principal.rayMul(vars.totalRate);
  }
}
