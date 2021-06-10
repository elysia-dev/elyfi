import { BigNumber } from 'bignumber.js';
import { rayDiv, rayMul } from './Ethereum';
import { ReserveData, UserData } from './Interfaces';
import {
  calculateCompoundedInterest,
  calculateLTokenIndexAfterAction,
  calculateRateInIncreasingBalance,
  calculateRateInInterestRateModel,
} from './Math';

export function expectedReserveDataAfterInvest({
  amountInvest,
  reserveDataBefore,
  txTimestamp,
}: {
  amountInvest: BigNumber;
  reserveDataBefore: ReserveData;
  txTimestamp: BigNumber;
}): ReserveData {
  const expectedReserveData: ReserveData = { ...reserveDataBefore };

  /*
  console.log(
    'expect Timestamp: Before > Tx > DToken',
    reserveDataBefore.dTokenLastUpdateTimestamp.toFixed(),
    txTimestamp.toFixed(),
    expectedReserveData.totalDTokenSupply.toFixed(),
    expectedReserveData.borrowAPR.toFixed()
  );
  */

  // update lTokenIndex and moneyPool timestamp
  let lTokenInterestIndex = reserveDataBefore.lTokenInterestIndex;
  if (expectedReserveData.supplyAPR.eq(new BigNumber(0))) {
    expectedReserveData.moneyPoolLastUpdateTimestamp = txTimestamp;
  }
  if (!expectedReserveData.moneyPoolLastUpdateTimestamp.eq(txTimestamp)) {
    lTokenInterestIndex = calculateLTokenIndexAfterAction(
      reserveDataBefore.moneyPoolLastUpdateTimestamp,
      reserveDataBefore.supplyAPR,
      reserveDataBefore.lTokenInterestIndex,
      txTimestamp
    );
    expectedReserveData.lTokenInterestIndex = lTokenInterestIndex;
    expectedReserveData.moneyPoolLastUpdateTimestamp = txTimestamp;
  }

  // update DToken balance
  const dTokenAccruedInterest = calculateCompoundedInterest(
    reserveDataBefore.averageRealAssetBorrowRate,
    reserveDataBefore.dTokenLastUpdateTimestamp,
    txTimestamp
  );
  const totalDTokenSupply = rayMul(reserveDataBefore.principalDTokenSupply, dTokenAccruedInterest);
  expectedReserveData.totalDTokenSupply = totalDTokenSupply;

  // get updated lToken supply
  const totalLTokenSupply = rayMul(reserveDataBefore.implicitLTokenSupply, lTokenInterestIndex);

  // update interest rates
  const interestRates = calculateRateInInterestRateModel(
    reserveDataBefore.underlyingAssetBalance,
    totalDTokenSupply,
    amountInvest,
    new BigNumber(0),
    reserveDataBefore.averageRealAssetBorrowRate,
    reserveDataBefore.interestRateModelParams
  );

  expectedReserveData.borrowAPR = interestRates[0];
  expectedReserveData.supplyAPR = interestRates[1];

  // transferFrom action
  expectedReserveData.underlyingAssetBalance = reserveDataBefore.underlyingAssetBalance.plus(
    amountInvest
  );

  // Mint lToken
  const implicitLTokenSupply = reserveDataBefore.implicitLTokenSupply.plus(
    rayDiv(amountInvest, lTokenInterestIndex)
  );
  expectedReserveData.implicitLTokenSupply = implicitLTokenSupply;
  expectedReserveData.totalLTokenSupply = rayMul(implicitLTokenSupply, lTokenInterestIndex);

  /*
  console.log(
    'Expected: totalL | totalD  | borrowAPR | supplyAPR | ',
    totalLTokenSupply.toFixed(),
    totalDTokenSupply.toFixed(),
    expectedReserveData.borrowAPR.toFixed(),
    expectedReserveData.supplyAPR.toFixed()
  );
  */

  return expectedReserveData;
}

export function expectedUserDataAfterInvest({
  amountInvest,
  userDataBefore,
  reserveDataBefore,
  reserveDataAfter,
  txTimestamp,
}: {
  amountInvest: BigNumber;
  userDataBefore: UserData;
  reserveDataBefore: ReserveData;
  reserveDataAfter: ReserveData;
  txTimestamp: BigNumber;
}): UserData {
  const expectedUserData: UserData = { ...userDataBefore };

  // transferFrom
  const underlyingAssetBalance = userDataBefore.underlyingAssetBalance.minus(amountInvest);
  expectedUserData.underlyingAssetBalance = underlyingAssetBalance;

  // mint ltoken
  const implicitLtokenBalance = userDataBefore.implicitLtokenBalance.plus(
    rayDiv(amountInvest, reserveDataAfter.lTokenInterestIndex)
  );
  expectedUserData.implicitLtokenBalance = implicitLtokenBalance;

  // update lToken balance
  const lTokenBalance = rayMul(implicitLtokenBalance, reserveDataAfter.lTokenInterestIndex);
  expectedUserData.lTokenBalance = lTokenBalance;

  // update dToken balance
  const dTokenAccruedInterest = calculateCompoundedInterest(
    userDataBefore.averageRealAssetBorrowRate,
    userDataBefore.userLastUpdateTimestamp,
    txTimestamp
  );
  const dTokenBalance = rayMul(userDataBefore.principalDTokenBalance, dTokenAccruedInterest);
  expectedUserData.dTokenBalance = dTokenBalance;

  return expectedUserData;
}

