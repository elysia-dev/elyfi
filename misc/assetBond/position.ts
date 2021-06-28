import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';
import { InformationDigit, InformationPositions, wholeNumber } from './types';
import informationDigits from './informationDigit.json';

export const tokenIdMaskPosition = () => {
  const positions = <InformationPositions>{};
  let position: number = 0;
  (Object.keys(informationDigits) as (keyof InformationDigit)[]).forEach((key) => {
    const start = position;
    const end = position + informationDigits[key] - 1;

    const right: string = '1'.repeat(start);
    const middle: string = '0'.repeat(end - start + 1);
    const left: string = '1'.repeat(wholeNumber.length - end - 1);

    console.log(key, position);
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
