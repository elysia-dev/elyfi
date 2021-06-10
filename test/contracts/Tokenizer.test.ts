import { BigNumber, utils } from 'ethers';
import { ethers, waffle } from 'hardhat';
import { makeAllContracts } from '../utils/makeContract';
import { expect } from 'chai';
import ElyfiContracts from '../types/ElyfiContracts';

describe('Tokenizer', () => {
  let elyfiContracts: ElyfiContracts;

  const provider = waffle.provider;
  const [deployer, investor, CSP, borrower] = provider.getWallets();
  const abTokenId = '1001002003004005';

  before(async () => {
    elyfiContracts = await makeAllContracts(deployer);

    await elyfiContracts.underlyingAsset
      .connect(deployer)
      .transfer(investor.address, utils.parseEther('1000'));
  });

  describe('Mint ABToken', async () => {
    it('Mints ABToken and set token states', async () => {
      await elyfiContracts.tokenizer.connect(CSP).mintAssetBond(CSP.address, abTokenId);
      expect(await elyfiContracts.tokenizer.getMinter(abTokenId)).to.be.equal(CSP.address);
    });

    it('Reverts if mint already exist id', async () => {
      await elyfiContracts.tokenizer.connect(CSP).mintAssetBond(CSP.address, abTokenId);
      await expect(elyfiContracts.tokenizer.connect(CSP).mintAssetBond(CSP.address, abTokenId)).to
        .be.reverted;
    });

    it('Settles ABToken informations', async () => {});
  });
});
