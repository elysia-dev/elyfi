import { BigNumber } from "ethers"

export interface ReserveData {
    address: string;
    symbol: string;
    decimals: BigNumber;
    totalLiquidity: BigNumber;
    availableLiquidity: BigNumber;
    totalStableDebt: BigNumber;
    totalVariableDebt: BigNumber;
    principalStableDebt: BigNumber;
    scaledVariableDebt: BigNumber;
    averageStableBorrowRate: BigNumber;
    variableBorrowRate: BigNumber;
    stableBorrowRate: BigNumber;
    utilizationRate: BigNumber;
    liquidityIndex: BigNumber;
    variableBorrowIndex: BigNumber;
    aTokenAddress: string;
    marketStableRate: BigNumber;
    lastUpdateTimestamp: BigNumber;
    totalStableDebtLastUpdated: BigNumber;
    liquidityRate: BigNumber;
    [key: string]: BigNumber | string;
  }