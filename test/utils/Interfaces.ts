import { BigNumber } from "ethers"
import { RAY, toRate } from "./Ethereum"

export interface ReserveData {
    underlyingAssetAddress: string;
    underlyingAssetName: string;
    underlyingAssetsymbol: string;
    underlyingAssetdecimals: BigNumber;
    totalLTokenSupply: BigNumber;
    implicitLTokenSupply: BigNumber;
    totalDTokenSupply: BigNumber;
    implicitDTokenSupply: BigNumber;
    lTokenInterestIndex: BigNumber;
    dTokenInterestIndex: BigNumber;
    realAssetAPR: BigNumber;
    digitalAssetAPR: BigNumber;
    supplyAPR: BigNumber;
    lastUpdateTimestamp: BigNumber;
    lTokenAddress: string
    dTokenAddress: string
    stableBorrowRate: BigNumber;
    utilizationRate: BigNumber;
    interestRateModelAddress: string
    interestRateModelParams : InterestModelParams
}

export const defaultReserveData: ReserveData = <ReserveData>{
    underlyingAssetName: "ELYSIA",
    underlyingAssetsymbol: "EL",
    lTokenInterestIndex: RAY,
    dTokenInterestIndex: RAY,
    realAssetAPR: BigNumber.from(0),
    digitalAssetAPR: BigNumber.from(0),
    supplyAPR: BigNumber.from(0),
}

export interface InterestModelParams {
    optimalDigitalAssetUtilizationRate: BigNumber;
    optimalRealAssetUtilizationRate: BigNumber;
    digitalAssetBorrowRateBase: BigNumber;
    digitalAssetBorrowRateOptimal: BigNumber;
    digitalAssetBorrowRateMax: BigNumber;
    realAssetBorrowRateBase: BigNumber;
    realAssetBorrowRateOptimal: BigNumber;
    realAssetBorrowRateMax: BigNumber;
}

export const defaultInterestModelParams: InterestModelParams = <InterestModelParams>{
    optimalDigitalAssetUtilizationRate: toRate(0.8),
    optimalRealAssetUtilizationRate: toRate(0.8),
    digitalAssetBorrowRateBase: toRate(0.02),
    digitalAssetBorrowRateOptimal: toRate(0.1),
    digitalAssetBorrowRateMax: toRate(0.4),
    realAssetBorrowRateBase: toRate(0.05),
    realAssetBorrowRateOptimal: toRate(0.2),
    realAssetBorrowRateMax: toRate(0.6),
}