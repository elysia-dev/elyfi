import { BigNumber, ethers } from 'ethers';
import { tokenIdGenerator } from '../../../misc/assetBond/generator';
import AssetBondSettleData from '../../../test/types/AssetBondSettleData';
import { toRate } from '../../../test/utils/wadRayMath';
import { AssetBondIdData } from '../../../misc/assetBond/types';

// Asset Blue #4
const id: AssetBondIdData = {
  nonce: 1,
  countryCode: 82,
  collateralServiceProviderIdentificationNumber: 1158801240,
  collateralLatitude: 3747785,
  collateralLatitudeSign: 1,
  collateralLongitude: 12697309,
  collateralLongitudeSign: 1,
  collateralDetail: 1,
  collateralCategory: 1,
  productNumber: 1,
};

export const data: AssetBondSettleData = {
  ...(<AssetBondSettleData>{}),
  borrower: '',
  signer: '',
  tokenId: BigNumber.from(tokenIdGenerator(id)),
  principal: ethers.utils.parseEther('500000'),
  debtCeiling: ethers.utils.parseEther('2500000000'),
  couponRate: toRate(0.1),
  delinquencyRate: toRate(0.03),
  loanDuration: BigNumber.from(365),
  loanStartTimeYear: BigNumber.from(2021),
  loanStartTimeMonth: BigNumber.from(7),
  loanStartTimeDay: BigNumber.from(7),
  ipfsHash: 'test',
};
