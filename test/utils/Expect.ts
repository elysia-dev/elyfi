import { BigNumber } from 'ethers';
import { rayDiv, rayMul } from './Ethereum';
import { AssetBondData, ReserveData, UserData } from './Interfaces';
import {
  calculateCompoundedInterest,
  calculateFeeOnRepayment,
  calculateLTokenIndexAfterAction,
  calculateRateInDecreasingBalance,
  calculateRateInIncreasingBalance,
  calculateRateInInterestRateModel,
} from './Math';

// Update lTokenInterestIndex, moneyPoolLastUpdateTimestamp, totalDTokenSupply
function applyTxTimeStamp(reserveData: ReserveData, txTimestamp: BigNumber): ReserveData {
  const newReserveData: ReserveData = { ...reserveData };

  if (newReserveData.supplyAPR.eq(BigNumber.from(0)))
    newReserveData.moneyPoolLastUpdateTimestamp = txTimestamp;

  if (!newReserveData.moneyPoolLastUpdateTimestamp.eq(txTimestamp)) {
    newReserveData.lTokenInterestIndex = calculateLTokenIndexAfterAction(
      reserveData.moneyPoolLastUpdateTimestamp,
      reserveData.supplyAPR,
      reserveData.lTokenInterestIndex,
      txTimestamp
    );

    newReserveData.moneyPoolLastUpdateTimestamp = txTimestamp;
  }

  newReserveData.totalDTokenSupply = rayMul(
    reserveData.principalDTokenSupply,
    calculateCompoundedInterest(
      reserveData.averageRealAssetBorrowRate,
      reserveData.dTokenLastUpdateTimestamp,
      txTimestamp
    )
  );

  return newReserveData;
}

export function expectReserveDataAfterInvest({
  amount,
  reserveData,
  txTimestamp,
}: {
  amount: BigNumber;
  reserveData: ReserveData;
  txTimestamp: BigNumber;
}): ReserveData {
  const newReserveData = applyTxTimeStamp(reserveData, txTimestamp);

  const [borrowAPR, supplyAPR] = calculateRateInInterestRateModel(
    reserveData.underlyingAssetBalance,
    newReserveData.totalDTokenSupply,
    amount,
    BigNumber.from(0),
    newReserveData.interestRateModelParams
  );

  newReserveData.borrowAPR = borrowAPR;
  newReserveData.supplyAPR = supplyAPR;

  newReserveData.underlyingAssetBalance = newReserveData.underlyingAssetBalance.add(amount);

  newReserveData.implicitLTokenSupply = newReserveData.implicitLTokenSupply.add(
    rayDiv(amount, newReserveData.lTokenInterestIndex)
  );

  newReserveData.totalLTokenSupply = rayMul(
    newReserveData.implicitLTokenSupply,
    newReserveData.lTokenInterestIndex
  );

  return newReserveData;
}

export function expectReserveDataAfterWithdraw({
  amount,
  reserveData,
  txTimestamp,
}: {
  amount: BigNumber;
  reserveData: ReserveData;
  txTimestamp: BigNumber;
}): ReserveData {
  const newReserveData = applyTxTimeStamp(reserveData, txTimestamp);

  const [borrowAPR, supplyAPR] = calculateRateInInterestRateModel(
    reserveData.underlyingAssetBalance,
    newReserveData.totalDTokenSupply,
    BigNumber.from(0),
    amount,
    reserveData.interestRateModelParams
  );

  newReserveData.borrowAPR = borrowAPR;
  newReserveData.supplyAPR = supplyAPR;

  // Burn lToken
  newReserveData.implicitLTokenSupply = reserveData.implicitLTokenSupply.sub(
    rayDiv(amount, newReserveData.lTokenInterestIndex)
  );

  newReserveData.totalLTokenSupply = rayMul(
    reserveData.implicitLTokenSupply,
    newReserveData.lTokenInterestIndex
  ).sub(amount);

  // transfer underlying asset in burn logic
  newReserveData.underlyingAssetBalance = reserveData.underlyingAssetBalance.sub(amount);

  return newReserveData;
}

