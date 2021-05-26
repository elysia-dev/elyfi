import { BigNumber } from "ethers";
import { rayDiv, rayMul } from "./Ethereum";
import { ReserveData, UserData } from "./Interfaces";
import { calculateCompoundedInterest, calculateLinearInterest, calculateRateInInterestRateModel } from "./Math";

export function expectedReserveDataAfterInvestMoneyPool({
    amountInvest,
    reserveDataBefore,
    txTimestamp
}: {
    amountInvest: BigNumber,
    reserveDataBefore: ReserveData,
    txTimestamp: BigNumber
}): ReserveData {
    let expectedReserveData: ReserveData = reserveDataBefore

    // update states
    if (expectedReserveData.supplyAPR.eq(BigNumber.from(0))) {
        expectedReserveData.moneyPoolLastUpdateTimestamp = txTimestamp;
    }
    if (!expectedReserveData.moneyPoolLastUpdateTimestamp.eq(txTimestamp)) {
        expectedReserveData.lTokenInterestIndex = calculateLinearInterest(
            expectedReserveData.supplyAPR,
            expectedReserveData.moneyPoolLastUpdateTimestamp,
            txTimestamp
        );

        expectedReserveData.moneyPoolLastUpdateTimestamp = txTimestamp;
    }

    // update rates
    // totalSupply of L, A tokens
    const totalLTokenSupply = rayMul(expectedReserveData.implicitLTokenSupply, expectedReserveData.lTokenInterestIndex);
    const aTokenAccruedInterest = calculateLinearInterest(
        expectedReserveData.averageATokenAPR,
        expectedReserveData.tokenizerLastUpdateTimestamp,
        txTimestamp
    );
    const totalATokenSupply = rayMul(expectedReserveData.totalATokenSupply, aTokenAccruedInterest);

    const interestRates = calculateRateInInterestRateModel(
        totalLTokenSupply,
        totalATokenSupply,
        amountInvest,
        BigNumber.from(0),
        expectedReserveData.averageATokenAPR,
        expectedReserveData.interestRateModelParams
    );

    expectedReserveData.borrowAPR = interestRates[0];
    expectedReserveData.supplyAPR = interestRates[1];

    // update aToken indexes
    // need logic

    // transferFrom
    expectedReserveData.underlyingAssetBalance = reserveDataBefore.underlyingAssetBalance.add(amountInvest)

    // Mint lToken
    expectedReserveData.implicitLTokenSupply = expectedReserveData.implicitLTokenSupply.add(amountInvest);
    expectedReserveData.totalLTokenSupply = totalLTokenSupply.add(amountInvest);

    return expectedReserveData;
}

export function expectedUserDataAfterInvestMoneyPool({
    amountInvest,
    userDataBefore,
    reserveDataBefore,
    reserveDataAfter,
    txTimestamp
}: {
    amountInvest: BigNumber,
    userDataBefore: UserData,
    reserveDataBefore: ReserveData,
    reserveDataAfter: ReserveData,
    txTimestamp: BigNumber
}): UserData {
    let expectedUserData: UserData = userDataBefore;

    // transferFrom
    expectedUserData.underlyingAssetBalance = userDataBefore.underlyingAssetBalance.sub(amountInvest)
    // mint ltoken
    expectedUserData.implicitLtokenBalance = userDataBefore.implicitLtokenBalance.add(
        rayDiv(amountInvest, reserveDataAfter.lTokenInterestIndex))
    // update lToken balance
    expectedUserData.lTokenBalance = rayMul(expectedUserData.implicitLtokenBalance, reserveDataAfter.lTokenInterestIndex)

    return expectedUserData
}

export function expectedReserveDataAfterWithdrawMoneyPool({
    amountWithdraw,
    reserveDataBefore,
    txTimestamp
}: {
    amountWithdraw: BigNumber,
    reserveDataBefore: ReserveData,
    txTimestamp: BigNumber
}): ReserveData {
    let expectedReserveData: ReserveData = reserveDataBefore

    // update states
    if (expectedReserveData.supplyAPR.eq(BigNumber.from(0))) {
        expectedReserveData.moneyPoolLastUpdateTimestamp = txTimestamp;
    }
    if (!expectedReserveData.moneyPoolLastUpdateTimestamp.eq(txTimestamp)) {
        expectedReserveData.lTokenInterestIndex = calculateLinearInterest(
            expectedReserveData.supplyAPR,
            expectedReserveData.moneyPoolLastUpdateTimestamp,
            txTimestamp
        );


        expectedReserveData.moneyPoolLastUpdateTimestamp = txTimestamp;
    }

    // update rates in withdraw
    // totalSupply of L, D, A tokens
    const totalLTokenSupply = rayMul(expectedReserveData.implicitLTokenSupply, expectedReserveData.lTokenInterestIndex);
    const aTokenAccruedInterest = calculateLinearInterest(
        expectedReserveData.averageATokenAPR,
        expectedReserveData.tokenizerLastUpdateTimestamp,
        txTimestamp
    );
    const totalATokenSupply = rayMul(expectedReserveData.totalATokenSupply, aTokenAccruedInterest);

    const interestRates = calculateRateInInterestRateModel(
        totalLTokenSupply,
        totalATokenSupply,
        BigNumber.from(0),
        amountWithdraw,
        expectedReserveData.averageATokenAPR,
        expectedReserveData.interestRateModelParams
    );

    expectedReserveData.borrowAPR = interestRates[0];
    expectedReserveData.supplyAPR = interestRates[1];

    // update aToken indexes
    // need logic

    // Burn lToken
    expectedReserveData.implicitLTokenSupply = expectedReserveData.implicitLTokenSupply.sub(amountWithdraw);
    expectedReserveData.totalLTokenSupply = totalLTokenSupply.sub(amountWithdraw);

    // transfer underlying asset in burn logic
    expectedReserveData.underlyingAssetBalance = expectedReserveData.underlyingAssetBalance.sub(amountWithdraw);

    return expectedReserveData;
}