export function expectedReserveDataAfterWithdraw({
  amountWithdraw,
  reserveDataBefore,
  txTimestamp,
}: {
  amountWithdraw: BigNumber;
  reserveDataBefore: ReserveData;
  txTimestamp: BigNumber;
}): ReserveData {
  const expectedReserveData: ReserveData = { ...reserveDataBefore };

  // update lTokenIndex and moneyPool timestamp
  let lTokenInterestIndex = reserveDataBefore.lTokenInterestIndex;
  if (expectedReserveData.supplyAPR.eq(new BigNumber(0))) {
    expectedReserveData.moneyPoolLastUpdateTimestamp = txTimestamp;
  }
  if (!expectedReserveData.moneyPoolLastUpdateTimestamp.eq(txTimestamp)) {
    lTokenInterestIndex = calculateLTokenIndexAfterAction(
      reserveDataBefore.moneyPoolLastUpdateTimestamp,
      reserveDataBefore.supplyAPR,
      reserveDataBefore.lTokenInterestIndex,
      txTimestamp
    );
    expectedReserveData.lTokenInterestIndex = lTokenInterestIndex;
    expectedReserveData.moneyPoolLastUpdateTimestamp = txTimestamp;
  }

  // update DToken balance
  const dTokenAccruedInterest = calculateCompoundedInterest(
    reserveDataBefore.averageRealAssetBorrowRate,
    reserveDataBefore.dTokenLastUpdateTimestamp,
    txTimestamp
  );
  const totalDTokenSupply = rayMul(reserveDataBefore.principalDTokenSupply, dTokenAccruedInterest);
  expectedReserveData.principalDTokenSupply = totalDTokenSupply;
  expectedReserveData.totalDTokenSupply = totalDTokenSupply;

  // get updated lToken supply
  const totalLTokenSupply = rayMul(reserveDataBefore.implicitLTokenSupply, lTokenInterestIndex);

  // update interest rates
  const interestRates = calculateRateInInterestRateModel(
    reserveDataBefore.underlyingAssetBalance,
    totalDTokenSupply,
    new BigNumber(0),
    amountWithdraw,
    reserveDataBefore.averageRealAssetBorrowRate,
    reserveDataBefore.interestRateModelParams
  );
  expectedReserveData.borrowAPR = interestRates[0];
  expectedReserveData.supplyAPR = interestRates[1];

  // Burn lToken
  const implicitLTokenSupply = reserveDataBefore.implicitLTokenSupply.minus(
    rayDiv(amountWithdraw, lTokenInterestIndex)
  );
  expectedReserveData.implicitLTokenSupply = implicitLTokenSupply;
  expectedReserveData.totalLTokenSupply = totalLTokenSupply.minus(amountWithdraw);

  // transfer underlying asset in burn logic
  expectedReserveData.underlyingAssetBalance = reserveDataBefore.underlyingAssetBalance.minus(
    amountWithdraw
  );

  return expectedReserveData;
}

export function expectedUserDataAfterWithdraw({
  amountWithdraw,
  userDataBefore,
  reserveDataBefore,
  reserveDataAfter,
  txTimestamp,
}: {
  amountWithdraw: BigNumber;
  userDataBefore: UserData;
  reserveDataBefore: ReserveData;
  reserveDataAfter: ReserveData;
  txTimestamp: BigNumber;
}): UserData {
  const expectedUserData: UserData = { ...userDataBefore };

  // burn lToken
  const implicitLTokenBalance = userDataBefore.implicitLtokenBalance.minus(
    rayDiv(amountWithdraw, reserveDataAfter.lTokenInterestIndex)
  );
  expectedUserData.implicitLtokenBalance = implicitLTokenBalance;

  // transfer underlyingAsset
  expectedUserData.underlyingAssetBalance = userDataBefore.underlyingAssetBalance.plus(
    amountWithdraw
  );
  // update lToken balance
  expectedUserData.lTokenBalance = rayMul(
    implicitLTokenBalance,
    reserveDataAfter.lTokenInterestIndex
  );

  // update dToken balance
  const dTokenAccruedInterest = calculateCompoundedInterest(
    userDataBefore.averageRealAssetBorrowRate,
    userDataBefore.userLastUpdateTimestamp,
    txTimestamp
  );
  const dTokenBalance = rayMul(userDataBefore.principalDTokenBalance, dTokenAccruedInterest);
  expectedUserData.dTokenBalance = dTokenBalance;

  return expectedUserData;
}

