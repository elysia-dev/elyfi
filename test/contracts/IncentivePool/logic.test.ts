import { ethers, waffle } from 'hardhat';
import ElyfiContracts from '../../types/ElyfiContracts';
import { utils } from 'ethers';
import { setupAllContracts } from '../../utils/makeContract';
import { advanceTimeTo, getTimestamp } from '../../utils/time';
import { expect } from 'chai';
require('../../assertions/equals.ts');

describe('', () => {
  let elyfiContracts: ElyfiContracts;

  const provider = waffle.provider;
  const [deployer, depositor] = provider.getWallets();

  const amount = ethers.utils.parseEther('1');

  beforeEach('', async () => {
    elyfiContracts = await setupAllContracts();
    await elyfiContracts.underlyingAsset
      .connect(deployer)
      .transfer(depositor.address, utils.parseEther('1000'));
    await elyfiContracts.underlyingAsset
      .connect(depositor)
      .approve(elyfiContracts.moneyPool.address, utils.parseEther('1000'));
  });
  context('isClosed', async () => {
    it('returns false when block.timestamp is less than endTimestamp', async () => {
      expect(await elyfiContracts.incentivePool.isClosed()).to.be.false;
    });

    it('returns true when block.timestamp is greater than endTimestamp', async () => {
      const tx = await elyfiContracts.moneyPool
        .connect(depositor)
        .deposit(elyfiContracts.underlyingAsset.address, depositor.address, amount);
      const endTimestamp = await elyfiContracts.incentivePool.endTimestamp();
      await advanceTimeTo(await getTimestamp(tx), endTimestamp.add(1));
      expect(await elyfiContracts.incentivePool.isClosed()).to.be.true;
    });
  });
  context('After endTimestamp', async () => {
    beforeEach('', async () => {
      const tx = await elyfiContracts.moneyPool
        .connect(depositor)
        .deposit(elyfiContracts.underlyingAsset.address, depositor.address, amount);
      const endTimestamp = await elyfiContracts.incentivePool.endTimestamp();
      await advanceTimeTo(await getTimestamp(tx), endTimestamp.add(1));
      expect(await elyfiContracts.incentivePool.isClosed()).to.be.true;
    });
    it('lastUpdatetimestamp incentiveIndex should not be updated after the endTimestamp', async () => {});

    it('reverts if general account withdraw residue', async () => {
      await expect(
        elyfiContracts.incentivePool.connect(depositor).withdrawResidue()
      ).to.be.revertedWith('onlyAdmin');
    });
    it('admin can withdraw residue', async () => {
      const adminBalanceBefore = await elyfiContracts.incentiveAsset.balanceOf(depositor.address);
      const incentiveResidue = await elyfiContracts.incentiveAsset.balanceOf(
        elyfiContracts.incentivePool.address
      );
      const tx = await elyfiContracts.incentivePool.connect(deployer).withdrawResidue();
      const adminBalanceAfter = await elyfiContracts.incentiveAsset.balanceOf(depositor.address);
      const incentiveResidueAfter = await elyfiContracts.incentiveAsset.balanceOf(
        elyfiContracts.incentivePool.address
      );
      expect(adminBalanceAfter).to.be.equal(adminBalanceBefore.add(incentiveResidue));
      expect(incentiveResidueAfter).to.be.equal(0);
    });
  });
});
