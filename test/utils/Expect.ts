import { BigNumber, constants, Wallet } from 'ethers';
import AssetBondData from '../types/AssetBondData';
import AssetBondState from '../types/AssetBondState';
import IncentivePoolData from '../types/IncentivePoolData';
import ReserveData from '../types/ReserveData';
import UserData from '../types/UserData';
import UserIncentiveData from '../types/UserIncentiveData';
import { rayDiv, rayMul } from './Ethereum';
import {
  calculateAssetBondDebtData,
  calculateAssetBondLiquidationData,
  calculateCompoundedInterest,
  calculateDataAfterUpdate,
  calculateLTokenIndexAfterAction,
  calculateRateInDecreasingBalance,
  calculateRateInIncreasingBalance,
  calculateRateInInterestRateModel,
} from './Math';

// Update lTokenInterestIndex, moneyPoolLastUpdateTimestamp, totalDTokenSupply
function applyTxTimeStamp(reserveData: ReserveData, txTimestamp: BigNumber): ReserveData {
  const newReserveData: ReserveData = { ...reserveData };

  if (newReserveData.depositAPY.eq(constants.Zero))
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
    constants.Zero,
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
    constants.Zero,
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
  expectedUserData.underlyingAssetBalance =
    userDataBefore.underlyingAssetBalance.sub(amountDeposit);

  // mint ltoken
  expectedUserData.implicitLtokenBalance = userDataBefore.implicitLtokenBalance.add(
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
  expectedUserData.underlyingAssetBalance =
    userDataBefore.underlyingAssetBalance.add(amountWithdraw);
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
    constants.Zero,
    amountBorrow,
    reserveDataBefore.interestRateModelParams
  );
  expectedReserveData.borrowAPY = borrowAPY;
  expectedReserveData.depositAPY = depositAPY;

  // transfer underlying asset in burn logic
  expectedReserveData.underlyingAssetBalance =
    reserveDataBefore.underlyingAssetBalance.sub(amountBorrow);

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

  // update totalDTokenSupply
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

  // update dToken averageBorrowRate
  const newAverageRealAssetBorrowRate = calculateRateInDecreasingBalance(
    reserveData.averageRealAssetBorrowRate,
    previousUpdatedDTokenBalance,
    accruedDebtOnMoneyPool,
    assetBondData.interestRate
  );
  newReserveData.principalDTokenSupply = totalDTokenSupply;
  newReserveData.totalDTokenSupply = totalDTokenSupply;
  newReserveData.averageRealAssetBorrowRate = newAverageRealAssetBorrowRate;

  // update dTokenLasetUpdateTimestamp
  newReserveData.dTokenLastUpdateTimestamp = txTimestamp;

  // transferFrom
  const underlyingAssetBalance = reserveData.underlyingAssetBalance.add(totalRetrieveAmount);
  newReserveData.underlyingAssetBalance = underlyingAssetBalance;

  //updateRates
  const [borrowAPY, depositAPY] = calculateRateInInterestRateModel(
    newReserveData.underlyingAssetBalance,
    newReserveData.totalDTokenSupply,
    totalRetrieveAmount,
    constants.Zero,
    newReserveData.interestRateModelParams
  );

  newReserveData.borrowAPY = borrowAPY;
  newReserveData.depositAPY = depositAPY;

  // mint LToken
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
  if (dTokenBalance.eq(0)) {
    expectedUserData.userLastUpdateTimestamp = constants.Zero;
    expectedUserData.averageRealAssetBorrowRate = constants.Zero;
  } else {
    const averageRealAssetBorrowRate = calculateRateInDecreasingBalance(
      userDataBefore.averageRealAssetBorrowRate,
      previousUpdatedDTokenBalance,
      accruedDebtOnMoneyPool,
      assetBondData.interestRate
    );
    expectedUserData.userLastUpdateTimestamp = txTimestamp;
    expectedUserData.averageRealAssetBorrowRate = averageRealAssetBorrowRate;
  }

  // transfer underlying asset
  const totalRetrieveAmount = accruedDebtOnMoneyPool.add(feeOnRepayment);
  const underlyingAssetBalance = userDataBefore.underlyingAssetBalance.sub(totalRetrieveAmount);
  expectedUserData.underlyingAssetBalance = underlyingAssetBalance;

  return expectedUserData;
}

