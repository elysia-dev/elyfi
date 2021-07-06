import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';
import { AssetBondIdDataDigits, AssetBondIdMask, wholeNumber } from './types';

export const tokenIdMaskPosition = (assetBondIdDataDigits: AssetBondIdDataDigits) => {
  const positions = <AssetBondIdMask>{};
  let position: number = 0;
  (Object.keys(assetBondIdDataDigits) as (keyof AssetBondIdDataDigits)[]).forEach((key) => {
    const start = position;
    const end = position + assetBondIdDataDigits[key] - 1;

    const right: string = '1'.repeat(start);
    const middle: string = '0'.repeat(end - start + 1);
    const left: string = '1'.repeat(wholeNumber.length - end - 1);

    console.log(key, position);
    position += assetBondIdDataDigits[key];

    const concatedString = left.concat(middle).concat(right);
    positions[key] = bigBinaryStringToHexString(concatedString);
  });

  return positions;
};

export const bigBinaryStringToHexString = (bigBinaryString: string) => {
  const bigNumberFromJS = new BigNumber(bigBinaryString, 2).toFixed();
  const bigNumberInHex = ethers.BigNumber.from(bigNumberFromJS).toHexString();
  return bigNumberInHex.toLocaleUpperCase();
};

export const bigDecimalStringToBinaryString = (bigDecimalString: string) => {
  return new BigNumber(bigDecimalString, 10).toString(2);
};
