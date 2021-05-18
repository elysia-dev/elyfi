import { BigNumber, BigNumberish } from "ethers"
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
    totalATokenSupply: BigNumber;
    totalMoneyPoolATokenBalance: BigNumber;
    lTokenInterestIndex: BigNumber;
    dTokenInterestIndex: BigNumber;
    averageATokenAPR: BigNumber;
    realAssetAPR: BigNumber;
    digitalAssetAPR: BigNumber;
    supplyAPR: BigNumber;
    lastUpdateTimestamp: BigNumber;
    tokenizerLastUpdateTimestamp: BigNumber;
    lTokenAddress: string;
    dTokenAddress: string;
    interestRateModelAddress: string;
    tokenizerAddress: string;
    stableBorrowRate: BigNumber;
    utilizationRate: BigNumber;
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
    optimalUtilizationRate: BigNumber;
    digitalAssetBorrowRateBase: BigNumber;
    digitalAssetBorrowRateOptimal: BigNumber;
    digitalAssetBorrowRateMax: BigNumber;
    realAssetBorrowRateBase: BigNumber;
    realAssetBorrowRateOptimal: BigNumber;
    realAssetBorrowRateMax: BigNumber;
}

export const defaultInterestModelParams: InterestModelParams = <InterestModelParams>{
    optimalUtilizationRate: toRate(0.8),
    digitalAssetBorrowRateBase: toRate(0.02),
    digitalAssetBorrowRateOptimal: toRate(0.1),
    digitalAssetBorrowRateMax: toRate(1),
    realAssetBorrowRateBase: toRate(0.04),
    realAssetBorrowRateOptimal: toRate(0.2),
    realAssetBorrowRateMax: toRate(2),
}
export interface UserData {
    underlyingAssetBalance: BigNumber;
    lTokenBalance: BigNumber;
    implicitLtokenBalance: BigNumber;
    dTokenBalance: BigNumber;
    implicitDtokenBalance: BigNumber;
    aTokenInvestments: ATokenInvestment[];
}
interface ATokenInvestment {
    lastUpdatetimestamp: BigNumber;
    averageSupplyAPR: BigNumber;
    aTokenBalance: BigNumber;
}