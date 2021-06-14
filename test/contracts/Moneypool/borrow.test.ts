import { waffle } from 'hardhat';
import { getTimestamp } from '../../utils/Ethereum';
import { expect } from 'chai';
import { expectReserveDataAfterBorrow, expectUserDataAfterBorrow } from '../../utils/Expect';
import ElyfiContracts from '../../types/ElyfiContracts';
import takeDataSnapshot from '../../utils/takeDataSnapshot';
import { utils } from 'ethers';
import loadFixture from '../../utils/loadFixture';
import utilizedMoneypool from '../../fixtures/utilizedMoneypool';
require('../../assertions/equals.ts');

describe('MoneyPool.borrow', () => {
  let elyfiContracts: ElyfiContracts;

  const provider = waffle.provider;
  const [deployer, investor, CSP, borrower, otherCSP] = provider.getWallets();
  const abTokenId = '1001002003004005';

  before(async () => {
    const fixture = await loadFixture(utilizedMoneypool);
    elyfiContracts = fixture.elyfiContracts;

    await elyfiContracts.underlyingAsset
      .connect(deployer)
      .transfer(investor.address, utils.parseEther('1000'));

    await elyfiContracts.connector.connect(deployer).addCollateralServiceProvider(CSP.address);
    await elyfiContracts.connector.connect(deployer).addCollateralServiceProvider(otherCSP.address);
  });

  // TODO
  // 1. validate abToken status
  // 2. validate amount
  context('when AB token is minted by CSP', async () => {
    before(async () => {
      await elyfiContracts.tokenizer.connect(CSP).mintAssetBond(CSP.address, abTokenId);
    });

    context('when AB token is settled & signed', async () => {
      // TODO : update AB token status
      context('when moneypool has enough reserve', async () => {
        it('update borrower balance and reserve and user data', async () => {
          const [reserveDataBefore, userDataBefore] = await takeDataSnapshot(CSP, elyfiContracts);
          const amount = utils.parseEther('300');

          const tx = await elyfiContracts.moneyPool
            .connect(CSP)
            .borrow(elyfiContracts.underlyingAsset.address, borrower.address, amount, abTokenId);

          const [reserveDataAfter, userDataAfter] = await takeDataSnapshot(borrower, elyfiContracts);

          const expectedReserveData = expectReserveDataAfterBorrow({
            amountBorrow: amount,
            reserveDataBefore,
            txTimestamp: await getTimestamp(tx),
          });

          const expectedUserData = expectUserDataAfterBorrow({
            amountBorrow: amount,
            userDataBefore,
            reserveDataBefore,
            reserveDataAfter,
            txTimestamp: await getTimestamp(tx),
          });

          expect(reserveDataAfter).equalReserveData(expectedReserveData);
          expect(userDataAfter).equalUserData(expectedUserData);
        });

        context('when the requester is not the CSP', async () => {
          it('reverted', async () => {
            await expect(
              elyfiContracts.moneyPool
                .connect(investor)
                .borrow(
                  elyfiContracts.underlyingAsset.address,
                  borrower.address,
                  utils.parseEther('300'),
                  abTokenId,
                )
            ).to.be.reverted

            await expect(
              elyfiContracts.moneyPool
                .connect(otherCSP)
                .borrow(
                  elyfiContracts.underlyingAsset.address,
                  borrower.address,
                  utils.parseEther('300'),
                  abTokenId,
                )
            ).to.be.reverted
          })
        })
      });
    })
  });
});
