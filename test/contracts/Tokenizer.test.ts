import { BigNumber, utils } from 'ethers';
import { ethers, waffle } from 'hardhat';
import { makeAllContracts } from '../utils/makeContract';
import { expect } from 'chai';
import ElyfiContracts from '../types/ElyfiContracts';

describe('Tokenizer', () => {
  let elyfiContracts: ElyfiContracts;

  const provider = waffle.provider;
  const [deployer, investor, CSP, borrower, council, account] = provider.getWallets();
  const abTokenId = '1001002003004005';

  before(async () => {
    elyfiContracts = await makeAllContracts(deployer);

    await elyfiContracts.underlyingAsset
      .connect(deployer)
      .transfer(investor.address, utils.parseEther('1000'));
  });

  context('Mint asset bond', async () => {
    before(async () => {
      await elyfiContracts.connector.connect(deployer).addCSP(CSP.address);
    });
    context('when an account does not have an appropriate role', async () => {
      it('reverts when the general account called', async () => {
        await expect(
          elyfiContracts.tokenizer.connect(account).mintAssetBond(CSP.address, abTokenId)
        ).to.be.reverted;
        expect(await elyfiContracts.tokenizer.getMinter(abTokenId)).to.be.equal(CSP.address);
      });
    });

    context('when an account has collateral service provider role', async () => {
      it('reverts when token id already exists', async () => {
        await elyfiContracts.tokenizer.connect(CSP).mintAssetBond(CSP.address, abTokenId);
        await expect(elyfiContracts.tokenizer.connect(CSP).mintAssetBond(CSP.address, abTokenId)).to
          .be.reverted;
      });
      it('reverts when the token receiver is not collateral service provider', async () => {
        await elyfiContracts.tokenizer.connect(CSP).mintAssetBond(account.address, abTokenId);
        expect(await elyfiContracts.tokenizer.getMinter(abTokenId)).to.be.equal(CSP.address);
      });
      context('when the token id is invalid', async () => {});

      context('when the token id is vaild', async () => {});
    });
    it('Settles asset bond informations', async () => {});
  });
  context('Settle asset bond', async () => {
    it('Only token owner can ', async () => {
      await elyfiContracts.tokenizer.connect(CSP).mintAssetBond(CSP.address, abTokenId);
      expect(await elyfiContracts.tokenizer.getMinter(abTokenId)).to.be.equal(CSP.address);
    });

    it('Settles asset bond informations', async () => {});
  });
});
