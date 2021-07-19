import { BigNumber, ethers } from 'ethers';
import { tokenIdGenerator } from '../../../misc/assetBond/generator';
import AssetBondSettleData from '../../../test/types/AssetBondSettleData';
import { toRate } from '../../../test/utils/wadRayMath';
import { AssetBondIdData } from '../../../misc/assetBond/types';

// prugio
const id: AssetBondIdData = {
  nonce: 1,
  countryCode: 82,
  collateralServiceProviderIdentificationNumber: 2201110189192,
  collateralLatitude: 3750088,
  collateralLatitudeSign: 1,
  collateralLongitude: 12704064,
  collateralLongitudeSign: 1,
  collateralDetail: 2210,
  collateralCategory: 2,
  productNumber: 4,
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
  loanStartTimeDay: BigNumber.from(23),
  ipfsHash: 'test',
};
