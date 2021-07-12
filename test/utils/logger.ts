import ReserveData from '../types/ReserveData';

export function logReserveData(reserveData: ReserveData) {
  (
    [
      'totalLTokenSupply',
      'implicitLTokenSupply',
      'lTokenInterestIndex',
      'principleDTokenSupply',
      'totalDTokenSupply',
      'averageRealAssetBorrowRate',
      'borrowAPY',
      'depositAPY',
    ] as (keyof ReserveData)[]
  ).forEach((key) => {
    console.log(`${key} = ${reserveData[key]}`);
  });
}
