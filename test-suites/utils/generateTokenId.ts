import { BigNumber } from "ethers";
import { tokenIdGenerator } from "../../misc/assetBond/generator";
import assetBondIdData from '../../misc/assetBond/assetBondIdDataExample.json';

const generateTokenId = (nonce: number): BigNumber => {
  const data = { ...assetBondIdData }
  data.nonce = nonce;

  return BigNumber.from(tokenIdGenerator(data))
}

export default generateTokenId;