import { ethers } from 'hardhat';
import BigNumber from 'bignumber.js';
import { InformationDigit, InformationPositions } from './types';

const informationDigits: InformationDigit = {
  nonce: 10,
  countryCode: 8,
  collateralServiceProviderIdentificationNumber: 50,
  collateralLatitude: 28,
  collateralLatitudeSign: 1,
  collateralLongitude: 28,
  collateralLongitudeSign: 1,
  collateralDetail: 40,
  collateralCategory: 10,
  productNumber: 10,
};

const assetBondPosition = (informationDigits: InformationDigit, wholeNumber: string) => {
  const positions = <InformationPositions>{};
  let position: number = 0;
  (Object.keys(informationDigits) as (keyof InformationDigit)[]).forEach((key) => {
    const start = position;
    const end = position + informationDigits[key] - 1;

    const right: string = '1'.repeat(start);
    const middle: string = '0'.repeat(end - start + 1);
    const left: string = '1'.repeat(wholeNumber.length - end - 1);

    position += informationDigits[key];

    const concatedString = left.concat(middle).concat(right);
    positions[key] = bigBinaryStringToHexString(concatedString);
  });

  return positions;
};

const bigBinaryStringToHexString = (bigBinaryString: string) => {
  const bigNumberFromJS = new BigNumber(bigBinaryString, 2).toFixed();
  const bigNumberInHex = ethers.BigNumber.from(bigNumberFromJS).toHexString();
  return bigNumberInHex.toLocaleUpperCase();
};

const totalDigits = (informationDigits: InformationDigit) => {
  let result: number = -1;
  (Object.keys(informationDigits) as (keyof InformationDigit)[]).forEach((key) => {
    result += informationDigits[key];
  });
  return result;
};
