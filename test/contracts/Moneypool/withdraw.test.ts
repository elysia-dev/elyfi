import { BigNumber } from 'bignumber.js';
import { ethers, waffle } from 'hardhat';
import { getTimestamp } from '../../utils/Ethereum';
import {
  makeAllContracts,
} from '../../utils/makeContract';
import { expect } from 'chai';
import {
  expectedReserveDataAfterWithdraw,
  expectedUserDataAfterWithdraw,
} from '../../utils/Expect';
import ElyfiContracts from '../../types/ElyfiContracts';
import takeDataSnapshot from '../../utils/takeDataSnapshot';
require('../../assertions/equals.ts');

// TODO : Mockup user & reserve data
describe('MoneyPool.withdraw', () => {
  let elyfiContracts: ElyfiContracts

  const provider = waffle.provider;
  const [deployer, account1] = provider.getWallets();

  beforeEach(async () => {
    elyfiContracts = await makeAllContracts(deployer)

    await elyfiContracts.underlyingAsset.connect(deployer).transfer(account1.address, ethers.utils.parseEther('5000'));
  });

  describe('when account invested', async () => {
    describe('when account have enough reserve', async () => {
      beforeEach(async () => {
        await elyfiContracts.underlyingAsset.connect(account1).approve(elyfiContracts.moneyPool.address, ethers.utils.parseEther('20'));

        await elyfiContracts.moneyPool
          .connect(account1)
          .invest(elyfiContracts.underlyingAsset.address, account1.address, ethers.utils.parseEther('10'));
      })

      // TODO : check account's testERC20 balance after withdrwal
      it('withdraw the amount and upate user and reserve data', async () => {
        const amountWithdraw = new BigNumber(ethers.utils.parseEther('5').toString());

        const [reserveDataBefore, userDataBefore] = await takeDataSnapshot(account1, elyfiContracts)

        const tx = await elyfiContracts.moneyPool
          .connect(account1)
          .withdraw(elyfiContracts.underlyingAsset.address, account1.address, ethers.utils.parseEther('5'));

        const [reserveDataAfter, userDataAfter] = await takeDataSnapshot(account1, elyfiContracts)

        const expectedReserveData = expectedReserveDataAfterWithdraw({
          amountWithdraw,
          reserveDataBefore,
          txTimestamp: await getTimestamp(tx),
        });
        const expectedUserData = expectedUserDataAfterWithdraw({
          amountWithdraw,
          userDataBefore,
          reserveDataBefore,
          reserveDataAfter,
          txTimestamp: await getTimestamp(tx),
        });

        expect(reserveDataAfter).to.be.deep.eq(expectedReserveData);
        expect(userDataAfter).to.be.deep.eq(expectedUserData);
      });
    })
  })
});
