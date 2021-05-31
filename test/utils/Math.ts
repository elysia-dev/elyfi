import { BigNumber } from 'ethers';
import { RAY, rayDiv, rayMul, SECONDSPERYEAR, wadToRay } from './Ethereum';
import { InterestModelParams } from './Interfaces';

export function calculateLinearInterest(
  rate: BigNumber,
  lastUpdateTimestamp: BigNumber,
  currentTimestamp: BigNumber
): BigNumber {
  const timeDelta = currentTimestamp.sub(lastUpdateTimestamp);

  return rate.mul(timeDelta).div(SECONDSPERYEAR).add(RAY);
}

export function calculateCompoundedInterest(
  rate: BigNumber,
  lastUpdateTimestamp: BigNumber,
  currentTimestamp: BigNumber
): BigNumber {
  const timeDelta = currentTimestamp.sub(lastUpdateTimestamp);

  const expMinusOne = timeDelta.sub(1);
  const expMinusTwo = timeDelta.gt(2) ? timeDelta.sub(2) : 0;

  const ratePerSecond = rate.div(SECONDSPERYEAR);

  const basePowerTwo = rayMul(ratePerSecond, ratePerSecond);
  const basePowerThree = rayMul(basePowerTwo, ratePerSecond);

  const secondTerm = timeDelta.mul(expMinusOne).mul(basePowerTwo).div(2);
  const thirdTerm = timeDelta.mul(expMinusOne).mul(expMinusTwo).mul(basePowerThree).div(6);

  return RAY.add(ratePerSecond.mul(timeDelta)).add(secondTerm).add(thirdTerm);
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
  );

  return rayMul(lTokenIndexBeforeAction, accruedInterest);
}

export function calculateRateInIncreasingBalance(
  averageRateBefore: BigNumber,
  totalBalanceBefore: BigNumber,
  amount: BigNumber,
  rate: BigNumber
): BigNumber {
  const weightedAverageRate = rayMul(wadToRay(totalBalanceBefore), averageRateBefore);
  const weightedAmountRate = rayMul(wadToRay(amount), rate);

  const newTotalBalance = totalBalanceBefore.add(amount);
  const newAverageRate = rayDiv(weightedAmountRate.add(weightedAverageRate), newTotalBalance);

  return newAverageRate;
}

export function calculateRateInDecreasingBalance(
  averageRateBefore: BigNumber,
  totalBalanceBefore: BigNumber,
  amount: BigNumber,
  rate: BigNumber
): BigNumber {
  if (totalBalanceBefore.lte(amount)) {
    return BigNumber.from(0);
  }

  const weightedAverageRate = rayMul(wadToRay(totalBalanceBefore), averageRateBefore);
  const weightedAmountRate = rayMul(wadToRay(amount), rate);

  if (weightedAverageRate.lte(weightedAmountRate)) {
    return BigNumber.from(0);
  }

  const newTotalBalance = totalBalanceBefore.add(amount);
  const newAverageRate = rayDiv(weightedAmountRate.add(weightedAverageRate), newTotalBalance);

  return newAverageRate;
}

export function calculateRateInInterestRateModel(
  lTokenAmount: BigNumber,
  aTokenAmount: BigNumber,
  investAmount: BigNumber,
  borrowAmount: BigNumber,
  averageBorrowAPR: BigNumber,
  interestRateModelParams: InterestModelParams
): BigNumber[] {
  let utilizationRate: BigNumber;
  let newBorrowAPR: BigNumber;
  let newSupplyAPR: BigNumber;

  const totalDebt = aTokenAmount;
  const totalLiquidity = lTokenAmount.add(investAmount).sub(borrowAmount);

  if (totalDebt == BigNumber.from(0)) {
    utilizationRate = BigNumber.from(0);
  } else {
    utilizationRate = totalDebt.div(totalLiquidity);
  }

  // Example
  // Case1: under optimal U
  // baseRate = 2%, util = 40%, optimalRate = 10%, optimalUtil = 80%
  // result = 2+40*(10-2)/80 = 4%
  // Case2: over optimal U
  // optimalRate = 10%, util = 90%, maxRate = 100%, optimalUtil = 80%
  // result = 10+(90-80)*(100-10)/(100-80) = 55%
  if (utilizationRate.lte(interestRateModelParams.optimalUtilizationRate)) {
    newBorrowAPR = interestRateModelParams.borrowRateBase.add(
      rayMul(
        rayDiv(
          interestRateModelParams.borrowRateOptimal.sub(interestRateModelParams.borrowRateBase),
          interestRateModelParams.borrowRateOptimal
        ),
        utilizationRate
      )
    );
  } else {
    newBorrowAPR = interestRateModelParams.borrowRateOptimal.add(
      rayMul(
        rayDiv(
          interestRateModelParams.borrowRateMax.sub(interestRateModelParams.borrowRateOptimal),
          RAY.sub(interestRateModelParams.borrowRateOptimal)
        ),
        utilizationRate.sub(interestRateModelParams.borrowRateOptimal)
      )
    );
  }

  newSupplyAPR = rayMul(
    overallBorrowAPR(aTokenAmount, newBorrowAPR, averageBorrowAPR),
    utilizationRate
  );

  console.log('testData borrowAPR | supplyAPR', newBorrowAPR.toString(), newSupplyAPR.toString());

  return [newBorrowAPR, newSupplyAPR];
}

function overallBorrowAPR(
  aTokenAmount: BigNumber,
  borrowAPR: BigNumber,
  averageBorrowAPR: BigNumber
): BigNumber {
  let result: BigNumber;

  const totalDebt = aTokenAmount;

  if (totalDebt.eq(BigNumber.from(0))) {
    return BigNumber.from(0);
  }

  const weightedBorrowAPR = rayMul(averageBorrowAPR, wadToRay(aTokenAmount));

  result = rayDiv(weightedBorrowAPR, wadToRay(totalDebt));

  return result;
}
