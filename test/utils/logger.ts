import { ReserveData } from "./Interfaces";

export function logReserveData(reserveData: ReserveData) {

  ([
    'totalLTokenSupply',
    'implicitLTokenSupply',
    'lTokenInterestIndex',
    'principalDTokenSupply',
    'totalDTokenSupply',
    'averageRealAssetBorrowRate',
    'borrowAPY',
    'depositAPY',
  ] as (keyof ReserveData)[]).forEach((key) => {
    console.log(`${key} = ${reserveData[key]}`)
  })
}