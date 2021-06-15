import { ethers, waffle } from 'hardhat';
import { getTimestamp, toRate } from '../../utils/Ethereum';
import { expect } from 'chai';
import { expectReserveDataAfterBorrow, expectUserDataAfterBorrow } from '../../utils/Expect';
import ElyfiContracts from '../../types/ElyfiContracts';
import takeDataSnapshot from '../../utils/takeDataSnapshot';
import { BigNumber, utils } from 'ethers';
import loadFixture from '../../utils/loadFixture';
import utilizedMoneypool from '../../fixtures/utilizedMoneypool';
import { settleAssetBond } from '../../utils/Helpers';
import { AssetBondSettleData } from '../../utils/Interfaces';
require('../../assertions/equals.ts');

describe('MoneyPool.repay', () => {
  let elyfiContracts: ElyfiContracts;

  const provider = waffle.provider;
  const [deployer, investor, CSP, borrower, signer, otherCSP, account] = provider.getWallets();
  const testAssetBondData: AssetBondSettleData = <AssetBondSettleData>{
    ...(<AssetBondSettleData>{}),
    borrower: borrower.address,
    signer: signer.address,
    tokenId: BigNumber.from('1001002003004005'),
    principal: ethers.utils.parseEther('10'),
    debtCeiling: ethers.utils.parseEther('13'),
    couponRate: toRate(0.1),
    overdueInterestRate: toRate(0.03),
    loanDuration: BigNumber.from(365),
    loanStartTimeYear: BigNumber.from(2022),
    loanStartTimeMonth: BigNumber.from(0),
    loanStartTimeDay: BigNumber.from(1),
    ipfsHash: 'test',
  };

  beforeEach('', async () => {
    const fixture = await loadFixture(utilizedMoneypool);
    elyfiContracts = fixture.elyfiContracts;

    await elyfiContracts.underlyingAsset
      .connect(deployer)
      .transfer(investor.address, utils.parseEther('1000'));

    await elyfiContracts.connector.connect(deployer).addCollateralServiceProvider(CSP.address);
    await elyfiContracts.tokenizer
      .connect(CSP)
      .mintAssetBond(CSP.address, testAssetBondData.tokenId);
    await settleAssetBond({
      tokenizer: elyfiContracts.tokenizer,
      txSender: CSP,
      settleArguments: testAssetBondData,
    });
  });

  context('when the account balance is sufficient', async () => {
    it('reverts if the asset bond status is not `COLLATERALIZED', async () => {
      await expect(
        elyfiContracts.moneyPool
          .connect(account)
          .repay(elyfiContracts.underlyingAsset.address, testAssetBondData.tokenId)
      ).to.be.reverted;
    });
    context('when the borrower has borrowed against asset bond', async () => {
      beforeEach(async () => {
        const tx = await elyfiContracts.moneyPool
          .connect(CSP)
          .borrow(elyfiContracts.underlyingAsset.address, testAssetBondData.tokenId);
      });
      context('when the current timestamp is less than the maturity timestamp', async () => {
        it('update reserve and user data', async () => {
          const [reserveDataBefore, userDataBefore] = await takeDataSnapshot(CSP, elyfiContracts);
          const amount = utils.parseEther('300');

          const tx = await elyfiContracts.moneyPool
            .connect(CSP)
            .borrow(elyfiContracts.underlyingAsset.address, testAssetBondData.tokenId);

          const [reserveDataAfter, userDataAfter] = await takeDataSnapshot(
            borrower,
            elyfiContracts
          );

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
                .borrow(elyfiContracts.underlyingAsset.address, testAssetBondData.tokenId)
            ).to.be.reverted;

            await expect(
              elyfiContracts.moneyPool
                .connect(otherCSP)
                .borrow(elyfiContracts.underlyingAsset.address, testAssetBondData.tokenId)
            ).to.be.reverted;
          });
        });
      });
    });
    context('when the account balance is sufficient', async () => {
      it('');
    });
  });
});
