import { Information, InformationDigit, wholeNumber } from './types';

export const tokenIdGenerator = (informationDigits: InformationDigit, information: Information) => {
  const bufferLength = totalDigits(informationDigits);
  let position: number = 0;
  let buffer = '1'.repeat(wholeNumber.length - bufferLength);

  (Object.keys(informationDigits).reverse() as (keyof InformationDigit)[]).forEach((key, i) => {
    buffer = buffer + getInformationFullBinary(informationDigits[key], information[key]);
    position += informationDigits[key];
  });
  return buffer;
};

const getInformationFullBinary = (digit: number, info: number) => {
  const binaryFullLength = digit;
  const binary = info.toString(2);
  const binaryLength = binary.length;
  const result = '0'.repeat(binaryFullLength - binaryLength).concat(binary);
  return result;
};

const totalDigits = (informationDigits: InformationDigit) => {
  let result: number = 0;
  (Object.keys(informationDigits) as (keyof InformationDigit)[]).forEach((key) => {
    result += informationDigits[key];
  });
  return result;
};
