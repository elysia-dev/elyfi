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
require('../../assertions/equals.ts');

describe('', () => {
  let elyfiContracts: ElyfiContracts;

  const provider = waffle.provider;
  const [deployer, depositor, otherDepositor] = provider.getWallets();

  const amount = ethers.utils.parseEther('1');

  beforeEach('', async () => {
    elyfiContracts = await setupAllContracts();
    await elyfiContracts.underlyingAsset
      .connect(deployer)
      .transfer(depositor.address, utils.parseEther('1000'));
    await elyfiContracts.underlyingAsset
      .connect(deployer)
      .transfer(otherDepositor.address, utils.parseEther('1000'));
    await elyfiContracts.incentiveAsset
      .connect(deployer)
      .transfer(elyfiContracts.incentivePool.address, utils.parseEther('1000'));
    await elyfiContracts.underlyingAsset
      .connect(depositor)
      .approve(elyfiContracts.moneyPool.address, RAY);
    await elyfiContracts.underlyingAsset
      .connect(otherDepositor)
      .approve(elyfiContracts.moneyPool.address, RAY);
    await elyfiContracts.moneyPool
      .connect(depositor)
      .deposit(elyfiContracts.underlyingAsset.address, depositor.address, amount);
  });
  context('claimReward', async () => {
    it('reverts if user accrued incentive is 0', async () => {
      await expect(
        elyfiContracts.incentivePool.connect(otherDepositor).claimIncentive()
      ).to.be.revertedWith('NotEnoughUserAccruedIncentive');
    });

    it('update userLastUpdateTimestamp and accured reward after claim reward', async () => {
      const userIncentiveDataBefore = await getUserIncentiveData({
        incentivePool: elyfiContracts.incentivePool,
        lToken: elyfiContracts.lToken,
        incentiveAsset: elyfiContracts.incentiveAsset,
        user: depositor,
      });
      const incentivePoolDataBefore = await getIncentivePoolData({
        incentivePool: elyfiContracts.incentivePool,
        lToken: elyfiContracts.lToken,
        incentiveAsset: elyfiContracts.incentiveAsset,
      });
      const tx = await elyfiContracts.incentivePool.connect(depositor).claimIncentive();

      const [expectedIncentivePoolData, expectedUserIncentiveData]: [
        IncentivePoolData,
        UserIncentiveData
      ] = expectIncentiveDataAfterClaim(
        incentivePoolDataBefore,
        userIncentiveDataBefore,
        await getTimestamp(tx)
      );

      const userIncentiveDataAfter = await getUserIncentiveData({
        incentivePool: elyfiContracts.incentivePool,
        lToken: elyfiContracts.lToken,
        incentiveAsset: elyfiContracts.incentiveAsset,
        user: depositor,
      });
      const incentivePoolDataAfter = await getIncentivePoolData({
        incentivePool: elyfiContracts.incentivePool,
        lToken: elyfiContracts.lToken,
        incentiveAsset: elyfiContracts.incentiveAsset,
      });

      expect(expectedIncentivePoolData).to.be.deepEqualWithBigNumber(incentivePoolDataAfter);
      expect(expectedUserIncentiveData).to.be.deepEqualWithBigNumber(userIncentiveDataAfter);
    });
  });
  context('end timestamp', async () => {
    let snapshotId: string;
    beforeEach('deposit and time passes', async () => {
      const tx = await elyfiContracts.moneyPool
        .connect(depositor)
        .deposit(elyfiContracts.underlyingAsset.address, depositor.address, amount);
      const endTimestamp = await elyfiContracts.incentivePool.endTimestamp();
      await advanceTimeTo(await getTimestamp(tx), endTimestamp.add(1));
    });

    beforeEach('take EVM snapshot', async () => {
      snapshotId = await saveEVMSnapshot();
    });

    afterEach('revert from EVM snapshot', async () => {
      await revertFromEVMSnapshot(snapshotId);
    });

    it('reverts if another claimIncentive after endTimestamp', async () => {
      const userIncentiveDataBefore = await getUserIncentiveData({
        incentivePool: elyfiContracts.incentivePool,
        lToken: elyfiContracts.lToken,
        incentiveAsset: elyfiContracts.incentiveAsset,
        user: depositor,
      });
      const incentivePoolDataBefore = await getIncentivePoolData({
        incentivePool: elyfiContracts.incentivePool,
        lToken: elyfiContracts.lToken,
        incentiveAsset: elyfiContracts.incentiveAsset,
      });
      const tx = await elyfiContracts.moneyPool
        .connect(depositor)
        .deposit(elyfiContracts.underlyingAsset.address, depositor.address, amount);

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
        incentivePool: elyfiContracts.incentivePool,
        lToken: elyfiContracts.lToken,
        incentiveAsset: elyfiContracts.incentiveAsset,
        user: depositor,
      });
      const incentivePoolDataAfter = await getIncentivePoolData({
        incentivePool: elyfiContracts.incentivePool,
        lToken: elyfiContracts.lToken,
        incentiveAsset: elyfiContracts.incentiveAsset,
      });

      expect(expectedIncentivePoolData).to.be.deepEqualWithBigNumber(incentivePoolDataAfter);
      expect(expectedUserIncentiveData).to.be.deepEqualWithBigNumber(userIncentiveDataAfter);
    });
  });
});
