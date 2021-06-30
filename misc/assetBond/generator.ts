import { AssetBondIdData, AssetBondIdDataDigits, wholeNumber } from './types';
import assetBondIdDataDigits from './assetBondIdDataDigits.json';
import { bigBinaryStringToHexString } from './position';

export const tokenIdGenerator = (assetBondIdData: AssetBondIdData) => {
  const bufferLength = totalDigits(assetBondIdDataDigits);
  let position: number = 0;
  let buffer = '0'.repeat(wholeNumber.length - bufferLength);

  (Object.keys(assetBondIdDataDigits).reverse() as (keyof AssetBondIdDataDigits)[]).forEach(
    (key) => {
      if (assetBondIdData[key] > 2 ** assetBondIdDataDigits[key]) {
        return 0;
      }
      buffer = buffer + getInformationFullBinary(assetBondIdDataDigits[key], assetBondIdData[key]);
      position += assetBondIdDataDigits[key];
    }
  );
  return bigBinaryStringToHexString(buffer);
};

const getInformationFullBinary = (digit: number, info: number) => {
  const binaryFullLength = digit;
  const binary = info.toString(2);
  const binaryLength = binary.length;
  const result = '0'.repeat(binaryFullLength - binaryLength).concat(binary);
  return result;
};

const totalDigits = (assetBondIdDataDigits: AssetBondIdDataDigits) => {
  let result: number = 0;
  (Object.keys(assetBondIdDataDigits) as (keyof AssetBondIdDataDigits)[]).forEach((key) => {
    result += assetBondIdDataDigits[key];
  });
  return result;
};
