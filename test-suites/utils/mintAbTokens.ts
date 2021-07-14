import { MockProvider } from '@ethereum-waffle/provider';
import UserType from '../enums/UserType';
import AbToken from '../types/AbToken';
import { testAssetBond } from '../../test/utils/testData';
import { settleAssetBond } from '../../test/utils/Helpers';
import generateTokenId from './generateTokenId';
import AssetBondSettleData from '../../test/types/AssetBondSettleData';
import ElyfiContracts from '../../test/types/ElyfiContracts';
import { advanceTimeTo, getTimestamp, toTimestamp } from '../../test/utils/time';
import { constants, utils } from 'ethers';

const mintAbTokens = async (
  provider: MockProvider,
  elyfiContracts: ElyfiContracts,
  abTokens: AbToken[]
): Promise<AssetBondSettleData[]> => {
  const wallets = provider.getWallets();
  const deployer = wallets[UserType.Deployer];
  const CSP = wallets[UserType.CSP];

  if (abTokens.length === 0) return [];

  await elyfiContracts.connector.connect(deployer).addCollateralServiceProvider(CSP.address);
  const tx = await elyfiContracts.connector.connect(deployer).addCouncil(CSP.address)

  const minted = await Promise.all(
    abTokens.map(async (abToken, index) => {
      const assetBondData = { ...testAssetBond };
      assetBondData.tokenId = generateTokenId(index + 1);

      assetBondData.borrower = wallets[UserType[abToken.borrower]].address;
      assetBondData.signer = CSP.address;
      assetBondData.principal = utils.parseEther(abToken.principal.toString());

      await elyfiContracts.underlyingAsset.connect(wallets[UserType[abToken.borrower]])
        .approve(elyfiContracts.moneyPool.address, constants.MaxUint256);

      await elyfiContracts.tokenizer
        .connect(CSP)
        .mintAssetBond(CSP.address, assetBondData.tokenId);

      await elyfiContracts.tokenizer
        .connect(CSP)
        .approve(elyfiContracts.moneyPool.address, assetBondData.tokenId);

      await settleAssetBond({
        tokenizer: elyfiContracts.tokenizer,
        txSender: CSP,
        settleArguments: assetBondData,
      });

      const signTx = await elyfiContracts.tokenizer
        .connect(CSP)
        .signAssetBond(assetBondData.tokenId, 'signingResult')

      await signTx.wait();

      return assetBondData
    })
  )

  const loanStartTimestamp = toTimestamp(
    testAssetBond.loanStartTimeYear,
    testAssetBond.loanStartTimeMonth,
    testAssetBond.loanStartTimeDay
  );

  await advanceTimeTo(await getTimestamp(tx), loanStartTimestamp);

  return minted;
}

export default mintAbTokens;
