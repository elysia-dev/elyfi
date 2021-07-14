import { ethers, waffle } from 'hardhat';
import ElyfiContracts from '../../types/ElyfiContracts';
import { BigNumber, utils } from 'ethers';
import { makeAllContracts } from '../../utils/makeContract';
import { RAY } from '../../utils/constants';
import { getIncentivePoolData, getUserIncentiveData } from '../../utils/Helpers';
import { expectIncentiveDataAfterWithdraw } from '../../utils/Expect';
import { getTimestamp } from '../../utils/time';
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
    elyfiContracts = await makeAllContracts();
    await elyfiContracts.underlyingAsset
      .connect(deployer)
      .transfer(depositor.address, utils.parseEther('1000'));
    await elyfiContracts.underlyingAsset
      .connect(deployer)
      .transfer(otherDepositor.address, utils.parseEther('1000'));
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
  context('withdraw', async () => {
    it('updates index and timestamp after withdraw', async () => {
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
        .withdraw(elyfiContracts.underlyingAsset.address, depositor.address, amount);

      const [expectedIncentivePoolData, expectedUserIncentiveData]: [
        IncentivePoolData,
        UserIncentiveData
      ] = expectIncentiveDataAfterWithdraw(
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
  context('claimReward', async () => {
    it('update userLastUpdateTimestamp and accured reward after claim reward', async () => { });
  });
});
