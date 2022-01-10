import hre from 'hardhat';

import { ethers, waffle } from 'hardhat';
import ElyfiContracts from '../../types/ElyfiContracts';
import { BigNumber, utils } from 'ethers';
import { setupAllContracts } from '../../utils/setup';
import { RAY } from '../../utils/constants';
import { getIncentivePoolData, getUserIncentiveData } from '../../utils/Helpers';
import { expectIncentiveDataAfterDeposit } from '../../utils/Expect';
import { advanceTimeTo, getTimestamp } from '../../utils/time';
import IncentivePoolData from '../../types/IncentivePoolData';
import UserIncentiveData from '../../types/UserIncentiveData';
import { expect } from 'chai';
import { IncentivePool, IncentivePool__factory } from '../../../typechain';
import { testIncentiveAmountPerSecond } from '../../utils/testData';
import { calculateIncentiveIndex, calculateUserIncentive } from '../../utils/calculations';
require('../../assertions/equals.ts');

describe('', () => {
  let elyfiContracts: ElyfiContracts;
  let newIncentivePool: IncentivePool;

  const provider = waffle.provider;
  const [deployer, account0, account1] = provider.getWallets();

  const amount = ethers.utils.parseEther('1');

  beforeEach('', async () => {
    elyfiContracts = await setupAllContracts();

    const incentivePoolFactory = (await ethers.getContractFactory(
      'IncentivePool'
    )) as IncentivePool__factory;

    newIncentivePool = await incentivePoolFactory.deploy(
      deployer.address,
      elyfiContracts.incentiveAsset.address,
      testIncentiveAmountPerSecond
    );

    await elyfiContracts.incentiveAsset
      .connect(deployer)
      .transfer(elyfiContracts.incentivePool.address, utils.parseEther('1000'));
    await elyfiContracts.underlyingAsset.connect(deployer).faucet();
    await elyfiContracts.underlyingAsset
      .connect(deployer)
      .approve(elyfiContracts.moneyPool.address, RAY);
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
        incentivePool: newIncentivePool,
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
        incentivePool: newIncentivePool,
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

    it('reverts if general account0 update incentive amount per second', async () => {
      const newIncentiveAmountPerSecond = testIncentiveAmountPerSecond.mul(2);

      await expect(
        elyfiContracts.incentivePool
          .connect(account0)
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

    it('reverts if general account0 update endTimestamp', async () => {
      const newEndTimestamp = (await elyfiContracts.incentivePool.endTimestamp()).add(1);

      await expect(
        elyfiContracts.incentivePool.connect(account0).setEndTimestamp(newEndTimestamp)
      ).to.be.revertedWith('onlyAdmin');
    });
  });

  context('update incentivePool', async () => {
    let newIncentivePool: IncentivePool;
    let newIncentivePoolInitTimestamp: BigNumber;

    beforeEach('', async () => {
      const incentivePoolFactory = (await ethers.getContractFactory(
        'IncentivePool'
      )) as IncentivePool__factory;

      newIncentivePool = await incentivePoolFactory.deploy(
        deployer.address,
        elyfiContracts.incentiveAsset.address,
        testIncentiveAmountPerSecond
      );

      await elyfiContracts.underlyingAsset
        .connect(deployer)
        .transfer(account0.address, utils.parseEther('1000'));
      await elyfiContracts.underlyingAsset
        .connect(deployer)
        .transfer(account1.address, utils.parseEther('1000'));
      await elyfiContracts.incentiveAsset
        .connect(deployer)
        .transfer(elyfiContracts.incentivePool.address, RAY);

      await elyfiContracts.underlyingAsset
        .connect(account0)
        .approve(elyfiContracts.moneyPool.address, RAY);
      await elyfiContracts.underlyingAsset
        .connect(account1)
        .approve(elyfiContracts.moneyPool.address, RAY);

      await elyfiContracts.moneyPool
        .connect(account1)
        .deposit(elyfiContracts.underlyingAsset.address, account1.address, amount);

      await elyfiContracts.moneyPool
        .connect(account0)
        .deposit(elyfiContracts.underlyingAsset.address, account0.address, amount);

      await elyfiContracts.moneyPool
        .connect(deployer)
        .updateIncentivePool(elyfiContracts.underlyingAsset.address, newIncentivePool.address);
      const tx = await newIncentivePool
        .connect(deployer)
        .initializeIncentivePool(elyfiContracts.lToken.address);

      newIncentivePoolInitTimestamp = await getTimestamp(tx);
    });

    it('set property successfully', async () => {
      expect(await newIncentivePool.lToken()).to.be.equal(elyfiContracts.lToken.address);
    });

    it('user can accure incentive after update and it should be same as existing pool', async () => {
      const userIncentiveDataFromOldPool = await getUserIncentiveData({
        incentivePool: elyfiContracts.incentivePool,
        lToken: elyfiContracts.lToken,
        incentiveAsset: elyfiContracts.incentiveAsset,
        user: account0,
      });
      const incentivePoolDataFromOldPool = await getIncentivePoolData({
        incentivePool: elyfiContracts.incentivePool,
        lToken: elyfiContracts.lToken,
        incentiveAsset: elyfiContracts.incentiveAsset,
      });

      await advanceTimeTo(newIncentivePoolInitTimestamp, newIncentivePoolInitTimestamp.add(100));

      // Since transactions cannot be executed in the same timestamp,
      // timestamp arg for calculateUserIncentive in old pool should be subtracted 2 second
      // due to the `updateIncentivePool` and `initializeIncentivePool` in `beforeEach`
      const expectedIncentiveInNewPool = calculateUserIncentive(
        incentivePoolDataFromOldPool,
        userIncentiveDataFromOldPool,
        newIncentivePoolInitTimestamp.add(98)
      );

      const rewardInNewPool = await newIncentivePool.getUserIncentive(account0.address);

      expect(expectedIncentiveInNewPool).to.be.equal(rewardInNewPool);
    });

    it('deposit after update incentive pool, and incentive data should be same as expected', async () => {
      const userIncentiveDataBefore = await getUserIncentiveData({
        incentivePool: newIncentivePool,
        lToken: elyfiContracts.lToken,
        incentiveAsset: elyfiContracts.incentiveAsset,
        user: account0,
      });
      const incentivePoolDataBefore = await getIncentivePoolData({
        incentivePool: newIncentivePool,
        lToken: elyfiContracts.lToken,
        incentiveAsset: elyfiContracts.incentiveAsset,
      });
      const tx = await elyfiContracts.moneyPool
        .connect(account0)
        .deposit(elyfiContracts.underlyingAsset.address, account0.address, amount);

      const [expectedIncentivePoolData, expectedUserIncentiveData]: [
        IncentivePoolData,
        UserIncentiveData
      ] = expectIncentiveDataAfterDeposit(
        incentivePoolDataBefore,
        userIncentiveDataBefore,
        await getTimestamp(tx),
        amount
      );

      const userIncentiveDataAfter = await getUserIncentiveData({
        incentivePool: newIncentivePool,
        lToken: elyfiContracts.lToken,
        incentiveAsset: elyfiContracts.incentiveAsset,
        user: account0,
      });
      const incentivePoolDataAfter = await getIncentivePoolData({
        incentivePool: newIncentivePool,
        lToken: elyfiContracts.lToken,
        incentiveAsset: elyfiContracts.incentiveAsset,
      });

      expect(expectedIncentivePoolData).to.be.deepEqualWithBigNumber(incentivePoolDataAfter);
      expect(expectedUserIncentiveData).to.be.deepEqualWithBigNumber(userIncentiveDataAfter);
    });
  });
});
