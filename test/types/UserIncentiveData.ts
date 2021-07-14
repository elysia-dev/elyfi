import { BigNumber } from 'ethers';

interface UserIncentiveData {
  userIndex: BigNumber;
  userIncentive: BigNumber;
  userLTokenBalance: BigNumber;
  incentiveAssetBalance: BigNumber;
}

export default UserIncentiveData;
