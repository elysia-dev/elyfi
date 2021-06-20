import { BigNumber, constants, ethers } from 'ethers';
import { toRate } from './Ethereum';
import { RAY } from './constants';

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
  borrowAPY: BigNumber;
  depositAPY: BigNumber;
  moneyPoolLastUpdateTimestamp: BigNumber;
  dTokenLastUpdateTimestamp: BigNumber;
  lTokenAddress: string;
  dTokenAddress: string;
  interestRateModelAddress: string;
  tokenizerAddress: string;
  interestRateModelParams: InterestModelParams;
}

export const defaultReserveData: ReserveData = <ReserveData>{
  moneyPoolFactor: toRate(0.03),
  underlyingAssetName: 'ELYSIA',
  underlyingAssetSymbol: 'EL',
  lTokenInterestIndex: BigNumber.from(RAY),
  borrowAPY: constants.Zero,
  depositAPY: constants.Zero,
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
  principalDTokenBalance: BigNumber;
  averageRealAssetBorrowRate: BigNumber;
  userLastUpdateTimestamp: BigNumber;
}

export enum AssetBondState {
  EMPTY,
  SETTLED,
  CONFIRMED,
  COLLATERALIZED,
  MATURED,
  REDEEMED,
  NOT_PERFORMED,
}
export interface AssetBondData {
  state: AssetBondState;
  tokenId: BigNumber;
  minter: string;
  tokenOwner: string;
  borrower: string;
  signer: string;
  collateralServiceProvider: string;
  principal: BigNumber;
  debtCeiling: BigNumber;
  couponRate: BigNumber;
  interestRate: BigNumber;
  overdueInterestRate: BigNumber;
  loanStartTimestamp: BigNumber;
  collateralizeTimestamp: BigNumber;
  maturityTimestamp: BigNumber;
  liquidationTimestamp: BigNumber;
  accruedDebtOnMoneyPool: BigNumber;
  feeOnCollateralServiceProvider: BigNumber;
  ipfsHash: string;
  signerOpinionHash: string;
}
export interface AssetBondSettleData extends AssetBondData {
  loanDuration: BigNumber;
  loanStartTimeYear: BigNumber;
  loanStartTimeMonth: BigNumber;
  loanStartTimeDay: BigNumber;
}
