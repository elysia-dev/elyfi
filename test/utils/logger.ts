import { ReserveData } from "./Interfaces";

export function logReserveData(reserveData: ReserveData) {

  ([
    'totalLTokenSupply',
    'implicitLTokenSupply',
    'lTokenInterestIndex',
    'principalDTokenSupply',
    'totalDTokenSupply',
    'averageRealAssetBorrowRate',
    'borrowAPR',
    'supplyAPR',
  ] as (keyof ReserveData)[]).forEach((key) => {
    console.log(`${key} = ${reserveData[key]}`)
  })
}