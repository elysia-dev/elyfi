import { BigNumber } from "ethers";
import { RAY, rayMul, SECONDSPERYEAR } from "./Ethereum";

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