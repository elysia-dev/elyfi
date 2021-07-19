import { MockProvider } from '@ethereum-waffle/provider';
import UserType from '../enums/UserType';
import AbToken from '../types/AbToken';
import { testAssetBond } from '../../test/utils/testData';
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
  const tx = await elyfiContracts.connector.connect(deployer).addCouncil(CSP.address);

  let cspNonce = await provider.getTransactionCount(CSP.address);

  await Promise.all(
    abTokens.map(async (_abToken, index) => {
      const { data: mintData } = await elyfiContracts.tokenizer.populateTransaction.mintAssetBond(
        CSP.address,
        generateTokenId(index + 1)
      );

      const tx = await CSP.sendTransaction({
        to: elyfiContracts.tokenizer.address,
        data: mintData,
        nonce: cspNonce + index,
      });

      await tx.wait();
    })
  );

  cspNonce = cspNonce + abTokens.length;

  const minted = await Promise.all(
    abTokens.map(async (abToken, index) => {
      const assetBondData = { ...testAssetBond };
      assetBondData.tokenId = generateTokenId(index + 1);

      assetBondData.borrower = wallets[UserType[abToken.borrower]].address;
      assetBondData.signer = CSP.address;
      assetBondData.principal = utils.parseEther(abToken.principal.toString());

      const { data: settleData } =
        await elyfiContracts.tokenizer.populateTransaction.settleAssetBond(
          assetBondData.borrower,
          assetBondData.signer,
          assetBondData.tokenId,
          assetBondData.principal,
          assetBondData.couponRate,
          assetBondData.delinquencyRate,
          assetBondData.debtCeiling,
          assetBondData.loanDuration,
          assetBondData.loanStartTimeYear,
          assetBondData.loanStartTimeMonth,
          assetBondData.loanStartTimeDay,
          assetBondData.ipfsHash
        );

      const tx = await CSP.sendTransaction({
        to: elyfiContracts.tokenizer.address,
        data: settleData,
        nonce: cspNonce + index,
      });

      await tx.wait();

      return assetBondData;
    })
  );

  cspNonce = cspNonce + abTokens.length;

  await Promise.all(
    abTokens.map(async (abToken, index) => {
      await elyfiContracts.underlyingAsset
        .connect(wallets[UserType[abToken.borrower]])
        .approve(elyfiContracts.moneyPool.address, constants.MaxUint256);

      const { data: approveData } = await elyfiContracts.tokenizer.populateTransaction.approve(
        elyfiContracts.moneyPool.address,
        generateTokenId(index + 1)
      );

      const { data: signData } = await elyfiContracts.tokenizer.populateTransaction.signAssetBond(
        generateTokenId(index + 1),
        'result'
      );

      await Promise.all(
        [approveData, signData].map(async (data, dataIndex) => {
          await CSP.sendTransaction({
            to: elyfiContracts.tokenizer.address,
            data,
            nonce: cspNonce + 2 * index + dataIndex,
          });
        })
      );
    })
  );

  const loanStartTimestamp = toTimestamp(
    testAssetBond.loanStartTimeYear,
    testAssetBond.loanStartTimeMonth,
    testAssetBond.loanStartTimeDay
  );

  await advanceTimeTo(await getTimestamp(tx), loanStartTimestamp);

  return minted;
};

export default mintAbTokens;
