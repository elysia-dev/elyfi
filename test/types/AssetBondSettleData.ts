import { BigNumber } from 'ethers';
import AssetBondData from './AssetBondData';

interface AssetBondSettleData extends AssetBondData {
  loanDuration: BigNumber;
  loanStartTimeYear: BigNumber;
  loanStartTimeMonth: BigNumber;
  loanStartTimeDay: BigNumber;
}

export default AssetBondSettleData;
