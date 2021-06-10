import { BigNumber } from 'bignumber.js';
import { rayDiv, rayMul, wadToRay } from './Ethereum';
import { RAY, SECONDSPERYEAR } from './constants';
import { InterestModelParams } from './Interfaces';

export function calculateLinearInterest(
  rate: BigNumber,
  lastUpdateTimestamp: BigNumber,
  currentTimestamp: BigNumber
): BigNumber {
  const timeDelta = currentTimestamp.minus(lastUpdateTimestamp);

  return rate.multipliedBy(timeDelta).div(SECONDSPERYEAR).plus(RAY);
}

export function calculateCompoundedInterest(
  rate: BigNumber,
  lastUpdateTimestamp: BigNumber,
  currentTimestamp: BigNumber
): BigNumber {
  const timeDelta = currentTimestamp.minus(lastUpdateTimestamp);

  const expMinusOne = timeDelta.minus(1);
  const expMinusTwo = timeDelta.gt(2) ? timeDelta.minus(2) : 0;

  const ratePerSecond = rate.div(SECONDSPERYEAR);

  const basePowerTwo = rayMul(ratePerSecond, ratePerSecond);
  const basePowerThree = rayMul(basePowerTwo, ratePerSecond);

  const secondTerm = timeDelta.multipliedBy(expMinusOne).multipliedBy(basePowerTwo).div(2);
  const thirdTerm = timeDelta
    .multipliedBy(expMinusOne)
    .multipliedBy(expMinusTwo)
    .multipliedBy(basePowerThree)
    .div(6);

  return new BigNumber(RAY)
    .plus(ratePerSecond.multipliedBy(timeDelta))
    .plus(secondTerm)
    .plus(thirdTerm);
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

  const newTotalBalance = totalBalanceBefore.plus(amount);
  const newAverageRate = rayDiv(
    weightedAmountRate.plus(weightedAverageRate),
    wadToRay(newTotalBalance)
  );

  return newAverageRate;
}

export function calculateRateInDecreasingBalance(
  averageRateBefore: BigNumber,
  totalBalanceBefore: BigNumber,
  amount: BigNumber,
  rate: BigNumber
): BigNumber {
  if (totalBalanceBefore.lte(amount)) {
    return new BigNumber(0);
  }

  const weightedAverageRate = rayMul(wadToRay(totalBalanceBefore), averageRateBefore);
  const weightedAmountRate = rayMul(wadToRay(amount), rate);

  if (weightedAverageRate.lte(weightedAmountRate)) {
    return new BigNumber(0);
  }

  const newTotalBalance = totalBalanceBefore.plus(amount);
  const newAverageRate = rayDiv(weightedAmountRate.plus(weightedAverageRate), newTotalBalance);

  return newAverageRate;
}

export function calculateRateInInterestRateModel(
  underlyingAssetBalance: BigNumber,
  dTokenAmount: BigNumber,
  investAmount: BigNumber,
  borrowAmount: BigNumber,
  averageBorrowAPR: BigNumber,
  interestRateModelParams: InterestModelParams
): BigNumber[] {
  let utilizationRate: BigNumber;
  let newBorrowAPR: BigNumber;
  let newSupplyAPR: BigNumber;

  const totalDebt = dTokenAmount;
  const totalLiquidity = underlyingAssetBalance.plus(investAmount).minus(borrowAmount);

  if (totalDebt.eq(0)) {
    utilizationRate = new BigNumber(0);
  } else {
    utilizationRate = rayDiv(totalDebt, totalLiquidity.plus(totalDebt));
  }

  // Example
  // Case1: under optimal U
  // baseRate = 2%, util = 40%, optimalRate = 10%, optimalUtil = 80%
  // result = 2+40*(10-2)/80 = 4%
  // Case2: over optimal U
  // optimalRate = 10%, util = 90%, maxRate = 100%, optimalUtil = 80%
  // result = 10+(90-80)*(100-10)/(100-80) = 55%
  if (utilizationRate.lte(interestRateModelParams.optimalUtilizationRate)) {
    newBorrowAPR = interestRateModelParams.borrowRateBase.plus(
      rayMul(
        rayDiv(
          interestRateModelParams.borrowRateOptimal.minus(interestRateModelParams.borrowRateBase),
          interestRateModelParams.optimalUtilizationRate
        ),
        utilizationRate
      )
    );
  } else {
    newBorrowAPR = interestRateModelParams.borrowRateOptimal.plus(
      rayMul(
        rayDiv(
          interestRateModelParams.borrowRateMax.minus(interestRateModelParams.borrowRateOptimal),
          new BigNumber(RAY).minus(interestRateModelParams.optimalUtilizationRate)
        ),
        utilizationRate.minus(interestRateModelParams.borrowRateOptimal)
      )
    );
  }

  newSupplyAPR = rayMul(newBorrowAPR, utilizationRate);

  /*
  console.log(
    'testData borrowAPR | supplyAPR | U | totalL | dToken',
    newBorrowAPR.toFixed(),
    newSupplyAPR.toFixed(),
    utilizationRate.toFixed(),
    totalLiquidity.toFixed(),
    dTokenAmount.toFixed()
  );
  */

  return [newBorrowAPR, newSupplyAPR];
}

function overallBorrowAPR(
  dTokenAmount: BigNumber,
  borrowAPR: BigNumber,
  averageBorrowAPR: BigNumber
): BigNumber {
  let result: BigNumber;

  const totalDebt = dTokenAmount;

  if (totalDebt.eq(new BigNumber(0))) {
    return new BigNumber(0);
  }

  const weightedBorrowAPR = rayMul(averageBorrowAPR, wadToRay(dTokenAmount));

  result = rayDiv(weightedBorrowAPR, wadToRay(totalDebt));

  return result;
}
