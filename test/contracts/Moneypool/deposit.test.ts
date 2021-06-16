import { ethers, waffle } from 'hardhat';
import { getTimestamp } from '../../utils/Ethereum';
import { RAY } from '../../utils/constants';
import { expect } from '../../utils/chai';
import { expectReserveDataAfterDeposit, expectUserDataAfterDeposit } from '../../utils/Expect';
import ElyfiContracts from '../../types/ElyfiContracts';
import takeDataSnapshot from '../../utils/takeDataSnapshot';
import { BigNumber } from 'ethers';
import loadFixture from '../../utils/loadFixture';
import utilizedMoneypool from '../../fixtures/utilizedMoneypool';

describe('MoneyPool.deposit', () => {
  let elyfiContracts: ElyfiContracts;

  const [deployer, account1] = waffle.provider.getWallets();

  beforeEach(async () => {
    const fixture = await loadFixture(utilizedMoneypool);
    elyfiContracts = fixture.elyfiContracts;
  });

  context('when account approve enough underlyingAsset', async () => {
    beforeEach(async () => {
      await elyfiContracts.underlyingAsset
        .connect(account1)
        .approve(elyfiContracts.moneyPool.address, RAY);
    });

    context('when accunt has enough underlyingAsset', async () => {
      let beforeBalance: BigNumber;

      beforeEach(async () => {
        await elyfiContracts.underlyingAsset.connect(deployer).transfer(account1.address, RAY);
        beforeBalance = await elyfiContracts.underlyingAsset.balanceOf(account1.address);
      });

      context('when amount is not zero', async () => {
        it('update user data & reserve data', async () => {
          const amountDeposit = ethers.utils.parseEther('10000');

          const [reserveDataBefore, userDataBefore] = await takeDataSnapshot(
            account1,
            elyfiContracts
          );

          const depositTx = await elyfiContracts.moneyPool
            .connect(account1)
            .deposit(elyfiContracts.underlyingAsset.address, account1.address, amountDeposit);

          const [reserveDataAfter, userDataAfter] = await takeDataSnapshot(
            account1,
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

          expect(reserveDataAfter).to.equalReserveData(expectedReserveData);
          expect(userDataAfter).to.equalUserData(expectedUserData);

          const afterBalance = await elyfiContracts.underlyingAsset.balanceOf(account1.address);
          expect(beforeBalance.sub(afterBalance)).to.eq(amountDeposit);
        });

        context('when moneypool is deactivated', async () => {
          it('reverted ', async () => {
            await elyfiContracts.connector
              .connect(deployer)
              .deactivateMoneyPool(elyfiContracts.moneyPool.address);

            await expect(
              elyfiContracts.moneyPool
                .connect(account1)
                .deposit(
                  elyfiContracts.underlyingAsset.address,
                  account1.address,
                  ethers.utils.parseEther('1000')
                )
            ).to.be.reverted;
          });
        });

        context('when moneypool is paused', async () => {
          it('reverted', async () => {
            await expect(
              elyfiContracts.moneyPool
                .connect(account1)
                .deposit(
                  elyfiContracts.underlyingAsset.address,
                  account1.address,
                  ethers.utils.parseEther('1000')
                )
            ).to.reverted;
          });
        });
      });

      context('when amount is zero', async () => {
        it('reverted', async () => {
          await expect(
            elyfiContracts.moneyPool
              .connect(account1)
              .deposit(elyfiContracts.underlyingAsset.address, account1.address, BigNumber.from(0))
          ).to.be.reverted;
        });
      });
    });

    context('when accunt does not have enough underlyingAsset', async () => {
      it('reverted', async () => {
        await expect(
          elyfiContracts.moneyPool
            .connect(account1)
            .deposit(
              elyfiContracts.underlyingAsset.address,
              account1.address,
              ethers.utils.parseEther('10000')
            )
        ).to.be.reverted;
      });
    });
  });

  context('when account do not approve enough underlyingAsset', async () => {
    beforeEach(async () => {
      await elyfiContracts.underlyingAsset.connect(deployer).transfer(account1.address, RAY);
    });

    it('reverted', async () => {
      await expect(
        elyfiContracts.moneyPool
          .connect(account1)
          .deposit(
            elyfiContracts.underlyingAsset.address,
            account1.address,
            ethers.utils.parseEther('10000')
          )
      ).to.be.reverted;
    });
  });
});