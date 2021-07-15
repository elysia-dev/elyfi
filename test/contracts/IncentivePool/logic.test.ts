import { ethers, waffle } from 'hardhat';
import ElyfiContracts from '../../types/ElyfiContracts';
import { utils } from 'ethers';
import { makeAllContracts } from '../../utils/makeContract';
import { advanceTimeTo, getTimestamp } from '../../utils/time';
import { expect } from 'chai';
require('../../assertions/equals.ts');

describe('', () => {
  let elyfiContracts: ElyfiContracts;

  const provider = waffle.provider;
  const [deployer, depositor] = provider.getWallets();

  const amount = ethers.utils.parseEther('1');

  beforeEach('', async () => {
    elyfiContracts = await makeAllContracts();
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
});
