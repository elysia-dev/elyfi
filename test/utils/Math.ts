import { BigNumber } from "ethers";
import { RAY, rayDiv, rayMul, SECONDSPERYEAR, wadToRay } from "./Ethereum";

export function calculateLinearInterest(
    rate: BigNumber,
    lastUpdateTimestamp: BigNumber,
    currentTimestamp: BigNumber
): BigNumber {
    const timeDelta = currentTimestamp.sub(lastUpdateTimestamp)

    return ((rate.mul(timeDelta).div(SECONDSPERYEAR)).add(RAY))
}

export function calculateCompoundedInterest(
    rate: BigNumber,
    lastUpdateTimestamp: BigNumber,
    currentTimestamp: BigNumber
): BigNumber {
    const timeDelta = currentTimestamp.sub(lastUpdateTimestamp)

    const expMinusOne = timeDelta.sub(1);
    const expMinusTwo = timeDelta.gt(2) ? timeDelta.sub(2) : 0;

    const ratePerSecond = rate.div(SECONDSPERYEAR);

    const basePowerTwo = rayMul(ratePerSecond, ratePerSecond);
    const basePowerThree = rayMul(basePowerTwo, ratePerSecond);

    const secondTerm = timeDelta.mul(expMinusOne).mul(basePowerTwo).div(2);
    const thirdTerm = timeDelta
      .mul(expMinusOne)
      .mul(expMinusTwo)
      .mul(basePowerThree)
      .div(6);

    return RAY
      .add(ratePerSecond.mul(timeDelta))
      .add(secondTerm)
      .add(thirdTerm);
}

/******************* updateState functions *******************/

export function calculateLTokenIndexAfterAction(
    timeStampBeforeAction: BigNumber,
    supplyAPR: BigNumber,
    lTokenIndexBeforeAction: BigNumber,
    timeStampAfterAction: BigNumber
): BigNumber {
    const accruedInterest = calculateLinearInterest(
        supplyAPR,
        timeStampBeforeAction,
        timeStampAfterAction
    )

    return rayMul(lTokenIndexBeforeAction, accruedInterest)
}

export function calculateDTokenIndexAfterAction(
    timeStampBeforeAction: BigNumber,
    digitalAssetAPR: BigNumber,
    dTokenIndexBeforeAction: BigNumber,
    timeStampAfterAction: BigNumber
): BigNumber {
    const accruedInterest = calculateCompoundedInterest(
        digitalAssetAPR,
        timeStampBeforeAction,
        timeStampAfterAction
    )

    return rayMul(dTokenIndexBeforeAction, accruedInterest)
}


export function calculateRateInIncreasingBalance(
    averageRateBefore: BigNumber,
    totalBalanceBefore: BigNumber,
    amount: BigNumber,
    rate: BigNumber,
): BigNumber {
    const weightedAverageRate = rayMul(wadToRay(totalBalanceBefore), averageRateBefore);
    const weightedAmountRate = rayMul(wadToRay(amount), rate);

    const newTotalBalance = totalBalanceBefore.add(amount)
    const newAverageRate = rayDiv((weightedAmountRate.add(weightedAverageRate)), newTotalBalance);

    return newAverageRate;
}

export function calculateRateInDecreasingBalance(
    averageRateBefore: BigNumber,
    totalBalanceBefore: BigNumber,
    amount: BigNumber,
    rate: BigNumber,
): BigNumber {
    if (totalBalanceBefore.lte(amount)) {
        return BigNumber.from(0);
    }

    const weightedAverageRate = rayMul(wadToRay(totalBalanceBefore), averageRateBefore);
    const weightedAmountRate = rayMul(wadToRay(amount), rate);

    if (weightedAverageRate.lte(weightedAmountRate)) {
        return BigNumber.from(0);
    }

    const newTotalBalance = totalBalanceBefore.add(amount)
    const newAverageRate = rayDiv((weightedAmountRate.add(weightedAverageRate)), newTotalBalance);

    return newAverageRate;
}