export function expectReserveDataAfterLiquidate({
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

  const [accruedDebtOnMoneyPool, feeOnRepayment] = calculateAssetBondLiquidationData(
    assetBondData,
    txTimestamp
  );

  const totalLiquidationAmount = accruedDebtOnMoneyPool.add(feeOnRepayment);

  // update totalDTokenSupply
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

  // update dToken averageBorrowRate
  const newAverageRealAssetBorrowRate = calculateRateInDecreasingBalance(
    reserveData.averageRealAssetBorrowRate,
    previousUpdatedDTokenBalance,
    accruedDebtOnMoneyPool,
    assetBondData.interestRate
  );
  newReserveData.principalDTokenSupply = totalDTokenSupply;
  newReserveData.totalDTokenSupply = totalDTokenSupply;
  newReserveData.averageRealAssetBorrowRate = newAverageRealAssetBorrowRate;

  // update dTokenLasetUpdateTimestamp
  newReserveData.dTokenLastUpdateTimestamp = txTimestamp;

  //updateRates
  const [borrowAPY, depositAPY] = calculateRateInInterestRateModel(
    newReserveData.underlyingAssetBalance,
    newReserveData.totalDTokenSupply,
    totalLiquidationAmount,
    constants.Zero,
    newReserveData.interestRateModelParams
  );

  // transferFrom
  const underlyingAssetBalance = reserveData.underlyingAssetBalance.add(totalLiquidationAmount);
  newReserveData.underlyingAssetBalance = underlyingAssetBalance;

  newReserveData.borrowAPY = borrowAPY;
  newReserveData.depositAPY = depositAPY;

  // mint LToken
  newReserveData.implicitLTokenSupply = newReserveData.implicitLTokenSupply.add(
    rayDiv(feeOnRepayment, newReserveData.lTokenInterestIndex)
  );

  newReserveData.totalLTokenSupply = rayMul(
    newReserveData.implicitLTokenSupply,
    newReserveData.lTokenInterestIndex
  );

  return newReserveData;
}

export function expectUserDataAfterLiquidate({
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

  const [accruedDebtOnMoneyPool, feeOnRepayment] = calculateAssetBondLiquidationData(
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
  if (dTokenBalance.eq(0)) {
    expectedUserData.userLastUpdateTimestamp = constants.Zero;
    expectedUserData.averageRealAssetBorrowRate = constants.Zero;
  } else {
    const averageRealAssetBorrowRate = calculateRateInDecreasingBalance(
      userDataBefore.averageRealAssetBorrowRate,
      previousUpdatedDTokenBalance,
      accruedDebtOnMoneyPool,
      assetBondData.interestRate
    );
    expectedUserData.userLastUpdateTimestamp = txTimestamp;
    expectedUserData.averageRealAssetBorrowRate = averageRealAssetBorrowRate;
  }

  // transfer underlying asset
  return expectedUserData;
}

export function expectAssetBondDataAfterRepay({
  assetBondData,
}: {
  assetBondData: AssetBondData;
}): AssetBondData {
  const expectedAssetBondData: AssetBondData = { ...assetBondData };

  expectedAssetBondData.accruedDebtOnMoneyPool = constants.Zero;

  expectedAssetBondData.feeOnCollateralServiceProvider = constants.Zero;

  expectedAssetBondData.state = AssetBondState.REDEEMED;

  expectedAssetBondData.tokenOwner = assetBondData.borrower;

  return expectedAssetBondData;
}

export function expectAssetBondDataAfterLiquidate({
  assetBondData,
  liquidator,
}: {
  assetBondData: AssetBondData;
  liquidator: Wallet;
}): AssetBondData {
  const expectedAssetBondData: AssetBondData = { ...assetBondData };

  expectedAssetBondData.accruedDebtOnMoneyPool = constants.Zero;

  expectedAssetBondData.feeOnCollateralServiceProvider = constants.Zero;

  expectedAssetBondData.state = AssetBondState.LIQUIDATED;

  expectedAssetBondData.tokenOwner = liquidator.address;

  return expectedAssetBondData;
}

const logger = (object: Object) => {
  (Object.keys(object) as (keyof Object)[]).forEach((key) => {
    console.log(key, object[key].toString());
  });
};

export function expectIncentiveDataAfterDeposit(
  incentivePoolData: IncentivePoolData,
  userIncentiveData: UserIncentiveData,
  txTimeStamp: BigNumber,
  amount: BigNumber
): [IncentivePoolData, UserIncentiveData] {
  const [newIncentivePoolData, newUserIncentiveData]: [IncentivePoolData, UserIncentiveData] =
    calculateDataAfterUpdate(incentivePoolData, userIncentiveData, txTimeStamp);

  logger(newIncentivePoolData);
  logger(newUserIncentiveData);

  const newUserLTokenBalance = newUserIncentiveData.userLTokenBalance.add(amount);
  newUserIncentiveData.userLTokenBalance = newUserLTokenBalance;

  const newTotalLTokenSupply = newIncentivePoolData.totalLTokenSupply.add(amount);
  newIncentivePoolData.totalLTokenSupply = newTotalLTokenSupply;

  return [newIncentivePoolData, newUserIncentiveData];
}

export function expectIncentiveDataAfterWithdraw(
  incentivePoolData: IncentivePoolData,
  userIncentiveData: UserIncentiveData,
  txTimeStamp: BigNumber,
  amount: BigNumber
): [IncentivePoolData, UserIncentiveData] {
  const [newIncentivePoolData, newUserIncentiveData]: [IncentivePoolData, UserIncentiveData] =
    calculateDataAfterUpdate(incentivePoolData, userIncentiveData, txTimeStamp);

  const newUserLTokenBalance = newUserIncentiveData.userLTokenBalance.sub(amount);
  newUserIncentiveData.userLTokenBalance = newUserLTokenBalance;

  const newTotalLTokenSupply = newIncentivePoolData.totalLTokenSupply.sub(amount);
  newIncentivePoolData.totalLTokenSupply = newTotalLTokenSupply;

  return [newIncentivePoolData, newUserIncentiveData];
}

export function expectDataAfterClaim(
  incentivePoolData: IncentivePoolData,
  userIncentiveData: UserIncentiveData,
  txTimeStamp: BigNumber,
  amount: BigNumber
): [IncentivePoolData, UserIncentiveData] {
  const [newIncentivePoolData, newUserIncentiveData]: [IncentivePoolData, UserIncentiveData] =
    calculateDataAfterUpdate(incentivePoolData, userIncentiveData, txTimeStamp);

  return [newIncentivePoolData, newUserIncentiveData];
}
