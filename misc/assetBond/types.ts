export type AssetBondIdData = {
  nonce: number;
  countryCode: number;
  collateralServiceProviderIdentificationNumber: number;
  collateralLatitude: number;
  collateralLatitudeSign: number;
  collateralLongitude: number;
  collateralLongitudeSign: number;
  collateralDetail: number;
  collateralCategory: number;
  productNumber: number;
};

export type AssetBondIdDataDigits = {
  nonce: number;
  countryCode: number;
  collateralServiceProviderIdentificationNumber: number;
  collateralLatitude: number;
  collateralLatitudeSign: number;
  collateralLongitude: number;
  collateralLongitudeSign: number;
  collateralDetail: number;
  collateralCategory: number;
  productNumber: number;
};

export type AssetBondIdMask = {
  nonce: string;
  countryCode: string;
  collateralServiceProviderIdentificationNumber: string;
  collateralLatitude: string;
  collateralLatitudeSign: string;
  collateralLongitude: string;
  collateralLongitudeSign: string;
  collateralDetail: string;
  collateralCategory: string;
  productNumber: string;
};

export const wholeNumber = '1'.repeat(256);
