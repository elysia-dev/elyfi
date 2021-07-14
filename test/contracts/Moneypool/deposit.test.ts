import { ethers, waffle } from 'hardhat';
import { RAY } from '../../utils/constants';
import { expect } from '../../utils/chai';
import { expectReserveDataAfterDeposit, expectUserDataAfterDeposit } from '../../utils/Expect';
import ElyfiContracts from '../../types/ElyfiContracts';
import takeDataSnapshot from '../../utils/takeDataSnapshot';
import { BigNumber, constants } from 'ethers';
import loadFixture from '../../utils/loadFixture';
import utilizedMoneypool from '../../fixtures/utilizedMoneypool';
import { getTimestamp } from '../../utils/time';

describe('MoneyPool.deposit', () => {
  let elyfiContracts: ElyfiContracts;

  const [deployer, depositor, CSP, borrower, signer, otherCSP] = waffle.provider.getWallets();

  beforeEach(async () => {
    const fixture = await loadFixture(utilizedMoneypool);
    elyfiContracts = fixture.elyfiContracts;
  });

  context('when account approve enough underlyingAsset', async () => {
    beforeEach(async () => {
      await elyfiContracts.underlyingAsset
        .connect(depositor)
        .approve(elyfiContracts.moneyPool.address, RAY);
    });

    context('when accunt has enough underlyingAsset', async () => {
      let beforeBalance: BigNumber;

      beforeEach(async () => {
        await elyfiContracts.underlyingAsset.connect(deployer).transfer(depositor.address, RAY);
        beforeBalance = await elyfiContracts.underlyingAsset.balanceOf(depositor.address);
      });

      context('when amount is not zero', async () => {
        it('update user data & reserve data', async () => {
          const amountDeposit = ethers.utils.parseEther('10000');

          const [reserveDataBefore, userDataBefore] = await takeDataSnapshot(
            depositor,
            elyfiContracts
          );

          const depositTx = await elyfiContracts.moneyPool
            .connect(depositor)
            .deposit(elyfiContracts.underlyingAsset.address, depositor.address, amountDeposit);

          const [reserveDataAfter, userDataAfter] = await takeDataSnapshot(
            depositor,
            elyfiContracts
          );

          const expectedReserveData = expectReserveDataAfterDeposit({
            amount: amountDeposit,
            reserveData: reserveDataBefore,
            txTimestamp: await getTimestamp(depositTx),
          });
          const expectedUserData = expectUserDataAfterDeposit({
            amountDeposit: amountDeposit,
            userDataBefore,
            reserveDataAfter,
            txTimestamp: await getTimestamp(depositTx),
          });

          expect(reserveDataAfter).to.deepEqualWithBigNumber(expectedReserveData);
          expect(userDataAfter).to.deepEqualWithBigNumber(expectedUserData);

          const afterBalance = await elyfiContracts.underlyingAsset.balanceOf(depositor.address);
          expect(beforeBalance.sub(afterBalance)).to.eq(amountDeposit);
        });

        context('when moneypool is deactivated', async () => {
          it('reverted ', async () => {
            await elyfiContracts.moneyPool
              .connect(deployer)
              .deactivateMoneyPool(elyfiContracts.underlyingAsset.address);

            await expect(
              elyfiContracts.moneyPool
                .connect(depositor)
                .deposit(
                  elyfiContracts.underlyingAsset.address,
                  depositor.address,
                  ethers.utils.parseEther('1000')
                )
            ).to.be.revertedWith('ReserveInactivated');
          });
        });

        context('when moneypool is paused', async () => {
          it('reverted', async () => {
            await elyfiContracts.moneyPool
              .connect(deployer)
              .pauseMoneyPool(elyfiContracts.underlyingAsset.address);

            await expect(
              elyfiContracts.moneyPool
                .connect(depositor)
                .deposit(
                  elyfiContracts.underlyingAsset.address,
                  depositor.address,
                  ethers.utils.parseEther('1000')
                )
            ).to.revertedWith('ReservePaused');
          });
        });
      });

      context('when amount is zero', async () => {
        it('reverted', async () => {
          await expect(
            elyfiContracts.moneyPool
              .connect(depositor)
              .deposit(elyfiContracts.underlyingAsset.address, depositor.address, constants.Zero)
          ).to.be.revertedWith('InvalidAmount');
        });
      });
    });

    context('when accunt does not have enough underlyingAsset', async () => {
      it('reverted', async () => {
        await expect(
          elyfiContracts.moneyPool
            .connect(depositor)
            .deposit(
              elyfiContracts.underlyingAsset.address,
              depositor.address,
              ethers.utils.parseEther('10000')
            )
        ).to.be.reverted;
      });
    });
  });

  context('when account do not approve enough underlyingAsset', async () => {
    before(async () => {
      await elyfiContracts.underlyingAsset.connect(deployer).transfer(depositor.address, RAY);
    });

    it('reverted', async () => {
      await expect(
        elyfiContracts.moneyPool
          .connect(depositor)
          .deposit(
            elyfiContracts.underlyingAsset.address,
            depositor.address,
            ethers.utils.parseEther('10000')
          )
      ).to.be.reverted;
    });
  });
});
