import { BigNumber } from 'ethers';
import AssetBondState from './AssetBondState';

interface AssetBondData {
  state: AssetBondState;
  tokenId: BigNumber;
  minter: string;
  tokenOwner: string;
  borrower: string;
  signer: string;
  collateralServiceProvider: string;
  principal: BigNumber;
  debtCeiling: BigNumber;
  couponRate: BigNumber;
  interestRate: BigNumber;
  delinquencyRate: BigNumber;
  loanStartTimestamp: BigNumber;
  collateralizeTimestamp: BigNumber;
  maturityTimestamp: BigNumber;
  liquidationTimestamp: BigNumber;
  accruedDebtOnMoneyPool: BigNumber;
  feeOnCollateralServiceProvider: BigNumber;
  ipfsHash: string;
  signerOpinionHash: string;
}

export default AssetBondData;
