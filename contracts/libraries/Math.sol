// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "./WadRayMath.sol";

library Math {
    using WadRayMath for uint256;

    uint256 internal constant SECONDSPERYEAR = 365 days;

    function calculateLinearInterest(
        uint256 rate,
        uint40 lastUpdateTimestamp,
        uint256 currentTimestamp)
        internal
        pure
        returns (uint256)
    {
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
        uint40 lastUpdateTimestamp,
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

        uint256 secondTerm = exp * expMinusOne * basePowerTwo / 2;
        uint256 thirdTerm = exp * expMinusOne * expMinusTwo * basePowerThree / 6;

        return WadRayMath.ray() + (ratePerSecond * exp) + secondTerm + thirdTerm;
    }

    function calculateAverageAPR(
        uint256 currentAverageRate,
        uint256 currentTotalAmount,
        uint256 amount,
        uint256 rate
    ) internal pure returns (uint256, uint256) {
        uint256 amountIn = amount.rayMul(rate);
        uint256 newTotalAmount = currentTotalAmount + amountIn;

        uint256 newAverageRate = (currentAverageRate
            .rayMul(currentTotalAmount.wadToRay())
            + (rate.rayMul(amount))
            ).rayDiv(newTotalAmount.wadToRay());

        return (
            newAverageRate,
            newTotalAmount
        );
    }
}
