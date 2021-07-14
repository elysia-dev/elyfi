import { ethers, waffle } from 'hardhat';
import ElyfiContracts from '../types/ElyfiContracts';
import { BigNumber, utils } from 'ethers';
import { makeAllContracts } from '../utils/makeContract';
import { RAY } from '../utils/constants';
require('../assertions/equals.ts');

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
  });
  context('deposit', async () => {
    beforeEach('', async () => {
      await elyfiContracts.underlyingAsset
        .connect(depositor)
        .approve(elyfiContracts.moneyPool.address, RAY);
      const tx = await elyfiContracts.moneyPool
        .connect(depositor)
        .deposit(elyfiContracts.underlyingAsset.address, depositor.address, amount);
    });
    it('updates index and timestamp after deposit', async () => {});
  });
  context('withdraw', async () => {
    it('updates index and timestamp after withdraw', async () => {});
  });
  context('claimReward', async () => {
    it('update userLastUpdateTimestamp and accured reward after claim reward', async () => {});
  });
});
