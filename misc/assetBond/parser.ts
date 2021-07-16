import { AssetBondIdData, AssetBondIdDataDigits, wholeNumber } from './types';
import assetBondIdDataDigits from './assetBondIdDataDigits.json';
import AssetBondSettleData from '../../test/types/AssetBondSettleData';
import { BigNumber, ethers } from 'ethers';
import { toRate } from '../../test/utils/wadRayMath';
import { tokenIdGenerator } from './generator';
import { bigDecimalStringToBinaryString } from './position';

const id: AssetBondIdData = {
  nonce: 1,
  countryCode: 82,
  collateralServiceProviderIdentificationNumber: 1158801240,
  collateralLatitude: 3750179,
  collateralLatitudeSign: 1,
  collateralLongitude: 12702699,
  collateralLongitudeSign: 1,
  collateralDetail: 1,
  collateralCategory: 1,
  productNumber: 1,
};

const data: AssetBondSettleData = {
  ...(<AssetBondSettleData>{}),
  borrower: '',
  signer: '',
  tokenId: BigNumber.from(tokenIdGenerator(id)),
  principal: ethers.utils.parseEther('2000000000'),
  debtCeiling: ethers.utils.parseEther('2500000000'),
  couponRate: toRate(0.1),
  delinquencyRate: toRate(0.03),
  loanDuration: BigNumber.from(365),
  loanStartTimeYear: BigNumber.from(2021),
  loanStartTimeMonth: BigNumber.from(7),
  loanStartTimeDay: BigNumber.from(5),
  ipfsHash: 'test',
};

export const tokenIdParser = (tokenId: string) => {
  const parsedTokenId = <AssetBondIdData>{};
  const binary = bigDecimalStringToBinaryString(tokenId);
  let end = wholeNumber.length;
  (Object.keys(assetBondIdDataDigits) as (keyof AssetBondIdDataDigits)[]).forEach((key) => {
    let start = end - assetBondIdDataDigits[key] + 1;
    start = start != end ? start : start - 1;
    parsedTokenId[key] = parseInt(binary.slice(start, end), 2);
    end -= assetBondIdDataDigits[key];
  });

  return parsedTokenId;
};
