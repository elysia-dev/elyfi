import { BigNumber } from "ethers";
import { rayMul } from "./Ethereum";
import { ReserveData } from "./Interfaces";
import { calculateCompoundedInterest, calculateLinearInterest } from "./Math";

export function expectedReserveDataAfterInvest(
    amountDeposit: BigNumber,
    reserveDataBefore: ReserveData,
    txTimestamp: BigNumber
): ReserveData {
    let expectedReserveData: ReserveData = reserveDataBefore

    // update states
    if (expectedReserveData.supplyAPR == BigNumber.from(0) ) {
        expectedReserveData.lastUpdateTimestamp = txTimestamp;
    }
    if (expectedReserveData.lastUpdateTimestamp != txTimestamp) {
        expectedReserveData.lTokenInterestIndex = calculateLinearInterest(
            expectedReserveData.supplyAPR,
            expectedReserveData.lastUpdateTimestamp,
            txTimestamp
        );
        expectedReserveData.dTokenInterestIndex = calculateCompoundedInterest(
            expectedReserveData.digitalAssetAPR,
            expectedReserveData.lastUpdateTimestamp,
            txTimestamp
        );

        expectedReserveData.lastUpdateTimestamp = txTimestamp;
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
    const totalATokenSupply = rayMul(expectedReserveData.totalATokenSupply, aTokenAccruedInterest)

    

    expectedReserveData.totalLTokenSupply = expectedReserveData.totalLTokenSupply.add(amountDeposit);
    expectedReserveData.totalDTokenSupply = expectedReserveData.totalDTokenSupply.add(amountDeposit);

    return expectedReserveData;
}