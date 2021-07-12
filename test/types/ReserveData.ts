import { BigNumber, constants, ethers } from 'ethers';
import InterestModelParams from './InterestRateModelParams';

interface ReserveData {
  moneyPoolFactor: BigNumber;
  underlyingAssetAddress: string;
  underlyingAssetName: string;
  underlyingAssetSymbol: string;
  underlyingAssetDecimals: BigNumber;
  underlyingAssetBalance: BigNumber;
  totalLTokenSupply: BigNumber;
  implicitLTokenSupply: BigNumber;
  lTokenInterestIndex: BigNumber;
  principleDTokenSupply: BigNumber;
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

export default ReserveData;