export function expectUserDataAfterInvest({
  amountInvest,
  userDataBefore,
  reserveDataAfter,
  txTimestamp,
}: {
  amountInvest: BigNumber;
  userDataBefore: UserData;
  reserveDataAfter: ReserveData;
  txTimestamp: BigNumber;
}): UserData {
  const expectedUserData: UserData = { ...userDataBefore };

  // transferFrom
  expectedUserData.underlyingAssetBalance = userDataBefore.underlyingAssetBalance.sub(amountInvest);

  // mint ltoken
  expectedUserData.implicitLtokenBalance = userDataBefore.implicitLtokenBalance.sub(
    rayDiv(amountInvest, reserveDataAfter.lTokenInterestIndex)
  );

  // update lToken balance
  expectedUserData.lTokenBalance = rayMul(
    expectedUserData.implicitLtokenBalance,
    reserveDataAfter.lTokenInterestIndex
  );

  // update dToken balance
  const dTokenBalance = rayMul(
    userDataBefore.principalDTokenBalance,
    calculateCompoundedInterest(
      userDataBefore.averageRealAssetBorrowRate,
      userDataBefore.userLastUpdateTimestamp,
      txTimestamp
    )
  );
  expectedUserData.dTokenBalance = dTokenBalance;

  return expectedUserData;
}

export function expectUserDataAfterWithdraw({
  amountWithdraw,
  userDataBefore,
  reserveDataAfter,
  txTimestamp,
}: {
  amountWithdraw: BigNumber;
  userDataBefore: UserData;
  reserveDataAfter: ReserveData;
  txTimestamp: BigNumber;
}): UserData {
  const expectedUserData: UserData = { ...userDataBefore };

  // burn lToken
  expectedUserData.implicitLtokenBalance = userDataBefore.implicitLtokenBalance.sub(
    rayDiv(amountWithdraw, reserveDataAfter.lTokenInterestIndex)
  );

  // transfer underlyingAsset
  expectedUserData.underlyingAssetBalance = userDataBefore.underlyingAssetBalance.add(
    amountWithdraw
  );
  // update lToken balance
  expectedUserData.lTokenBalance = rayMul(
    expectedUserData.implicitLtokenBalance,
    reserveDataAfter.lTokenInterestIndex
  );

  // update dToken balance
  expectedUserData.dTokenBalance = rayMul(
    userDataBefore.principalDTokenBalance,
    calculateCompoundedInterest(
      userDataBefore.averageRealAssetBorrowRate,
      userDataBefore.userLastUpdateTimestamp,
      txTimestamp
    )
  );

  return expectedUserData;
}

export function expectReserveDataAfterBorrow({
  amountBorrow,
  reserveDataBefore,
  txTimestamp,
}: {
  amountBorrow: BigNumber;
  reserveDataBefore: ReserveData;
  txTimestamp: BigNumber;
}): ReserveData {
  const expectedReserveData = applyTxTimeStamp(reserveDataBefore, txTimestamp);

  // update LToken balance
  expectedReserveData.totalLTokenSupply = rayMul(
    reserveDataBefore.implicitLTokenSupply,
    expectedReserveData.lTokenInterestIndex
  );

  // update DToken supply
  const dTokenAccruedInterest = calculateCompoundedInterest(
    reserveDataBefore.averageRealAssetBorrowRate,
    reserveDataBefore.dTokenLastUpdateTimestamp,
    txTimestamp
  );

  const previousUpdatedDTokenBalance = rayMul(
    reserveDataBefore.principalDTokenSupply,
    dTokenAccruedInterest
  );

  const totalDTokenSupply = previousUpdatedDTokenBalance.add(amountBorrow);
  expectedReserveData.averageRealAssetBorrowRate = calculateRateInIncreasingBalance(
    reserveDataBefore.averageRealAssetBorrowRate,
    previousUpdatedDTokenBalance,
    amountBorrow,
    reserveDataBefore.borrowAPR
  );

  expectedReserveData.principalDTokenSupply = totalDTokenSupply;
  expectedReserveData.totalDTokenSupply = totalDTokenSupply;
  expectedReserveData.dTokenLastUpdateTimestamp = txTimestamp;

  const [borrowAPR, supplyAPR] = calculateRateInInterestRateModel(
    reserveDataBefore.underlyingAssetBalance,
    totalDTokenSupply,
    BigNumber.from(0),
    amountBorrow,
    reserveDataBefore.interestRateModelParams
  );
  expectedReserveData.borrowAPR = borrowAPR;
  expectedReserveData.supplyAPR = supplyAPR;

  // transfer underlying asset in burn logic
  expectedReserveData.underlyingAssetBalance = reserveDataBefore.underlyingAssetBalance.sub(
    amountBorrow
  );

  return expectedReserveData;
}

