import { BigNumber, constants, ethers } from 'ethers';
import { toRate } from './wadRayMath';
import { RAY, SECONDSPERDAY, WAD } from './constants';
import InterestModelParams from '../types/InterestRateModelParams';
import ReserveData from '../types/ReserveData';
import AssetBondSettleData from '../types/AssetBondSettleData';
import assetBondIdData from '../../misc/assetBond/assetBondIdDataExample.json';
import { tokenIdGenerator } from '../../misc/assetBond/generator';

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

export const testAssetBond: AssetBondSettleData = <AssetBondSettleData>{
  ...(<AssetBondSettleData>{}),
  borrower: '',
  signer: '',
  tokenId: BigNumber.from(tokenIdGenerator(assetBondIdData)),
  principal: ethers.utils.parseEther('10'),
  debtCeiling: ethers.utils.parseEther('13'),
  couponRate: toRate(0.1),
  delinquencyRate: toRate(0.03),
  loanDuration: BigNumber.from(365),
  loanStartTimeYear: BigNumber.from(2030),
  loanStartTimeMonth: BigNumber.from(0),
  loanStartTimeDay: BigNumber.from(1),
  ipfsHash: 'test',
};

export const testIncentiveAmountPerSecond = BigNumber.from(WAD)
  .mul(3000000)
  .div(180)
  .div(SECONDSPERDAY);
