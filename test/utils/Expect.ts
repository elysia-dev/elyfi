import { BigNumber } from 'bignumber.js';
import { rayDiv, rayMul } from './Ethereum';
import { ReserveData, UserData } from './Interfaces';
import {
  calculateCompoundedInterest,
  calculateLTokenIndexAfterAction,
  calculateRateInIncreasingBalance,
  calculateRateInInterestRateModel,
} from './Math';

export function expectedReserveDataAfterInvestMoneyPool({
  amountInvest,
  reserveDataBefore,
  txTimestamp,
}: {
  amountInvest: BigNumber;
  reserveDataBefore: ReserveData;
  txTimestamp: BigNumber;
}): ReserveData {
  let expectedReserveData: ReserveData = reserveDataBefore;

  console.log(
    'expect Timestamp: Before > Tx > DToken',
    reserveDataBefore.dTokenLastUpdateTimestamp.toFixed(),
    txTimestamp.toFixed(),
    expectedReserveData.totalDTokenSupply.toFixed(),
    expectedReserveData.borrowAPR.toFixed()
  );

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

  console.log(
    'Expected: totalL | totalD  | borrowAPR | supplyAPR | ',
    totalLTokenSupply.toFixed(),
    totalDTokenSupply.toFixed(),
    expectedReserveData.borrowAPR.toFixed(),
    expectedReserveData.supplyAPR.toFixed()
  );

  return expectedReserveData;
}

