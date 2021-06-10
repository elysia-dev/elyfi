import { ethers, waffle } from 'hardhat';
import { getTimestamp } from '../../utils/Ethereum';
import { RAY } from '../../utils/constants';
import { makeAllContracts } from '../../utils/makeContract';
import { expect } from '../../utils/chai';
import { expectedReserveDataAfterInvest, expectedUserDataAfterInvest } from '../../utils/Expect';
import ElyfiContracts from '../../types/ElyfiContracts';
import takeDataSnapshot from '../../utils/takeDataSnapshot';
import { BigNumber } from 'ethers';

// TODO : Mockup user & reserve data
describe('MoneyPool.invest', () => {
  let elyfiContracts: ElyfiContracts;

  const provider = waffle.provider;
  const [deployer, account1] = provider.getWallets();

  beforeEach(async () => {
    elyfiContracts = await makeAllContracts(deployer);
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
          const amountInvest = ethers.utils.parseEther('10000');

          const [reserveDataBefore, userDataBefore] = await takeDataSnapshot(
            account1,
            elyfiContracts
          );

          const investTx = await elyfiContracts.moneyPool
            .connect(account1)
            .invest(elyfiContracts.underlyingAsset.address, account1.address, amountInvest);

          const [reserveDataAfter, userDataAfter] = await takeDataSnapshot(
            account1,
            elyfiContracts
          );

          const expectedReserveData = expectedReserveDataAfterInvest({
            amountInvest,
            reserveDataBefore,
            txTimestamp: await getTimestamp(investTx),
          });
          const expectedUserData = expectedUserDataAfterInvest({
            amountInvest: amountInvest,
            userDataBefore,
            reserveDataBefore,
            reserveDataAfter,
            txTimestamp: await getTimestamp(investTx),
          });

          expect(reserveDataAfter).to.equalReserveData(expectedReserveData);
          expect(userDataAfter).to.equalUserData(expectedUserData);

          const afterBalance = await elyfiContracts.underlyingAsset.balanceOf(account1.address);
          expect(beforeBalance.sub(afterBalance)).to.eq(amountInvest);
        });

        context('when moneypool is deactivated', async () => {
          it('reverted ', async () => {
            await elyfiContracts.connector
              .connect(deployer)
              .deactivateMoneyPool(elyfiContracts.moneyPool.address);

            await expect(
              elyfiContracts.moneyPool
                .connect(account1)
                .invest(
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
                .invest(
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
              .invest(elyfiContracts.underlyingAsset.address, account1.address, BigNumber.from(0))
          ).to.be.reverted;
        });
      });
    });

    context('when accunt does not have enough underlyingAsset', async () => {
      it('reverted', async () => {
        await expect(
          elyfiContracts.moneyPool
            .connect(account1)
            .invest(
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
          .invest(
            elyfiContracts.underlyingAsset.address,
            account1.address,
            ethers.utils.parseEther('10000')
          )
      ).to.be.reverted;
    });
  });
});
