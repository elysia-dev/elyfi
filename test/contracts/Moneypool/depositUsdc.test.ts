import { JsonRpcSigner } from '@ethersproject/providers';
import { BigNumber, constants, Wallet } from 'ethers';
import hre, { ethers } from 'hardhat';
import { ERC20__factory } from '../../../typechain';
import ElyfiContracts from '../../types/ElyfiContracts';
import { expect } from '../../utils/chai';
import { RAY } from '../../utils/constants';
import { ERC20 } from './../../../typechain/ERC20.d';

describe('MoneyPool.deposit', () => {
  let elyfiContracts: ElyfiContracts;
  let usdc: ERC20;
  let deployer: Wallet;
  let depositor: JsonRpcSigner;

  beforeEach(async () => {
    // const fixture = await loadFixture(utilizedMoneypool);
    // elyfiContracts = fixture.elyfiContracts;
    const provider = hre.ethers.provider;
    const usdcAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'; // USDC
    const usdcOwnerAddress = '0xCFFAd3200574698b78f32232aa9D63eABD290703';
    usdc = ERC20__factory.connect(usdcAddress, provider as any);
    depositor = provider.getSigner(usdcOwnerAddress);
    console.log(depositor);
  });

  context('when account approve enough underlyingAsset', async () => {
    beforeEach(async () => {
      await usdc.connect(depositor).approve(elyfiContracts.moneyPool.address, RAY);
    });

    context('when accunt has enough underlyingAsset', async () => {
      let beforeBalance: BigNumber;

      beforeEach(async () => {
        // await usdc.connect(deployer).transfer(depositor.address, RAY);
        // beforeBalance = await usdc.balanceOf(depositor.address);
      });

      context('when amount is not zero', async () => {
        it.only('update user data & reserve data', async () => {
          const amountDeposit = ethers.utils.parseEther('10000');

          const depositTx = await elyfiContracts.moneyPool
            .connect(depositor)
            .deposit(usdc.address, depositor._address, amountDeposit);

          // expect(reserveDataAfter).to.deepEqualWithBigNumber(expectedReserveData);
          // expect(userDataAfter).to.deepEqualWithBigNumber(expectedUserData);

          const afterBalance = await usdc.balanceOf(depositor._address);
          // expect(beforeBalance.sub(afterBalance)).to.eq(amountDeposit);
        });

        context('when moneypool is deactivated', async () => {
          it('reverted ', async () => {
            await elyfiContracts.moneyPool.connect(deployer).deactivateMoneyPool(usdc.address);

            await expect(
              elyfiContracts.moneyPool
                .connect(depositor)
                .deposit(usdc.address, depositor._address, ethers.utils.parseEther('1000'))
            ).to.be.revertedWith('ReserveInactivated');
          });
        });

        context('when moneypool is paused', async () => {
          it('reverted', async () => {
            await elyfiContracts.moneyPool.connect(deployer).pauseMoneyPool(usdc.address);

            await expect(
              elyfiContracts.moneyPool
                .connect(depositor)
                .deposit(usdc.address, depositor._address, ethers.utils.parseEther('1000'))
            ).to.revertedWith('ReservePaused');
          });
        });
      });

      context('when amount is zero', async () => {
        it('reverted', async () => {
          await expect(
            elyfiContracts.moneyPool
              .connect(depositor)
              .deposit(usdc.address, depositor._address, constants.Zero)
          ).to.be.revertedWith('InvalidAmount');
        });
      });
    });
  });
});
