import { BigNumber } from 'bignumber.js';
import { ethers, waffle } from 'hardhat';
import { getTimestamp, RAY } from '../../utils/Ethereum';
import {
  makeAllContracts,
} from '../../utils/makeContract';
import { expect } from 'chai';
import {
  expectedReserveDataAfterInvest,
  expectedUserDataAfterInvest,
} from '../../utils/Expect';
import ElyfiContracts from '../../types/ElyfiContracts';
import takeDataSnapshot from '../../utils/takeDataSnapshot';
require('../../assertions/equals.ts');

// TODO : Mockup user & reserve data
describe('MoneyPool.invest', () => {
  let elyfiContracts: ElyfiContracts

  const provider = waffle.provider;
  const [deployer, account1, account2] = provider.getWallets();

  beforeEach(async () => {
    elyfiContracts = await makeAllContracts(deployer)

    await elyfiContracts.underlyingAsset.connect(deployer).transfer(account1.address, RAY);
    await elyfiContracts.underlyingAsset.connect(deployer).transfer(account2.address, RAY);
  });

  it('update user data & reserve data', async () => {
    const amountInvest = new BigNumber(ethers.utils.parseEther('10000').toString());
    await elyfiContracts.underlyingAsset.connect(account1).approve(elyfiContracts.moneyPool.address, RAY);

    const [reserveDataBefore, userDataBefore] = await takeDataSnapshot(account1, elyfiContracts)

    const investTx = await elyfiContracts.moneyPool
      .connect(account1)
      .invest(elyfiContracts.underlyingAsset.address, account1.address, amountInvest.toFixed());

    const [reserveDataAfter, userDataAfter] = await takeDataSnapshot(account1, elyfiContracts)

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

    expect(reserveDataAfter).to.be.deep.eq(expectedReserveData);
    expect(userDataAfter).to.deep.eq(expectedUserData);
  });
});
