import { constants, utils } from 'ethers'
import { waffle } from 'hardhat';
import { getTimestamp } from '../../utils/Ethereum';
import { expect } from 'chai';
import {
  expectReserveDataAfterDeposit,
  expectUserDataAfterWithdraw,
} from '../../utils/Expect';
import ElyfiContracts from '../../types/ElyfiContracts';
import takeDataSnapshot from '../../utils/takeDataSnapshot';
import loadFixture from '../../utils/loadFixture';
import utilizedMoneypool from '../../fixtures/utilizedMoneypool';
require('../../assertions/equals.ts');

describe('MoneyPool.withdraw', () => {
  let elyfiContracts: ElyfiContracts

  const provider = waffle.provider;
  const [deployer, account1] = provider.getWallets();
  const reserved = async () => {
    return await elyfiContracts.underlyingAsset.balanceOf(elyfiContracts.lToken.address);
  }

  beforeEach(async () => {
    const fixture = await loadFixture(utilizedMoneypool);
    elyfiContracts = fixture.elyfiContracts;

    await elyfiContracts
      .underlyingAsset
      .connect(deployer)
      .transfer(account1.address, utils.parseEther('5000'));
  });

  context('when an account deposited', async () => {
    beforeEach(async () => {
      await elyfiContracts
        .underlyingAsset
        .connect(account1)
        .approve(elyfiContracts.moneyPool.address, utils.parseEther('20'));

      await elyfiContracts
        .moneyPool
        .connect(account1)
        .deposit(elyfiContracts.underlyingAsset.address, account1.address, utils.parseEther('10'));
    })

    context('when amount is valid', async () => {
      it('withdraw the amount and upate user and reserve data', async () => {
        const reservedBefore = await reserved();
        const amountWithdraw = utils.parseEther('5');

        const [reserveDataBefore, userDataBefore] = await takeDataSnapshot(account1, elyfiContracts)

        const tx = await elyfiContracts.moneyPool
          .connect(account1)
          .withdraw(elyfiContracts.underlyingAsset.address, account1.address, amountWithdraw);

        const [reserveDataAfter, userDataAfter] = await takeDataSnapshot(account1, elyfiContracts)

        const expectedReserveData = expectReserveDataAfterDeposit({
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

        expect(await elyfiContracts.underlyingAsset.balanceOf(account1.address)).to.eq(utils.parseEther('4995'))

        const reservedAfter = await reserved();
        expect(reservedBefore.sub(reservedAfter)).to.eq(utils.parseEther('5'))
      });
    })

    context('when amount is uint max', async () => {
      it('withdraw all', async () => {
        const accountBalanceBefore = await elyfiContracts.underlyingAsset.balanceOf(account1.address);

        await elyfiContracts
          .moneyPool
          .connect(account1)
          .withdraw(
            elyfiContracts.underlyingAsset.address,
            account1.address,
            constants.MaxUint256
          );

        expect(await elyfiContracts.lToken.balanceOf(account1.address)).to.eq(constants.Zero);
        expect((await elyfiContracts.underlyingAsset.balanceOf(account1.address))
          .sub(accountBalanceBefore))
          .to.gte(utils.parseEther('5000'));
      })
    })

    context('when moneypool is deactivated', async () => {
      it('reverted ', async () => {
        await elyfiContracts.connector
          .connect(deployer)
          .deactivateMoneyPool(elyfiContracts.moneyPool.address);

        await expect(
          elyfiContracts.moneyPool
            .connect(account1)
            .withdraw(
              elyfiContracts.underlyingAsset.address,
              account1.address,
              utils.parseEther('2')
            )
        ).to.be.reverted;
      });
    });

    context('when moneypool is paused', async () => {
      it('reverted', async () => {
        await expect(
          elyfiContracts.moneyPool
            .connect(account1)
            .withdraw(
              elyfiContracts.underlyingAsset.address,
              account1.address,
              utils.parseEther('2')
            )
        ).to.reverted;
      });
    });

    context('when amount is bigger than max amount', async () => {
      it('reverted', async () => {
        await expect(
          elyfiContracts
            .moneyPool
            .connect(account1)
            .withdraw(
              elyfiContracts.underlyingAsset.address,
              account1.address,
              utils.parseEther('11')
            )
        )
      });
    })
  })

  context('when an account does not deposit', async () => {
    it('reverted', async () => {
      await expect(
        elyfiContracts.moneyPool
          .connect(account1)
          .withdraw(
            elyfiContracts.underlyingAsset.address,
            account1.address,
            utils.parseEther('1')
          )
      )
    })
  })
});
