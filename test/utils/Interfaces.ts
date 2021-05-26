import { BigNumber, BigNumberish } from 'ethers';
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
  totalATokenSupply: BigNumber;
  totalMoneyPoolATokenBalance: BigNumber;
  lTokenInterestIndex: BigNumber;
  // aTokenInterestIndexes: BigNumber[];
  averageATokenAPR: BigNumber;
  borrowAPR: BigNumber;
  supplyAPR: BigNumber;
  moneyPoolLastUpdateTimestamp: BigNumber;
  tokenizerLastUpdateTimestamp: BigNumber;
  lTokenAddress: string;
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
  borrowAPR: BigNumber.from(0),
  supplyAPR: BigNumber.from(0),
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
}

export interface CSPData extends UserData {
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
  aTokenBalance: BigNumber;
  tokenOwner: string;
  state: AssetBondState;
}
