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
  borrower: '0x1BcF42B1c9C1B9C1B0f0Aa071C4CF02b7C9b3598',
  signer: '0x53c14659BF777b2D7e0A7fBa4d5DfF87D594495c',
  tokenId: BigNumber.from(tokenIdGenerator(id)),
  principal: ethers.utils.parseEther('262927'),
  debtCeiling: ethers.utils.parseEther('338556'),
  couponRate: toRate(0.1),
  delinquencyRate: toRate(0.03),
  loanDuration: BigNumber.from(88),
  loanStartTimeYear: BigNumber.from(2021),
  loanStartTimeMonth: BigNumber.from(7),
  loanStartTimeDay: BigNumber.from(21),
  ipfsHash: 'test',
};
