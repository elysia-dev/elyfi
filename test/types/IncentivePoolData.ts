import { BigNumber } from 'ethers';

interface IncentivePoolData {
  incentiveIndex: BigNumber;
  lastUpdateTimestamp: BigNumber;
  totalLTokenSupply: BigNumber;
  totalRewardAssetBalance: BigNumber;
  endTimestamp: BigNumber;
  amountPerSecond: BigNumber;
}

export default IncentivePoolData;