export function expectedUserDataAfterWithdrawMoneyPool({
    amountWithdraw,
    userDataBefore,
    reserveDataBefore,
    reserveDataAfter,
    txTimestamp
}: {
    amountWithdraw: BigNumber,
    userDataBefore: UserData,
    reserveDataBefore: ReserveData,
    reserveDataAfter: ReserveData,
    txTimestamp: BigNumber
}): UserData {
    let expectedUserData: UserData = userDataBefore;

    // burn lToken
    expectedUserData.implicitLtokenBalance = userDataBefore.implicitLtokenBalance.sub(
        rayDiv(amountWithdraw, reserveDataAfter.lTokenInterestIndex))

    // transfer underlyingAsset
    expectedUserData.underlyingAssetBalance = userDataBefore.underlyingAssetBalance.add(amountWithdraw)
    // update lToken balance
    expectedUserData.lTokenBalance = rayMul(expectedUserData.implicitLtokenBalance, reserveDataAfter.lTokenInterestIndex)

    return expectedUserData
}

export function expectedReserveDataAfterBorrowAgainstABToken({
    amountBorrow,
    reserveDataBefore,
    txTimestamp
}: {
    amountBorrow: BigNumber,
    reserveDataBefore: ReserveData,
    txTimestamp: BigNumber
}): ReserveData {
    let expectedReserveData: ReserveData = reserveDataBefore

    // update states
    if (expectedReserveData.supplyAPR.eq(BigNumber.from(0))) {
        expectedReserveData.moneyPoolLastUpdateTimestamp = txTimestamp;
    }
    if (!expectedReserveData.moneyPoolLastUpdateTimestamp.eq(txTimestamp)) {
        expectedReserveData.lTokenInterestIndex = calculateLinearInterest(
            expectedReserveData.supplyAPR,
            expectedReserveData.moneyPoolLastUpdateTimestamp,
            txTimestamp
        );

        expectedReserveData.moneyPoolLastUpdateTimestamp = txTimestamp;
    }

    // update rates in borrow
    // totalSupply of L, D, A tokens
    const totalLTokenSupply = rayMul(expectedReserveData.implicitLTokenSupply, expectedReserveData.lTokenInterestIndex);
    const aTokenAccruedInterest = calculateLinearInterest(
        expectedReserveData.averageATokenAPR,
        expectedReserveData.tokenizerLastUpdateTimestamp,
        txTimestamp
    );
    const totalATokenSupply = rayMul(expectedReserveData.totalATokenSupply, aTokenAccruedInterest);

    const interestRates = calculateRateInInterestRateModel(
        totalLTokenSupply,
        totalATokenSupply,
        BigNumber.from(0),
        amountBorrow,
        expectedReserveData.averageATokenAPR,
        expectedReserveData.interestRateModelParams
    );

    expectedReserveData.borrowAPR = interestRates[0];
    expectedReserveData.supplyAPR = interestRates[1];

    // update aToken indexes
    // need logic

    // mint AToken
    expectedReserveData.totalATokenSupply = totalATokenSupply.add(amountBorrow);
    expectedReserveData.totalMoneyPoolATokenBalance = expectedReserveData.totalMoneyPoolATokenBalance.add(amountBorrow);

    // transfer underlying asset in burn logic
    expectedReserveData.underlyingAssetBalance = expectedReserveData.underlyingAssetBalance.sub(amountBorrow);

    return expectedReserveData;
}

export function expectedCSPDataAfterBorrowAgainstABToken({
    amountBorrow,
    userDataBefore,
    reserveDataBefore,
    reserveDataAfter,
    txTimestamp
}: {
    amountBorrow: BigNumber,
    userDataBefore: UserData,
    reserveDataBefore: ReserveData,
    reserveDataAfter: ReserveData,
    txTimestamp: BigNumber
}): UserData {
    let expectedUserData: UserData = userDataBefore;

    // burn lToken
    expectedUserData.implicitLtokenBalance = userDataBefore.implicitLtokenBalance.sub(
        rayDiv(amountBorrow, reserveDataAfter.lTokenInterestIndex))

    // transfer underlyingAsset
    expectedUserData.underlyingAssetBalance = userDataBefore.underlyingAssetBalance.add(amountBorrow)
    // update lToken balance
    expectedUserData.lTokenBalance = rayMul(expectedUserData.implicitLtokenBalance, reserveDataAfter.lTokenInterestIndex)


    return expectedUserData
}