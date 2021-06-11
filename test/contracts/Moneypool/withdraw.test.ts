import { utils } from 'ethers'
import { waffle } from 'hardhat';
import { getTimestamp } from '../../utils/Ethereum';
import { expect } from 'chai';
import {
  expectReserveDataAfterInvest,
  expectUserDataAfterWithdraw,
} from '../../utils/Expect';
import ElyfiContracts from '../../types/ElyfiContracts';
import takeDataSnapshot from '../../utils/takeDataSnapshot';
import loadFixture from '../../utils/loadFixture';
import deployedAll from '../../fixtures/deployedAll';
require('../../assertions/equals.ts');

// TODO : Mockup user & reserve data
describe('MoneyPool.withdraw', () => {
  let elyfiContracts: ElyfiContracts

  const provider = waffle.provider;
  const [deployer, account1] = provider.getWallets();

  beforeEach(async () => {
    const fixture = await loadFixture(deployedAll);
    elyfiContracts = fixture.elyfiContracts;

    await elyfiContracts.underlyingAsset.connect(deployer).transfer(account1.address, utils.parseEther('5000'));
  });

  describe('when account invested', async () => {
    describe('when account have enough reserve', async () => {
      beforeEach(async () => {
        await elyfiContracts.underlyingAsset.connect(account1).approve(elyfiContracts.moneyPool.address, utils.parseEther('20'));

        await elyfiContracts.moneyPool
          .connect(account1)
          .invest(elyfiContracts.underlyingAsset.address, account1.address, utils.parseEther('10'));
      })

      // TODO : check account's testERC20 balance after withdrwal
      it('withdraw the amount and upate user and reserve data', async () => {
        const amountWithdraw = utils.parseEther('5');

        const [reserveDataBefore, userDataBefore] = await takeDataSnapshot(account1, elyfiContracts)

        const tx = await elyfiContracts.moneyPool
          .connect(account1)
          .withdraw(elyfiContracts.underlyingAsset.address, account1.address, utils.parseEther('5'));

        const [reserveDataAfter, userDataAfter] = await takeDataSnapshot(account1, elyfiContracts)

        const expectedReserveData = expectReserveDataAfterInvest({
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
      });
    })
  })
});
