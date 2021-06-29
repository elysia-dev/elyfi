import { BigNumber, constants, ethers } from 'ethers';
import { toRate } from './Ethereum';
import { RAY } from './constants';
import InterestModelParams from '../types/InterestRateModelParams';
import ReserveData from '../types/ReserveData';
import AssetBondSettleData from '../types/AssetBondSettleData';

export const testReserveData: ReserveData = <ReserveData>{
  moneyPoolFactor: toRate(0.03),
  underlyingAssetName: 'ELYSIA',
  underlyingAssetSymbol: 'EL',
  lTokenInterestIndex: BigNumber.from(RAY),
  borrowAPY: constants.Zero,
  depositAPY: constants.Zero,
};

export const testInterestModelParams: InterestModelParams = <InterestModelParams>{
  optimalUtilizationRate: toRate(0.8),
  borrowRateBase: toRate(0.02),
  borrowRateOptimal: toRate(0.1),
  borrowRateMax: toRate(1),
};

export const testAssetBondData: AssetBondSettleData = <AssetBondSettleData>{
  ...(<AssetBondSettleData>{}),
  borrower: '',
  signer: '',
  tokenId: BigNumber.from('1001002003004005'),
  principal: ethers.utils.parseEther('1'),
  debtCeiling: ethers.utils.parseEther('13'),
  couponRate: toRate(0.1),
  overdueInterestRate: toRate(0.03),
  loanDuration: BigNumber.from(365),
  loanStartTimeYear: BigNumber.from(2022),
  loanStartTimeMonth: BigNumber.from(0),
  loanStartTimeDay: BigNumber.from(1),
  ipfsHash: 'test',
};
