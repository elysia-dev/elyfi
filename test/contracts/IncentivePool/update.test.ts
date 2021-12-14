import { ethers, waffle } from 'hardhat';
import ElyfiContracts from '../../types/ElyfiContracts';
import { BigNumber, utils } from 'ethers';
import { setupAllContracts } from '../../utils/setup';
import { RAY } from '../../utils/constants';
import { getIncentivePoolData, getUserIncentiveData } from '../../utils/Helpers';
import { expectIncentiveDataAfterClaim, expectIncentiveDataAfterDeposit } from '../../utils/Expect';
import {
  advanceTimeTo,
  getTimestamp,
  revertFromEVMSnapshot,
  saveEVMSnapshot,
} from '../../utils/time';
import IncentivePoolData from '../../types/IncentivePoolData';
import UserIncentiveData from '../../types/UserIncentiveData';
import { expect } from 'chai';
import { testIncentiveAmountPerSecond } from '../../utils/testData';
import { calculateIncentiveIndex } from '../../utils/calculations';
require('../../assertions/equals.ts');

describe('admin', () => {
  let elyfiContracts: ElyfiContracts;

  let snapshotId: string;

  const provider = waffle.provider;
  const [deployer, account] = provider.getWallets();

  const amount = ethers.utils.parseEther('1');

  beforeEach('setup', async () => {
    elyfiContracts = await setupAllContracts();
    await elyfiContracts.incentiveAsset
      .connect(deployer)
      .transfer(elyfiContracts.incentivePool.address, utils.parseEther('1000'));
    await elyfiContracts.underlyingAsset.connect(deployer).faucet();
    await elyfiContracts.underlyingAsset
      .connect(deployer)
      .approve(elyfiContracts.moneyPool.address, RAY);
  });

  beforeEach('take EVM snapshot', async () => {
    snapshotId = await saveEVMSnapshot();
  });

  afterEach('revert from EVM snapshot', async () => {
    await revertFromEVMSnapshot(snapshotId);
  });

  context('admin functions', async () => {
    beforeEach('deposit and time passes', async () => {
      await elyfiContracts.moneyPool
        .connect(deployer)
        .deposit(elyfiContracts.underlyingAsset.address, deployer.address, amount);
      await elyfiContracts.moneyPool
        .connect(deployer)
        .deposit(elyfiContracts.underlyingAsset.address, deployer.address, amount);
    });

    it('admin can update reward amount per second, and index should be updated ', async () => {
      const newIncentiveAmountPerSecond = testIncentiveAmountPerSecond.mul(2);

      const incentivePoolDataBefore = await getIncentivePoolData({
        incentivePool: elyfiContracts.incentivePool,
        lToken: elyfiContracts.lToken,
        incentiveAsset: elyfiContracts.incentiveAsset,
      });

      const tx = await elyfiContracts.incentivePool
        .connect(deployer)
        .setAmountPerSecond(newIncentiveAmountPerSecond);

      const expectedIncentiveIndexAfterUpdate = calculateIncentiveIndex(
        incentivePoolDataBefore,
        await getTimestamp(tx)
      );

      const incentivePoolDataAfter = await getIncentivePoolData({
        incentivePool: elyfiContracts.incentivePool,
        lToken: elyfiContracts.lToken,
        incentiveAsset: elyfiContracts.incentiveAsset,
      });

      expect(tx)
        .to.be.emit(elyfiContracts.incentivePool, 'RewardPerSecondUpdated')
        .withArgs(newIncentiveAmountPerSecond);
      expect(expectedIncentiveIndexAfterUpdate).to.be.equal(incentivePoolDataAfter.incentiveIndex);
      expect(await elyfiContracts.incentivePool.amountPerSecond()).to.be.equal(
        newIncentiveAmountPerSecond
      );
    });

    it('reverts if general account update incentive amount per second', async () => {
      const newIncentiveAmountPerSecond = testIncentiveAmountPerSecond.mul(2);

      await expect(
        elyfiContracts.incentivePool
          .connect(account)
          .setAmountPerSecond(newIncentiveAmountPerSecond)
      ).to.be.revertedWith('onlyAdmin');
    });

    it('admin can update endTimestamp', async () => {
      const newEndTimestamp = (await elyfiContracts.incentivePool.endTimestamp()).add(1);

      const tx = await elyfiContracts.incentivePool
        .connect(deployer)
        .setEndTimestamp(newEndTimestamp);

      expect(tx)
        .to.be.emit(elyfiContracts.incentivePool, 'IncentiveEndTimestampUpdated')
        .withArgs(newEndTimestamp);
      expect(await elyfiContracts.incentivePool.endTimestamp()).to.be.equal(newEndTimestamp);
    });

    it('reverts if general account update endTimestamp', async () => {
      const newEndTimestamp = (await elyfiContracts.incentivePool.endTimestamp()).add(1);

      await expect(
        elyfiContracts.incentivePool.connect(account).setEndTimestamp(newEndTimestamp)
      ).to.be.revertedWith('onlyAdmin');
    });
  });
});
