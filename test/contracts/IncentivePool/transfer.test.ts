import { ethers, waffle } from 'hardhat';
import ElyfiContracts from '../../types/ElyfiContracts';
import { utils } from 'ethers';
import { setupAllContracts } from '../../utils/setup';
import { RAY } from '../../utils/constants';
import { getIncentivePoolData, getUserIncentiveData } from '../../utils/Helpers';
import { expectIncentiveDataAfterTransfer } from '../../utils/Expect';
import { getTimestamp } from '../../utils/time';
import IncentivePoolData from '../../types/IncentivePoolData';
import UserIncentiveData from '../../types/UserIncentiveData';
import { expect } from 'chai';
require('../../assertions/equals.ts');

describe('', () => {
  let elyfiContracts: ElyfiContracts;

  const provider = waffle.provider;
  const [deployer, sender, receiver] = provider.getWallets();

  const amount = ethers.utils.parseEther('1');

  beforeEach('', async () => {
    elyfiContracts = await setupAllContracts();
    await elyfiContracts.underlyingAsset
      .connect(deployer)
      .transfer(sender.address, utils.parseEther('1000'));
    await elyfiContracts.underlyingAsset
      .connect(deployer)
      .transfer(receiver.address, utils.parseEther('1000'));
  });
  context('transfer lToken', async () => {
    beforeEach('', async () => {
      await elyfiContracts.underlyingAsset
        .connect(sender)
        .approve(elyfiContracts.moneyPool.address, RAY);
      await elyfiContracts.underlyingAsset
        .connect(receiver)
        .approve(elyfiContracts.moneyPool.address, RAY);
      await elyfiContracts.moneyPool
        .connect(sender)
        .deposit(elyfiContracts.underlyingAsset.address, sender.address, amount);
      await elyfiContracts.moneyPool
        .connect(receiver)
        .deposit(elyfiContracts.underlyingAsset.address, receiver.address, amount);
    });
    it('updates incentiveData after transferLToken', async () => {
      const senderIncentiveDataBefore = await getUserIncentiveData({
        incentivePool: elyfiContracts.incentivePool,
        lToken: elyfiContracts.lToken,
        incentiveAsset: elyfiContracts.incentiveAsset,
        user: sender,
      });
      const receiverIncentiveDataBefore = await getUserIncentiveData({
        incentivePool: elyfiContracts.incentivePool,
        lToken: elyfiContracts.lToken,
        incentiveAsset: elyfiContracts.incentiveAsset,
        user: receiver,
      });
      const incentivePoolDataBefore = await getIncentivePoolData({
        incentivePool: elyfiContracts.incentivePool,
        lToken: elyfiContracts.lToken,
        incentiveAsset: elyfiContracts.incentiveAsset,
      });
      const tx = await elyfiContracts.lToken.connect(sender).transfer(receiver.address, amount);

      const [
        expectedIncentivePoolData,
        expectedSenderIncentiveData,
        expectedReceiverIncentiveData,
      ]: [IncentivePoolData, UserIncentiveData, UserIncentiveData] =
        expectIncentiveDataAfterTransfer(
          incentivePoolDataBefore,
          senderIncentiveDataBefore,
          receiverIncentiveDataBefore,
          await getTimestamp(tx),
          amount
        );

      const senderIncentiveDataAfter = await getUserIncentiveData({
        incentivePool: elyfiContracts.incentivePool,
        lToken: elyfiContracts.lToken,
        incentiveAsset: elyfiContracts.incentiveAsset,
        user: sender,
      });
      const receiverIncentiveDataAfter = await getUserIncentiveData({
        incentivePool: elyfiContracts.incentivePool,
        lToken: elyfiContracts.lToken,
        incentiveAsset: elyfiContracts.incentiveAsset,
        user: receiver,
      });
      const incentivePoolDataAfter = await getIncentivePoolData({
        incentivePool: elyfiContracts.incentivePool,
        lToken: elyfiContracts.lToken,
        incentiveAsset: elyfiContracts.incentiveAsset,
      });

      expect(expectedIncentivePoolData).to.be.deepEqualWithBigNumber(incentivePoolDataAfter);
      expect(expectedSenderIncentiveData).to.be.deepEqualWithBigNumber(senderIncentiveDataAfter);
      expect(expectedReceiverIncentiveData).to.be.deepEqualWithBigNumber(
        receiverIncentiveDataAfter
      );
    });
  });
});
