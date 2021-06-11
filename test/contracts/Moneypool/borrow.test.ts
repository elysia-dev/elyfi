import { waffle } from 'hardhat';
import { getTimestamp } from '../../utils/Ethereum';
import { expect } from 'chai';
import { expectedReserveDataAfterBorrow, expectedUserDataAfterBorrow } from '../../utils/Expect';
import ElyfiContracts from '../../types/ElyfiContracts';
import takeDataSnapshot from '../../utils/takeDataSnapshot';
import { utils } from 'ethers';
import loadFixture from '../../utils/loadFixture';
import deployedAll from '../../fixtures/deployedAll';
require('../../assertions/equals.ts');

// TODO: Mockup user & reserve data
describe('MoneyPool.borrow', () => {
  let elyfiContracts: ElyfiContracts;

  const provider = waffle.provider;
  const [deployer, investor, CSP, borrower] = provider.getWallets();
  const abTokenId = '1001002003004005';

  before(async () => {
    const fixture = await loadFixture(deployedAll);
    elyfiContracts = fixture.elyfiContracts;

    await elyfiContracts.underlyingAsset
      .connect(deployer)
      .transfer(investor.address, utils.parseEther('1000'));
  });

  describe('when AB token is minted by CSP', async () => {
    before(async () => {
      await elyfiContracts.connector.connect(deployer).addCSP(CSP.address);
      await elyfiContracts.tokenizer.connect(CSP).mintAssetBond(CSP.address, abTokenId);
    });

    describe('when moneypool enough reserve', async () => {
      before(async () => {
        await elyfiContracts.underlyingAsset
          .connect(investor)
          .approve(elyfiContracts.moneyPool.address, utils.parseEther('1000'));
        await elyfiContracts.moneyPool
          .connect(investor)
          .invest(
            elyfiContracts.underlyingAsset.address,
            investor.address,
            utils.parseEther('500')
          );
      });

      it('update borrower balance and reserve and user data', async () => {
        const [reserveDataBefore, userDataBefore] = await takeDataSnapshot(CSP, elyfiContracts);
        const amount = utils.parseEther('300');

        const tx = await elyfiContracts.moneyPool
          .connect(CSP)
          .borrow(elyfiContracts.underlyingAsset.address, borrower.address, amount, abTokenId);

        const [reserveDataAfter, userDataAfter] = await takeDataSnapshot(borrower, elyfiContracts);

        const expectedReserveData = expectedReserveDataAfterBorrow({
          amountBorrow: amount,
          reserveDataBefore,
          txTimestamp: await getTimestamp(tx),
        });

        const expectedUserData = expectedUserDataAfterBorrow({
          amountBorrow: amount,
          userDataBefore,
          reserveDataBefore,
          reserveDataAfter,
          txTimestamp: await getTimestamp(tx),
        });

        expect(reserveDataAfter).equalReserveData(expectedReserveData);
        expect(userDataAfter).equalUserData(expectedUserData);
      });
    });
  });
});