export function expectUserDataAfterBorrow({
  amountBorrow,
  userDataBefore,
  reserveDataBefore,
  reserveDataAfter,
  txTimestamp,
}: {
  amountBorrow: BigNumber;
  userDataBefore: UserData;
  reserveDataBefore: ReserveData;
  reserveDataAfter: ReserveData;
  txTimestamp: BigNumber;
}): UserData {
  const expectedUserData: UserData = { ...userDataBefore };

  // update lToken balance
  expectedUserData.lTokenBalance = rayMul(
    userDataBefore.implicitLtokenBalance,
    reserveDataAfter.lTokenInterestIndex
  );

  // update and mint dToken balance
  const previousUpdatedDTokenBalance = rayMul(
    userDataBefore.principalDTokenBalance,
    calculateCompoundedInterest(
      userDataBefore.averageRealAssetBorrowRate,
      userDataBefore.userLastUpdateTimestamp,
      txTimestamp
    )
  );
  const dTokenBalance = previousUpdatedDTokenBalance.add(amountBorrow);

  expectedUserData.dTokenBalance = dTokenBalance;
  expectedUserData.principalDTokenBalance = dTokenBalance;

  // update average Borrow rate and timestamp
  const averageRealAssetBorrowRate = calculateRateInIncreasingBalance(
    userDataBefore.averageRealAssetBorrowRate,
    previousUpdatedDTokenBalance,
    amountBorrow,
    reserveDataBefore.borrowAPR
  );
  expectedUserData.userLastUpdateTimestamp = txTimestamp;
  expectedUserData.averageRealAssetBorrowRate = averageRealAssetBorrowRate;

  // transferFrom
  const underlyingAssetBalance = userDataBefore.underlyingAssetBalance.add(amountBorrow);
  expectedUserData.underlyingAssetBalance = underlyingAssetBalance;
  return expectedUserData;
}

export function expectReserveDataAfterRepay({
  amount,
  reserveData,
  assetBondData,
  txTimestamp,
}: {
  amount: BigNumber;
  reserveData: ReserveData;
  assetBondData: AssetBondData;
  txTimestamp: BigNumber;
}): ReserveData {
  // update lindex, timestamp, totalD
  const newReserveData = applyTxTimeStamp(reserveData, txTimestamp);

  const [accruedDebtOnMoneyPool, feeOnRepayment] = calculateFeeOnRepayment(
    assetBondData,
    txTimestamp
  );

  const totalRetrieveAmount = accruedDebtOnMoneyPool.add(feeOnRepayment);

  const dTokenAccruedInterest = calculateCompoundedInterest(
    reserveData.averageRealAssetBorrowRate,
    reserveData.dTokenLastUpdateTimestamp,
    txTimestamp
  );

  const previousUpdatedDTokenBalance = rayMul(
    reserveData.principalDTokenSupply,
    dTokenAccruedInterest
  );

  const totalDTokenSupply = previousUpdatedDTokenBalance.sub(accruedDebtOnMoneyPool);
  const newAverageRealAssetBorrowRate = calculateRateInDecreasingBalance(
    reserveData.averageRealAssetBorrowRate,
    previousUpdatedDTokenBalance,
    accruedDebtOnMoneyPool,
    assetBondData.interestRate
  );
  newReserveData.totalDTokenSupply = totalDTokenSupply;
  newReserveData.averageRealAssetBorrowRate = newAverageRealAssetBorrowRate;

  const [borrowAPR, supplyAPR] = calculateRateInInterestRateModel(
    reserveData.underlyingAssetBalance,
    newReserveData.totalDTokenSupply,
    totalRetrieveAmount,
    BigNumber.from(0),
    newReserveData.interestRateModelParams
  );

  newReserveData.borrowAPR = borrowAPR;
  newReserveData.supplyAPR = supplyAPR;

  newReserveData.underlyingAssetBalance = newReserveData.underlyingAssetBalance.add(
    totalRetrieveAmount
  );

  newReserveData.implicitLTokenSupply = newReserveData.implicitLTokenSupply.add(
    rayDiv(feeOnRepayment, newReserveData.lTokenInterestIndex)
  );

  newReserveData.totalLTokenSupply = rayMul(
    newReserveData.implicitLTokenSupply,
    newReserveData.lTokenInterestIndex
  );

  return newReserveData;
}
