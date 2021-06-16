import { BigNumber } from 'ethers';
import { rayDiv, rayMul } from './Ethereum';
import { AssetBondData, ReserveData, UserData } from './Interfaces';
import {
  calculateAssetBondDebtData,
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

  if (newReserveData.depositAPY.eq(BigNumber.from(0)))
    newReserveData.moneyPoolLastUpdateTimestamp = txTimestamp;

  if (!newReserveData.moneyPoolLastUpdateTimestamp.eq(txTimestamp)) {
    newReserveData.lTokenInterestIndex = calculateLTokenIndexAfterAction(
      reserveData.moneyPoolLastUpdateTimestamp,
      reserveData.depositAPY,
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

export function expectReserveDataAfterDeposit({
  amount,
  reserveData,
  txTimestamp,
}: {
  amount: BigNumber;
  reserveData: ReserveData;
  txTimestamp: BigNumber;
}): ReserveData {
  const newReserveData = applyTxTimeStamp(reserveData, txTimestamp);

  const [borrowAPY, depositAPY] = calculateRateInInterestRateModel(
    reserveData.underlyingAssetBalance,
    newReserveData.totalDTokenSupply,
    amount,
    BigNumber.from(0),
    newReserveData.interestRateModelParams
  );

  newReserveData.borrowAPY = borrowAPY;
  newReserveData.depositAPY = depositAPY;

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

  const [borrowAPY, depositAPY] = calculateRateInInterestRateModel(
    reserveData.underlyingAssetBalance,
    newReserveData.totalDTokenSupply,
    BigNumber.from(0),
    amount,
    reserveData.interestRateModelParams
  );

  newReserveData.borrowAPY = borrowAPY;
  newReserveData.depositAPY = depositAPY;

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

export function expectUserDataAfterDeposit({
  amountDeposit,
  userDataBefore,
  reserveDataAfter,
  txTimestamp,
}: {
  amountDeposit: BigNumber;
  userDataBefore: UserData;
  reserveDataAfter: ReserveData;
  txTimestamp: BigNumber;
}): UserData {
  const expectedUserData: UserData = { ...userDataBefore };

  // transferFrom
  expectedUserData.underlyingAssetBalance = userDataBefore.underlyingAssetBalance.sub(amountDeposit);

  // mint ltoken
  expectedUserData.implicitLtokenBalance = userDataBefore.implicitLtokenBalance.sub(
    rayDiv(amountDeposit, reserveDataAfter.lTokenInterestIndex)
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
    reserveDataBefore.borrowAPY
  );

  expectedReserveData.principalDTokenSupply = totalDTokenSupply;
  expectedReserveData.totalDTokenSupply = totalDTokenSupply;
  expectedReserveData.dTokenLastUpdateTimestamp = txTimestamp;

  const [borrowAPY, depositAPY] = calculateRateInInterestRateModel(
    reserveDataBefore.underlyingAssetBalance,
    totalDTokenSupply,
    BigNumber.from(0),
    amountBorrow,
    reserveDataBefore.interestRateModelParams
  );
  expectedReserveData.borrowAPY = borrowAPY;
  expectedReserveData.depositAPY = depositAPY;

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
    reserveDataBefore.borrowAPY
  );
  expectedUserData.userLastUpdateTimestamp = txTimestamp;
  expectedUserData.averageRealAssetBorrowRate = averageRealAssetBorrowRate;

  // transferFrom
  const underlyingAssetBalance = userDataBefore.underlyingAssetBalance.add(amountBorrow);
  expectedUserData.underlyingAssetBalance = underlyingAssetBalance;
  return expectedUserData;
}

export function expectReserveDataAfterRepay({
  assetBondData,
  reserveData,
  txTimestamp,
}: {
  assetBondData: AssetBondData;
  reserveData: ReserveData;
  txTimestamp: BigNumber;
}): ReserveData {
  // update lindex, timestamp, totalD
  const newReserveData = applyTxTimeStamp(reserveData, txTimestamp);

  const [accruedDebtOnMoneyPool, feeOnRepayment] = calculateAssetBondDebtData(
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

  const [borrowAPY, depositAPY] = calculateRateInInterestRateModel(
    reserveData.underlyingAssetBalance,
    newReserveData.totalDTokenSupply,
    totalRetrieveAmount,
    BigNumber.from(0),
    newReserveData.interestRateModelParams
  );

  newReserveData.borrowAPY = borrowAPY;
  newReserveData.depositAPY = depositAPY;

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

export function expectUserDataAfterRepay({
  assetBondData,
  userDataBefore,
  reserveDataAfter,
  txTimestamp,
}: {
  assetBondData: AssetBondData;
  userDataBefore: UserData;
  reserveDataAfter: ReserveData;
  txTimestamp: BigNumber;
}): UserData {
  const expectedUserData: UserData = { ...userDataBefore };

  // update lTokenBalance
  expectedUserData.lTokenBalance = rayMul(
    userDataBefore.implicitLtokenBalance,
    reserveDataAfter.lTokenInterestIndex
  );

  const [accruedDebtOnMoneyPool, feeOnRepayment] = calculateAssetBondDebtData(
    assetBondData,
    txTimestamp
  );

  // update and burn dToken balance
  const previousUpdatedDTokenBalance = rayMul(
    userDataBefore.principalDTokenBalance,
    calculateCompoundedInterest(
      userDataBefore.averageRealAssetBorrowRate,
      userDataBefore.userLastUpdateTimestamp,
      txTimestamp
    )
  );
  const dTokenBalance = previousUpdatedDTokenBalance.sub(accruedDebtOnMoneyPool);

  expectedUserData.dTokenBalance = dTokenBalance;
  expectedUserData.principalDTokenBalance = dTokenBalance;

  // update average Borrow rate and timestamp
  const averageRealAssetBorrowRate = calculateRateInDecreasingBalance(
    userDataBefore.averageRealAssetBorrowRate,
    previousUpdatedDTokenBalance,
    accruedDebtOnMoneyPool,
    assetBondData.interestRate
  );
  expectedUserData.userLastUpdateTimestamp = txTimestamp;
  expectedUserData.averageRealAssetBorrowRate = averageRealAssetBorrowRate;

  // transfer underlying asset
  const underlyingAssetBalance = userDataBefore.underlyingAssetBalance.add(
    accruedDebtOnMoneyPool.add(feeOnRepayment)
  );
  expectedUserData.underlyingAssetBalance = underlyingAssetBalance;

  return expectedUserData;
}
