import { utils } from 'ethers';
import { waffle } from 'hardhat';
import { makeAllContracts } from '../../utils/makeContract';
import { expect } from 'chai';
import ElyfiContracts from '../../types/ElyfiContracts';
import { settleAssetBond } from '../../utils/Helpers';
import AssetBondState from '../../types/AssetBondState';
import { testAssetBond } from '../../utils/testData';

describe('Tokenizer.sign', () => {
  let elyfiContracts: ElyfiContracts;

  const testAssetBondData = { ...testAssetBond };
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
    await elyfiContracts.tokenizer
      .connect(CSP)
      .mintAssetBond(CSP.address, testAssetBondData.tokenId);
  });

  it('reverts if the token state is not SETTLED', async () => {
    await expect(
      elyfiContracts.tokenizer
        .connect(signer)
        .signAssetBond(testAssetBondData.tokenId, signerOpinionHash)
    ).to.be.revertedWith('OnlySettledTokenSignAllowed');
  });

  context('Sign asset bond', async () => {
    beforeEach('Collateral Service Provider settled the asset bond properly', async () => {
      await settleAssetBond({
        tokenizer: elyfiContracts.tokenizer,
        txSender: CSP,
        settleArguments: testAssetBondData,
      });
    });

    it('reverts if the caller is not the signer', async () => {
      await elyfiContracts.connector.connect(deployer).revokeCouncil(signer.address);
      await expect(
        elyfiContracts.tokenizer
          .connect(signer)
          .signAssetBond(testAssetBondData.tokenId, signerOpinionHash)
      ).to.be.revertedWith('OnlyCouncil');
    });

    it('reverts if the caller is not designated member', async () => {
      await elyfiContracts.connector.connect(deployer).addCouncil(account.address);
      await expect(
        elyfiContracts.tokenizer
          .connect(account)
          .signAssetBond(testAssetBondData.tokenId, signerOpinionHash)
      ).to.be.revertedWith('OnlyDesignatedSignerAllowed');
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
