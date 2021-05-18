import { BigNumber } from "ethers";
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



    expectedReserveData.totalLTokenSupply = expectedReserveData.totalLTokenSupply.add(amountDeposit);
    expectedReserveData.totalDTokenSupply = expectedReserveData.totalDTokenSupply.add(amountDeposit);

    return expectedReserveData;
}