export function expectedUserDataAfterInvestMoneyPool({
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
  let expectedUserData: UserData = userDataBefore;

  // transferFrom
  expectedUserData.underlyingAssetBalance = userDataBefore.underlyingAssetBalance.minus(
    amountInvest
  );
  // mint ltoken
  expectedUserData.implicitLtokenBalance = userDataBefore.implicitLtokenBalance.plus(
    rayDiv(amountInvest, reserveDataAfter.lTokenInterestIndex)
  );
  // update lToken balance
  expectedUserData.lTokenBalance = rayMul(
    expectedUserData.implicitLtokenBalance,
    reserveDataAfter.lTokenInterestIndex
  );

  return expectedUserData;
}

export function expectedReserveDataAfterWithdrawMoneyPool({
  amountWithdraw,
  reserveDataBefore,
  txTimestamp,
}: {
  amountWithdraw: BigNumber;
  reserveDataBefore: ReserveData;
  txTimestamp: BigNumber;
}): ReserveData {
  let expectedReserveData: ReserveData = reserveDataBefore;

  // update lTokenIndex and moneyPool timestamp
  if (expectedReserveData.supplyAPR.eq(new BigNumber(0))) {
    expectedReserveData.moneyPoolLastUpdateTimestamp = txTimestamp;
  }
  if (!expectedReserveData.moneyPoolLastUpdateTimestamp.eq(txTimestamp)) {
    expectedReserveData.lTokenInterestIndex = calculateLTokenIndexAfterAction(
      reserveDataBefore.moneyPoolLastUpdateTimestamp,
      expectedReserveData.supplyAPR,
      expectedReserveData.lTokenInterestIndex,
      txTimestamp
    );
    expectedReserveData.moneyPoolLastUpdateTimestamp = txTimestamp;
  }

  // update DToken balance
  const dTokenAccruedInterest = calculateCompoundedInterest(
    expectedReserveData.averageRealAssetBorrowRate,
    expectedReserveData.dTokenLastUpdateTimestamp,
    txTimestamp
  );
  const totalDTokenSupply = rayMul(expectedReserveData.totalDTokenSupply, dTokenAccruedInterest);
  expectedReserveData.totalDTokenSupply = totalDTokenSupply;

  // update LToken balance
  const totalLTokenSupply = rayMul(
    expectedReserveData.implicitLTokenSupply,
    expectedReserveData.lTokenInterestIndex
  );

  const interestRates = calculateRateInInterestRateModel(
    reserveDataBefore.underlyingAssetBalance,
    totalDTokenSupply,
    new BigNumber(0),
    amountWithdraw,
    expectedReserveData.averageRealAssetBorrowRate,
    expectedReserveData.interestRateModelParams
  );

  expectedReserveData.borrowAPR = interestRates[0];
  expectedReserveData.supplyAPR = interestRates[1];

  // update aToken indexes
  // need logic

  // Burn lToken
  expectedReserveData.implicitLTokenSupply = expectedReserveData.implicitLTokenSupply.minus(
    amountWithdraw
  );
  expectedReserveData.totalLTokenSupply = totalLTokenSupply.minus(amountWithdraw);

  // transfer underlying asset in burn logic
  expectedReserveData.underlyingAssetBalance = expectedReserveData.underlyingAssetBalance.minus(
    amountWithdraw
  );

  return expectedReserveData;
}

export function expectedUserDataAfterWithdrawMoneyPool({
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
  let expectedUserData: UserData = userDataBefore;

  // burn lToken
  expectedUserData.implicitLtokenBalance = userDataBefore.implicitLtokenBalance.minus(
    rayDiv(amountWithdraw, reserveDataAfter.lTokenInterestIndex)
  );

  // transfer underlyingAsset
  expectedUserData.underlyingAssetBalance = userDataBefore.underlyingAssetBalance.plus(
    amountWithdraw
  );
  // update lToken balance
  expectedUserData.lTokenBalance = rayMul(
    expectedUserData.implicitLtokenBalance,
    reserveDataAfter.lTokenInterestIndex
  );

  return expectedUserData;
}

export function expectedReserveDataAfterBorrowAgainstABToken({
  amountBorrow,
  reserveDataBefore,
  txTimestamp,
}: {
  amountBorrow: BigNumber;
  reserveDataBefore: ReserveData;
  txTimestamp: BigNumber;
}): ReserveData {
  let expectedReserveData: ReserveData = reserveDataBefore;

  // update lTokenIndex and moneyPool timestamp
  let lTokenInterestIndex = reserveDataBefore.lTokenInterestIndex;
  if (expectedReserveData.supplyAPR.eq(new BigNumber(0))) {
    expectedReserveData.lTokenInterestIndex = lTokenInterestIndex;
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

  // update LToken balance
  const totalLTokenSupply = rayMul(reserveDataBefore.implicitLTokenSupply, lTokenInterestIndex);
  expectedReserveData.totalLTokenSupply = totalLTokenSupply;

  // update DToken supply
  const dTokenAccruedInterest = calculateCompoundedInterest(
    expectedReserveData.averageRealAssetBorrowRate,
    expectedReserveData.dTokenLastUpdateTimestamp,
    txTimestamp
  );
  const previousUpdatedDTokenBalance = rayMul(
    expectedReserveData.principalDTokenSupply,
    dTokenAccruedInterest
  );

  // update averageDTokenRate and dToken timestamp
  const averageRealAssetBorrowRate = calculateRateInIncreasingBalance(
    reserveDataBefore.averageRealAssetBorrowRate,
    previousUpdatedDTokenBalance,
    amountBorrow,
    reserveDataBefore.borrowAPR
  );
  const totalDTokenSupply = previousUpdatedDTokenBalance.plus(amountBorrow);
  expectedReserveData.averageRealAssetBorrowRate = expectedReserveData.totalDTokenSupply = totalDTokenSupply;
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

export function expectedUserDataAfterBorrowAgainstABToken({
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
  let expectedUserData: UserData = userDataBefore;

  // burn lToken
  expectedUserData.implicitLtokenBalance = userDataBefore.implicitLtokenBalance.minus(
    rayDiv(amountBorrow, reserveDataAfter.lTokenInterestIndex)
  );

  // transfer underlyingAsset
  expectedUserData.underlyingAssetBalance = userDataBefore.underlyingAssetBalance.plus(
    amountBorrow
  );
  // update lToken balance
  expectedUserData.lTokenBalance = rayMul(
    expectedUserData.implicitLtokenBalance,
    reserveDataAfter.lTokenInterestIndex
  );

  return expectedUserData;
}
