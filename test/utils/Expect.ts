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
    if (expectedReserveData.supplyAPR == BigNumber.from(0)) {
        expectedReserveData.moneyPoolLastUpdateTimestamp = txTimestamp;
    }
    if (expectedReserveData.moneyPoolLastUpdateTimestamp != txTimestamp) {
        expectedReserveData.lTokenInterestIndex = calculateLinearInterest(
            expectedReserveData.supplyAPR,
            expectedReserveData.moneyPoolLastUpdateTimestamp,
            txTimestamp
        );
        expectedReserveData.dTokenInterestIndex = calculateCompoundedInterest(
            expectedReserveData.digitalAssetAPR,
            expectedReserveData.moneyPoolLastUpdateTimestamp,
            txTimestamp
        );

        expectedReserveData.moneyPoolLastUpdateTimestamp = txTimestamp;
    }

    // update rates
    // totalSupply of L, D, A tokens
    const totalLTokenSupply = rayMul(expectedReserveData.implicitLTokenSupply, expectedReserveData.lTokenInterestIndex);
    const totalDTokenSupply = rayMul(expectedReserveData.implicitDTokenSupply, expectedReserveData.dTokenInterestIndex);
    const aTokenAccruedInterest = calculateLinearInterest(
        expectedReserveData.averageATokenAPR,
        expectedReserveData.tokenizerLastUpdateTimestamp,
        txTimestamp
    );
    const totalATokenSupply = rayMul(expectedReserveData.totalATokenSupply, aTokenAccruedInterest);

    const interestRates = calculateRateInInterestRateModel(
        totalLTokenSupply,
        totalATokenSupply,
        totalDTokenSupply,
        amountInvest,
        BigNumber.from(0),
        expectedReserveData.averageATokenAPR,
        expectedReserveData.interestRateModelParams
    );

    expectedReserveData.realAssetAPR = interestRates[0];
    expectedReserveData.digitalAssetAPR = interestRates[1];
    expectedReserveData.supplyAPR = interestRates[2];

    // update aToken indexes
    // need logic

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
    // update dtoken balance
    expectedUserData.dTokenBalance = rayMul(userDataBefore.implicitDtokenBalance, reserveDataAfter.dTokenInterestIndex)
    // update aToken investment
    // need logic

    return expectedUserData
}