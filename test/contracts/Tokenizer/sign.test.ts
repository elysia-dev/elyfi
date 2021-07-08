import { utils } from 'ethers';
import { waffle } from 'hardhat';
import { makeAllContracts } from '../../utils/makeContract';
import { expect } from 'chai';
import ElyfiContracts from '../../types/ElyfiContracts';
import { settleAssetBond } from '../../utils/Helpers';
import AssetBondState from '../../types/AssetBondState';
import { testAssetBondData } from '../../utils/testData';

describe('Tokenizer.sign', () => {
  let elyfiContracts: ElyfiContracts;

  const provider = waffle.provider;
  const [deployer, depositor, CSP, borrower, signer, account] = provider.getWallets();

  testAssetBondData.borrower = borrower.address;
  testAssetBondData.signer = signer.address;
  const signerOpinionHash: string = 'test hash';

  beforeEach('Governance added roles to each participant', async () => {
    elyfiContracts = await makeAllContracts();

    await elyfiContracts.underlyingAsset
      .connect(deployer)
      .transfer(depositor.address, utils.parseEther('1000'));
    await elyfiContracts.connector.connect(deployer).addCollateralServiceProvider(CSP.address);
    await elyfiContracts.connector.connect(deployer).addCouncil(signer.address);
  });

  context('Sign asset bond', async () => {
    beforeEach('Collateral Service Provider settled the asset bond properly', async () => {
      await elyfiContracts.tokenizer
        .connect(CSP)
        .mintAssetBond(CSP.address, testAssetBondData.tokenId);
    });

    it('reverts if the caller is not designated member', async () => {
      await expect(
        elyfiContracts.tokenizer
          .connect(account)
          .signAssetBond(testAssetBondData.tokenId, signerOpinionHash)
      ).to.be.revertedWith('');
    });

    context('when signer signs the asset bond but not settled', async () => {
      it('reverts if the token state is not SETTLED', async () => {
        await elyfiContracts.connector
          .connect(deployer)
          .revokeCollateralServiceProvider(CSP.address);
        await expect(
          settleAssetBond({
            tokenizer: elyfiContracts.tokenizer,
            txSender: CSP,
            settleArguments: testAssetBondData,
          })
        ).to.be.revertedWith('OnlySettledTokenSignAllowed');
      });

      context('when signer signs the settled asset bond', async () => {
        beforeEach('Collateral Service Provider settled the asset bond properly', async () => {
          await settleAssetBond({
            tokenizer: elyfiContracts.tokenizer,
            txSender: CSP,
            settleArguments: testAssetBondData,
          });
        });

        it('signs the asset bond properly', async () => {
          await elyfiContracts.tokenizer
            .connect(signer)
            .signAssetBond(testAssetBondData.tokenId, signerOpinionHash);

          const assetBondData = await elyfiContracts.tokenizer.getAssetBondData(
            testAssetBondData.tokenId
          );

          expect(assetBondData.state).to.be.equal(AssetBondState.CONFIRMED);
          expect(assetBondData.signerOpinionHash).to.be.equal(signerOpinionHash);
        });
      });
    });
  });
});
