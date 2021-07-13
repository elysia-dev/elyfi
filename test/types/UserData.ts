import { BigNumber } from 'ethers';

interface UserData {
  underlyingAssetBalance: BigNumber;
  lTokenBalance: BigNumber;
  implicitLtokenBalance: BigNumber;
  dTokenBalance: BigNumber;
  principalDTokenBalance: BigNumber;
  averageRealAssetBorrowRate: BigNumber;
  userLastUpdateTimestamp: BigNumber;
}

export default UserData;