export function expectedReserveDataAfterBorrow({
  amountBorrow,
  reserveDataBefore,
  txTimestamp,
}: {
  amountBorrow: BigNumber;
  reserveDataBefore: ReserveData;
  txTimestamp: BigNumber;
}): ReserveData {
  const expectedReserveData: ReserveData = { ...reserveDataBefore };

  // update lTokenIndex and moneyPool timestamp
  let lTokenInterestIndex = reserveDataBefore.lTokenInterestIndex;
  if (reserveDataBefore.supplyAPR.eq(new BigNumber(0))) {
    expectedReserveData.lTokenInterestIndex = lTokenInterestIndex;
    expectedReserveData.moneyPoolLastUpdateTimestamp = txTimestamp;
  }
  if (!reserveDataBefore.moneyPoolLastUpdateTimestamp.eq(txTimestamp)) {
    lTokenInterestIndex = calculateLTokenIndexAfterAction(
      reserveDataBefore.moneyPoolLastUpdateTimestamp,
      reserveDataBefore.supplyAPR,
      reserveDataBefore.lTokenInterestIndex,
      txTimestamp
    );
    expectedReserveData.lTokenInterestIndex = lTokenInterestIndex;
    expectedReserveData.moneyPoolLastUpdateTimestamp = txTimestamp;
  }

  // update LToken balance
  const totalLTokenSupply = rayMul(reserveDataBefore.implicitLTokenSupply, lTokenInterestIndex);
  expectedReserveData.totalLTokenSupply = totalLTokenSupply;

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

  // update averageDTokenRate and dToken timestamp
  const averageRealAssetBorrowRate = calculateRateInIncreasingBalance(
    reserveDataBefore.averageRealAssetBorrowRate,
    previousUpdatedDTokenBalance,
    amountBorrow,
    reserveDataBefore.borrowAPR
  );
  /*
  console.log(
    'reserve',
    reserveDataBefore.averageRealAssetBorrowRate.toString(),
    averageRealAssetBorrowRate.toString()
  );
  */
  const totalDTokenSupply = previousUpdatedDTokenBalance.plus(amountBorrow);
  expectedReserveData.averageRealAssetBorrowRate = averageRealAssetBorrowRate;
  expectedReserveData.principalDTokenSupply = totalDTokenSupply;
  expectedReserveData.totalDTokenSupply = totalDTokenSupply;
  expectedReserveData.dTokenLastUpdateTimestamp = txTimestamp;

  // update rates in borrow
  const interestRates = calculateRateInInterestRateModel(
    reserveDataBefore.underlyingAssetBalance,
    totalDTokenSupply,
    new BigNumber(0),
    amountBorrow,
    averageRealAssetBorrowRate,
    reserveDataBefore.interestRateModelParams
  );
  expectedReserveData.borrowAPR = interestRates[0];
  expectedReserveData.supplyAPR = interestRates[1];

  // transfer underlying asset in burn logic
  expectedReserveData.underlyingAssetBalance = reserveDataBefore.underlyingAssetBalance.minus(
    amountBorrow
  );

  return expectedReserveData;
}

export function expectedUserDataAfterBorrow({
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
  const lTokenBalance = rayMul(
    userDataBefore.implicitLtokenBalance,
    reserveDataAfter.lTokenInterestIndex
  );
  expectedUserData.lTokenBalance = lTokenBalance;

  // update and mint dToken balance
  const dTokenAccruedInterest = calculateCompoundedInterest(
    userDataBefore.averageRealAssetBorrowRate,
    userDataBefore.userLastUpdateTimestamp,
    txTimestamp
  );
  const previousUpdatedDTokenBalance = rayMul(
    userDataBefore.principalDTokenBalance,
    dTokenAccruedInterest
  );
  const dTokenBalance = previousUpdatedDTokenBalance.plus(amountBorrow);

  expectedUserData.dTokenBalance = dTokenBalance;
  expectedUserData.principalDTokenBalance = dTokenBalance;

  /*
  console.log(
    'user',
    userDataBefore.averageRealAssetBorrowRate.toString(),
    previousUpdatedDTokenBalance.toString(),
    amountBorrow.toString(),
    reserveDataBefore.borrowAPR.toString()
  );
  */
  // update average Borrow rate and timestamp
  const averageRealAssetBorrowRate = calculateRateInIncreasingBalance(
    userDataBefore.averageRealAssetBorrowRate,
    previousUpdatedDTokenBalance,
    amountBorrow,
    reserveDataBefore.borrowAPR
  );
  expectedUserData.userLastUpdateTimestamp = txTimestamp;
  expectedUserData.averageRealAssetBorrowRate = averageRealAssetBorrowRate;
  // console.log('user', averageRealAssetBorrowRate.toString());

  // transferFrom
  const underlyingAssetBalance = userDataBefore.underlyingAssetBalance.plus(amountBorrow);
  expectedUserData.underlyingAssetBalance = underlyingAssetBalance;
  return expectedUserData;
}
