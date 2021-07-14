import { BigNumber, constants } from 'ethers';
import { rayDiv, rayMul, wadToRay } from './Ethereum';
import { RAY, SECONDSPERYEAR } from './constants';
import InterestModelParams from '../types/InterestRateModelParams';
import AssetBondData from '../types/AssetBondData';
import IncentivePoolData from '../types/IncentivePoolData';
import UserIncentiveData from '../types/UserIncentiveData';

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

  return BigNumber.from(RAY).add(ratePerSecond.mul(timeDelta)).add(secondTerm).add(thirdTerm);
}

/******************* updateState functions *******************/

export function calculateLTokenIndexAfterAction(
  timeStampBeforeAction: BigNumber,
  depositAPY: BigNumber,
  lTokenIndexBeforeAction: BigNumber,
  timeStampAfterAction: BigNumber
): BigNumber {
  const accruedInterest = calculateLinearInterest(
    depositAPY,
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
  const newAverageRate = rayDiv(
    weightedAmountRate.add(weightedAverageRate),
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
    return constants.Zero;
  }

  const weightedAverageRate = rayMul(wadToRay(totalBalanceBefore), averageRateBefore);
  const weightedAmountRate = rayMul(wadToRay(amount), rate);

  if (weightedAverageRate.lte(weightedAmountRate)) {
    return constants.Zero;
  }

  const newTotalBalance = totalBalanceBefore.sub(amount);
  const newAverageRate = rayDiv(
    weightedAverageRate.sub(weightedAmountRate),
    wadToRay(newTotalBalance)
  );

  return newAverageRate;
}

export function calculateRateInInterestRateModel(
  underlyingAssetBalance: BigNumber,
  dTokenAmount: BigNumber,
  depositAmount: BigNumber,
  borrowAmount: BigNumber,
  interestRateModelParams: InterestModelParams
): BigNumber[] {
  let utilizationRate: BigNumber;
  let newBorrowAPY: BigNumber;
  let newDepositAPY: BigNumber;

  const totalDebt = dTokenAmount;
  const totalLiquidity = underlyingAssetBalance.add(depositAmount).sub(borrowAmount);

  if (totalDebt.eq(0)) {
    utilizationRate = constants.Zero;
  } else {
    utilizationRate = rayDiv(totalDebt, totalLiquidity.add(totalDebt));
  }

  // Example
  // Case1: under optimal U
  // baseRate = 2%, util = 40%, optimalRate = 10%, optimalUtil = 80%
  // result = 2+40*(10-2)/80 = 4%
  // Case2: over optimal U
  // optimalRate = 10%, util = 90%, maxRate = 100%, optimalUtil = 80%
  // result = 10+(90-80)*(100-10)/(100-80) = 55%
  if (utilizationRate.lte(interestRateModelParams.optimalUtilizationRate)) {
    newBorrowAPY = interestRateModelParams.borrowRateBase.add(
      rayMul(
        rayDiv(
          interestRateModelParams.borrowRateOptimal.sub(interestRateModelParams.borrowRateBase),
          interestRateModelParams.optimalUtilizationRate
        ),
        utilizationRate
      )
    );
  } else {
    newBorrowAPY = interestRateModelParams.borrowRateOptimal.add(
      rayMul(
        rayDiv(
          interestRateModelParams.borrowRateMax.sub(interestRateModelParams.borrowRateOptimal),
          BigNumber.from(RAY).sub(interestRateModelParams.optimalUtilizationRate)
        ),
        utilizationRate.sub(interestRateModelParams.borrowRateOptimal)
      )
    );
  }

  newDepositAPY = rayMul(newBorrowAPY, utilizationRate);

  return [newBorrowAPY, newDepositAPY];
}

export function calculateFeeOnRepayment(
  assetBondData: AssetBondData,
  paymentTimestamp: BigNumber
): BigNumber {
  let firstTermRate: BigNumber;
  let secondTermRate: BigNumber;
  let secondOverdueRate: BigNumber;
  let thirdTermRate: BigNumber;
  let totalRate: BigNumber;

  firstTermRate = calculateCompoundedInterest(
    assetBondData.couponRate,
    assetBondData.loanStartTimestamp,
    assetBondData.collateralizeTimestamp
  );

  const currentDateTimeStruct = new Date(paymentTimestamp.toNumber() * 1000);

  const paymentDate =
    Date.UTC(
      currentDateTimeStruct.getUTCFullYear(),
      currentDateTimeStruct.getUTCMonth(),
      currentDateTimeStruct.getUTCDate() + 1
    ) / 1000;

  if (paymentDate <= assetBondData.liquidationTimestamp.toNumber()) {
    secondTermRate = calculateCompoundedInterest(
      assetBondData.couponRate.sub(assetBondData.interestRate),
      assetBondData.collateralizeTimestamp,
      paymentTimestamp
    ).sub(RAY);
    thirdTermRate = calculateCompoundedInterest(
      assetBondData.couponRate,
      paymentTimestamp,
      BigNumber.from(paymentDate)
    ).sub(RAY);

    totalRate = firstTermRate.add(secondTermRate).add(thirdTermRate);

    return rayMul(assetBondData.principal, totalRate).sub(assetBondData.principal);
  }

  secondTermRate = calculateCompoundedInterest(
    assetBondData.couponRate.sub(assetBondData.interestRate),
    assetBondData.collateralizeTimestamp,
    assetBondData.maturityTimestamp
  ).sub(RAY);

  secondOverdueRate = calculateCompoundedInterest(
    assetBondData.couponRate.add(assetBondData.delinquencyRate).sub(assetBondData.interestRate),
    assetBondData.maturityTimestamp,
    paymentTimestamp
  ).sub(RAY);

  thirdTermRate = calculateCompoundedInterest(
    assetBondData.couponRate.add(assetBondData.delinquencyRate),
    paymentTimestamp,
    BigNumber.from(paymentDate)
  ).sub(RAY);

  totalRate = firstTermRate.add(secondTermRate).add(secondOverdueRate).add(thirdTermRate);

  return rayMul(assetBondData.principal, totalRate).sub(assetBondData.principal);
}

export function calculateFeeOnLiquidation(
  assetBondData: AssetBondData,
  paymentTimestamp: BigNumber
): BigNumber {
  let firstTermRate: BigNumber;
  let secondTermRate: BigNumber;
  let totalRate: BigNumber;

  firstTermRate = calculateCompoundedInterest(
    assetBondData.couponRate,
    assetBondData.loanStartTimestamp,
    assetBondData.maturityTimestamp
  );

  const currentDateTimeStruct = new Date(paymentTimestamp.toNumber() * 1000);

  const paymentDate =
    Date.UTC(
      currentDateTimeStruct.getUTCFullYear(),
      currentDateTimeStruct.getUTCMonth(),
      currentDateTimeStruct.getUTCDate() + 1
    ) / 1000;

  secondTermRate = calculateCompoundedInterest(
    assetBondData.couponRate.add(assetBondData.delinquencyRate),
    assetBondData.maturityTimestamp,
    BigNumber.from(paymentDate)
  ).sub(RAY);

  totalRate = firstTermRate.add(secondTermRate);

  return rayMul(assetBondData.principal, totalRate).sub(assetBondData.principal);
}

export function calculateAssetBondDebtData(
  assetBondData: AssetBondData,
  paymentTimestamp: BigNumber
): BigNumber[] {
  let accruedDebtOnMoneyPool: BigNumber;
  let feeOnRepayment: BigNumber;

  accruedDebtOnMoneyPool = rayMul(
    assetBondData.principal,
    calculateCompoundedInterest(
      assetBondData.interestRate,
      assetBondData.collateralizeTimestamp,
      paymentTimestamp
    )
  );

  feeOnRepayment = calculateFeeOnRepayment(assetBondData, paymentTimestamp);

  return [accruedDebtOnMoneyPool, feeOnRepayment];
}

export function calculateAssetBondLiquidationData(
  assetBondData: AssetBondData,
  paymentTimestamp: BigNumber
): BigNumber[] {
  let accruedDebtOnMoneyPool: BigNumber;
  let feeOnRepayment: BigNumber;

  accruedDebtOnMoneyPool = rayMul(
    assetBondData.principal,
    calculateCompoundedInterest(
      assetBondData.interestRate,
      assetBondData.collateralizeTimestamp,
      paymentTimestamp
    )
  );

  feeOnRepayment = calculateFeeOnLiquidation(assetBondData, paymentTimestamp);

  return [accruedDebtOnMoneyPool, feeOnRepayment];
}

export function calculateIncentiveIndex(
  incentivePoolData: IncentivePoolData,
  txTimeStamp: BigNumber
): BigNumber {
  let timeDiff: BigNumber;
  timeDiff = txTimeStamp.lt(incentivePoolData.endTimestamp)
    ? (timeDiff = txTimeStamp.sub(incentivePoolData.lastUpdateTimestamp))
    : (timeDiff = txTimeStamp.sub(incentivePoolData.endTimestamp));

  if (timeDiff.eq(0)) {
    return BigNumber.from(0);
  }

  if (incentivePoolData.totalLTokenSupply.eq(0)) {
    return BigNumber.from(0);
  }

  const incentiveIndexDiff = timeDiff
    .mul(incentivePoolData.amountPerSecond)
    .mul(1e9)
    .div(incentivePoolData.totalLTokenSupply);

  return incentivePoolData.incentiveIndex.add(incentiveIndexDiff);
}

export function calculateUserIncentive(
  incentivePoolData: IncentivePoolData,
  userIncentiveData: UserIncentiveData,
  txTimeStamp: BigNumber
): BigNumber {
  let indexDiff = BigNumber.from(0);
  if (calculateIncentiveIndex(incentivePoolData, txTimeStamp).gte(userIncentiveData.userIndex)) {
    indexDiff = calculateIncentiveIndex(incentivePoolData, txTimeStamp).sub(
      userIncentiveData.userIndex
    );
  }
  const balance = userIncentiveData.userLTokenBalance;
  const incentiveAdded = balance.mul(indexDiff).div(1e9);
  const result = userIncentiveData.userIncentive.add(incentiveAdded);

  console.log(
    'calculateIncentive',
    userIncentiveData.userIncentive.toString(),
    result.toString(),
    incentiveAdded.toString()
  );

  return result;
}

export function calculateDataAfterUpdate(
  incentivePoolData: IncentivePoolData,
  userIncentiveData: UserIncentiveData,
  txTimestamp: BigNumber
): [IncentivePoolData, UserIncentiveData] {
  const newIncentivePoolData = { ...incentivePoolData } as IncentivePoolData;
  const newUserIncentiveData = { ...userIncentiveData } as UserIncentiveData;

  const newUserIncentive = calculateUserIncentive(
    incentivePoolData,
    userIncentiveData,
    txTimestamp
  );
  const newIndex = calculateIncentiveIndex(incentivePoolData, txTimestamp);

  newUserIncentiveData.userIncentive = newUserIncentive;

  newIncentivePoolData.incentiveIndex = newIndex;
  newUserIncentiveData.userIndex = newIndex;

  newIncentivePoolData.lastUpdateTimestamp = txTimestamp;

  return [newIncentivePoolData, newUserIncentiveData];
}
