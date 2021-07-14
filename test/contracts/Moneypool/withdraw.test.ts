import { constants, utils } from 'ethers';
import { waffle } from 'hardhat';
import { expect } from 'chai';
import { expectReserveDataAfterWithdraw, expectUserDataAfterWithdraw } from '../../utils/Expect';
import ElyfiContracts from '../../types/ElyfiContracts';
import takeDataSnapshot from '../../utils/takeDataSnapshot';
import loadFixture from '../../utils/loadFixture';
import utilizedMoneypool from '../../fixtures/utilizedMoneypool';
import { getTimestamp } from '../../utils/time';
require('../../assertions/equals.ts');

describe('MoneyPool.withdraw', () => {
  let elyfiContracts: ElyfiContracts;

  const provider = waffle.provider;
  const [deployer, depositor] = provider.getWallets();
  const reserved = async () => {
    return await elyfiContracts.underlyingAsset.balanceOf(elyfiContracts.lToken.address);
  };

  beforeEach(async () => {
    const fixture = await loadFixture(utilizedMoneypool);
    elyfiContracts = fixture.elyfiContracts;

    await elyfiContracts.underlyingAsset
      .connect(deployer)
      .transfer(depositor.address, utils.parseEther('20'));
  });

  context('when an account deposited', async () => {
    beforeEach(async () => {
      await elyfiContracts.underlyingAsset
        .connect(depositor)
        .approve(elyfiContracts.moneyPool.address, utils.parseEther('20'));

      await elyfiContracts.moneyPool
        .connect(depositor)
        .deposit(elyfiContracts.underlyingAsset.address, depositor.address, utils.parseEther('10'));
    });

    context('when amount is valid', async () => {
      it('withdraw the amount and upate user and reserve data', async () => {
        const reservedBefore = await reserved();
        const amountWithdraw = utils.parseEther('5');

        const [reserveDataBefore, userDataBefore] = await takeDataSnapshot(
          depositor,
          elyfiContracts
        );

        const tx = await elyfiContracts.moneyPool
          .connect(depositor)
          .withdraw(elyfiContracts.underlyingAsset.address, depositor.address, amountWithdraw);

        const [reserveDataAfter, userDataAfter] = await takeDataSnapshot(depositor, elyfiContracts);

        const expectedReserveData = expectReserveDataAfterWithdraw({
          amount: amountWithdraw,
          reserveData: reserveDataBefore,
          txTimestamp: await getTimestamp(tx),
        });
        const expectedUserData = expectUserDataAfterWithdraw({
          amountWithdraw,
          userDataBefore,
          reserveDataAfter,
          txTimestamp: await getTimestamp(tx),
        });

        expect(reserveDataAfter).to.equalReserveData(expectedReserveData);
        expect(userDataAfter).to.equalUserData(expectedUserData);
        const reservedAfter = await reserved();
        expect(reservedBefore.sub(reservedAfter)).to.eq(utils.parseEther('5'));
      });
    });

    context('when amount is uint max', async () => {
      it('withdraw all', async () => {
        const accountBalanceBefore = await elyfiContracts.underlyingAsset.balanceOf(
          depositor.address
        );

        await elyfiContracts.moneyPool
          .connect(depositor)
          .withdraw(
            elyfiContracts.underlyingAsset.address,
            depositor.address,
            constants.MaxUint256
          );

        expect(await elyfiContracts.lToken.balanceOf(depositor.address)).to.eq(constants.Zero);
        expect(
          (await elyfiContracts.underlyingAsset.balanceOf(depositor.address)).sub(
            accountBalanceBefore
          )
        ).to.gte(utils.parseEther('10'));
      });
    });

    context('when moneypool is deactivated', async () => {
      it('reverted ', async () => {
        await elyfiContracts.moneyPool
          .connect(deployer)
          .deactivateMoneyPool(elyfiContracts.underlyingAsset.address);

        await expect(
          elyfiContracts.moneyPool
            .connect(depositor)
            .withdraw(
              elyfiContracts.underlyingAsset.address,
              depositor.address,
              utils.parseEther('2')
            )
        ).to.be.revertedWith('ReserveInactivated');
      });
    });

    context('when amount is bigger than max amount', async () => {
      it('reverted', async () => {
        await expect(
          elyfiContracts.moneyPool
            .connect(depositor)
            .withdraw(
              elyfiContracts.underlyingAsset.address,
              depositor.address,
              utils.parseEther('11')
            )
        ).to.be.revertedWith('WithdrawInsufficientBalance');
      });
    });
  });

  context('when an account has not deposited', async () => {
    it('reverted', async () => {
      await expect(
        elyfiContracts.moneyPool
          .connect(depositor)
          .withdraw(
            elyfiContracts.underlyingAsset.address,
            depositor.address,
            utils.parseEther('1')
          )
      ).to.be.revertedWith('WithdrawInsufficientBalance');
    });
  });
});
