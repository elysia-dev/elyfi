import { BigNumber } from 'bignumber.js';
import { RAY, toRate } from './Ethereum';

export interface ReserveData {
  moneyPoolFactor: BigNumber;
  underlyingAssetAddress: string;
  underlyingAssetName: string;
  underlyingAssetSymbol: string;
  underlyingAssetDecimals: BigNumber;
  underlyingAssetBalance: BigNumber;
  totalLTokenSupply: BigNumber;
  implicitLTokenSupply: BigNumber;
  lTokenInterestIndex: BigNumber;
  principalDTokenSupply: BigNumber;
  totalDTokenSupply: BigNumber;
  averageRealAssetBorrowRate: BigNumber;
  borrowAPR: BigNumber;
  supplyAPR: BigNumber;
  moneyPoolLastUpdateTimestamp: BigNumber;
  dTokenLastUpdateTimestamp: BigNumber;
  lTokenAddress: string;
  dTokenAddress: string;
  interestRateModelAddress: string;
  tokenizerAddress: string;
  utilizationRate: BigNumber;
  interestRateModelParams: InterestModelParams;
}

export const defaultReserveData: ReserveData = <ReserveData>{
  moneyPoolFactor: toRate(0.03),
  underlyingAssetName: 'ELYSIA',
  underlyingAssetSymbol: 'EL',
  lTokenInterestIndex: RAY,
  borrowAPR: new BigNumber(0),
  supplyAPR: new BigNumber(0),
};

export interface InterestModelParams {
  optimalUtilizationRate: BigNumber;
  borrowRateBase: BigNumber;
  borrowRateOptimal: BigNumber;
  borrowRateMax: BigNumber;
}

export const defaultInterestModelParams: InterestModelParams = <InterestModelParams>{
  optimalUtilizationRate: toRate(0.8),
  borrowRateBase: toRate(0.02),
  borrowRateOptimal: toRate(0.1),
  borrowRateMax: toRate(1),
};
export interface UserData {
  underlyingAssetBalance: BigNumber;
  lTokenBalance: BigNumber;
  implicitLtokenBalance: BigNumber;
  dTokenBalance: BigNumber;
  previousDTokenBalance: BigNumber;
}

export interface BorrowerData extends UserData {
  userLastUpdateTimestamp: BigNumber;
  userAverageRealAssetBorrowRate: BigNumber;
  assetBonds: AssetBondData[];
}

export enum AssetBondState {
  EMPTY,
  SETTLED,
  CONFIRMED,
  COLLATERALIZED,
  MATURED,
  NOT_PERFORMED,
}
export interface AssetBondData {
  tokenId: BigNumber;
  dTokenBalance: BigNumber;
  tokenOwner: string;
  state: AssetBondState;
}
