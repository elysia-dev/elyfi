import { Information, InformationDigit, wholeNumber } from './types';
import informationDigits from './informationDigit.json';

export const tokenIdParser = (tokenId: string) => {
  const result = <Information>{};
  let end = wholeNumber.length;
  (Object.keys(informationDigits) as (keyof InformationDigit)[]).forEach((key, i) => {
    let start = end - informationDigits[key] + 1;
    start = start != end ? start : start - 1;
    result[key] = parseInt(tokenId.slice(start, end), 2);
    end -= informationDigits[key];
  });

  return result;
};
