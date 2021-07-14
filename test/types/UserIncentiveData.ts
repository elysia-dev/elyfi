import { BigNumber } from 'ethers';

interface UserIncentiveData {
  userIndex: BigNumber;
  userReward: BigNumber;
  userLTokenBalance: BigNumber;
  incentiveAssetBalance: BigNumber;
}

export default UserIncentiveData;
