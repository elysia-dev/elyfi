import { AssetBondIdData, AssetBondIdDataDigits, wholeNumber } from './types';
import assetBondIdDataDigits from './assetBondIdDataDigits.json';

export const tokenIdParser = (tokenId: string) => {
  const parsedTokenId = <AssetBondIdData>{};
  let end = wholeNumber.length;
  (Object.keys(assetBondIdDataDigits) as (keyof AssetBondIdDataDigits)[]).forEach((key) => {
    let start = end - assetBondIdDataDigits[key] + 1;
    start = start != end ? start : start - 1;
    parsedTokenId[key] = parseInt(tokenId.slice(start, end), 2);
    end -= assetBondIdDataDigits[key];
  });

  return parsedTokenId;
};
