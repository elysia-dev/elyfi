import { BigNumber } from "ethers";
import { ReserveData } from "./Interfaces";

export function expectedReserveDataAfterInvest(
    amountDeposit: BigNumber,
    reserveDataBefore: ReserveData,
    txTimestamp: BigNumber
): ReserveData {
    let expectedReserveData: ReserveData = reserveDataBefore

    expectedReserveData.totalLTokenSupply = expectedReserveData.totalLTokenSupply.add(amountDeposit) 
}