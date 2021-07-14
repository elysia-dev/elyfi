import { BigNumber } from 'ethers';

interface IncentivePoolData {
  incentiveIndex: BigNumber;
  lastUpdateTimestamp: BigNumber;
  totalLTokenSupply: BigNumber;
  totalRewardAssetBalance: BigNumber;
}

export default IncentivePoolData;
