import { waffle } from 'hardhat';
import { expect } from 'chai';
import {
  expectAssetBondDataAfterRepay,
  expectReserveDataAfterRepay,
  expectUserDataAfterRepay,
} from '../../utils/Expect';
import ElyfiContracts from '../../types/ElyfiContracts';
import takeDataSnapshot from '../../utils/takeDataSnapshot';
import { BigNumber, utils } from 'ethers';
import loadFixture from '../../utils/loadFixture';
import utilizedMoneypool from '../../fixtures/utilizedMoneypool';
import { getAssetBondData, settleAssetBond } from '../../utils/Helpers';
import { calculateAssetBondDebtData } from '../../utils/Math';
import { testAssetBondData } from '../../utils/testData';
import {
  toTimestamp,
  advanceTimeTo,
  getTimestamp,
  saveEVMSnapshot,
  revertFromEVMSnapshot,
} from '../../utils/time';
import { RAY } from '../../utils/constants';
require('../../assertions/equals.ts');

describe('MoneyPool.repay', () => {
  let elyfiContracts: ElyfiContracts;

  const provider = waffle.provider;
  const [deployer, depositor, CSP, borrower, signer] = provider.getWallets();

  testAssetBondData.borrower = borrower.address;
  testAssetBondData.signer = signer.address;

  beforeEach('The asset bond is settled and signed properly', async () => {
    const fixture = await loadFixture(utilizedMoneypool);
    const signerOpinionHash = 'test opinion hash';
    elyfiContracts = fixture.elyfiContracts;

    await elyfiContracts.connector.connect(deployer).addCollateralServiceProvider(CSP.address);
    await elyfiContracts.connector.connect(deployer).addCouncil(signer.address);
    await elyfiContracts.tokenizer
      .connect(CSP)
      .mintAssetBond(CSP.address, testAssetBondData.tokenId);
    await settleAssetBond({
      tokenizer: elyfiContracts.tokenizer,
      txSender: CSP,
      settleArguments: testAssetBondData,
    });
    await elyfiContracts.tokenizer
      .connect(signer)
      .signAssetBond(testAssetBondData.tokenId, signerOpinionHash);
  });

  it('reverts if the asset bond is not collateralized', async () => {
    await expect(
      elyfiContracts.moneyPool
        .connect(borrower)
        .repay(elyfiContracts.underlyingAsset.address, testAssetBondData.tokenId)
    ).to.be.revertedWith('OnlyCollateralizedOrMaturedAssetBondRepayable');
  });

  context('when the borrower has borrowed against asset bond', async () => {
    beforeEach(
      'The collateral service provider borrowed and collateralized asset bond',
      async () => {
        await elyfiContracts.underlyingAsset
          .connect(deployer)
          .transfer(depositor.address, utils.parseEther('1000'));
        await elyfiContracts.underlyingAsset
          .connect(depositor)
          .approve(elyfiContracts.moneyPool.address, RAY);
        await elyfiContracts.moneyPool
          .connect(depositor)
          .deposit(
            elyfiContracts.underlyingAsset.address,
            depositor.address,
            testAssetBondData.debtCeiling
          );
        const tx = await elyfiContracts.tokenizer
          .connect(CSP)
          .approve(elyfiContracts.moneyPool.address, testAssetBondData.tokenId);
        const loanStartTimestamp = toTimestamp(
          testAssetBondData.loanStartTimeYear,
          testAssetBondData.loanStartTimeMonth,
          testAssetBondData.loanStartTimeDay
        );
        await advanceTimeTo(await getTimestamp(tx), loanStartTimestamp);
        await elyfiContracts.moneyPool
          .connect(CSP)
          .borrow(elyfiContracts.underlyingAsset.address, testAssetBondData.tokenId);
      }
    );
    it('reverts if the account balance is insufficient to repay', async () => {
      await expect(
        elyfiContracts.moneyPool
          .connect(borrower)
          .repay(elyfiContracts.underlyingAsset.address, testAssetBondData.tokenId)
      ).to.be.reverted;
    });

    context('when the borrower has sufficient underlying asset balance', async () => {
      let maturityTimestamp: BigNumber;
      let liquidationTimestamp: BigNumber;
      let snapshotId: string;
      beforeEach('The account balance increases and time passes', async () => {
        await elyfiContracts.underlyingAsset
          .connect(deployer)
          .transfer(borrower.address, utils.parseEther('1000'));
        await elyfiContracts.underlyingAsset
          .connect(depositor)
          .approve(elyfiContracts.moneyPool.address, RAY);

        const assetBondData = await elyfiContracts.tokenizer.getAssetBondData(
          testAssetBondData.tokenId
        );
        maturityTimestamp = assetBondData.maturityTimestamp;
        liquidationTimestamp = assetBondData.liquidationTimestamp;
      });

      beforeEach('take EVM snapshot', async () => {
        snapshotId = await saveEVMSnapshot();
      });

      afterEach('revert from EVM snapshot', async () => {
        await revertFromEVMSnapshot(snapshotId);
      });

      context('when the current timestamp is less than the maturity timestamp', async () => {
        beforeEach('approve underlyingAsset', async () => {
          await elyfiContracts.underlyingAsset
            .connect(borrower)
            .approve(elyfiContracts.moneyPool.address, utils.parseEther('1000'));
        });
        it('update reserve and user data after repayment', async () => {
          const [reserveDataBefore, userDataBefore] = await takeDataSnapshot(
            borrower,
            elyfiContracts
          );

          const assetBondDataBefore = await getAssetBondData({
            underlyingAsset: elyfiContracts.underlyingAsset,
            dataPipeline: elyfiContracts.dataPipeline,
            tokenizer: elyfiContracts.tokenizer,
            tokenId: testAssetBondData.tokenId,
          });

          const collateralServiceProviderLTokenBalanceBefore =
            await elyfiContracts.lToken.balanceOf(CSP.address);

          const tx = await elyfiContracts.moneyPool
            .connect(borrower)
            .repay(elyfiContracts.underlyingAsset.address, testAssetBondData.tokenId);

          const [reserveDataAfter, userDataAfter] = await takeDataSnapshot(
            borrower,
            elyfiContracts
          );

          const assetBondDataAfter = await getAssetBondData({
            underlyingAsset: elyfiContracts.underlyingAsset,
            dataPipeline: elyfiContracts.dataPipeline,
            tokenizer: elyfiContracts.tokenizer,
            tokenId: testAssetBondData.tokenId,
          });

          const collateralServiceProviderLTokenBalanceAfter = await elyfiContracts.lToken.balanceOf(
            CSP.address
          );

          const [, feeOnRepayment] = calculateAssetBondDebtData(
            assetBondDataBefore,
            await getTimestamp(tx)
          );
          const expectedReserveData = expectReserveDataAfterRepay({
            assetBondData: assetBondDataBefore,
            reserveData: reserveDataBefore,
            txTimestamp: await getTimestamp(tx),
          });
          const expectedUserData = expectUserDataAfterRepay({
            assetBondData: assetBondDataBefore,
            userDataBefore: userDataBefore,
            reserveDataAfter: reserveDataAfter,
            txTimestamp: await getTimestamp(tx),
          });
          const expectedAssetBondData = expectAssetBondDataAfterRepay({
            assetBondData: assetBondDataBefore,
          });

          expect(collateralServiceProviderLTokenBalanceAfter).to.be.equal(
            collateralServiceProviderLTokenBalanceBefore.add(feeOnRepayment)
          );
          expect(assetBondDataAfter).equalAssetBondData(expectedAssetBondData);
          expect(reserveDataAfter).equalReserveData(expectedReserveData);
          expect(userDataAfter).equalUserData(expectedUserData);
        });
      });

      context(
        'when the current timestamp is between the maturity timestamp and the liquidation timestamp',
        async () => {
          beforeEach('approve and increase time', async () => {
            const tx = await elyfiContracts.underlyingAsset
              .connect(borrower)
              .approve(elyfiContracts.moneyPool.address, utils.parseEther('1000'));

            await advanceTimeTo(await getTimestamp(tx), maturityTimestamp.add(1));
          });
          it('update reserve and user data after repayment', async () => {
            const [reserveDataBefore, userDataBefore] = await takeDataSnapshot(
              borrower,
              elyfiContracts
            );

            const assetBondDataBefore = await getAssetBondData({
              underlyingAsset: elyfiContracts.underlyingAsset,
              dataPipeline: elyfiContracts.dataPipeline,
              tokenizer: elyfiContracts.tokenizer,
              tokenId: testAssetBondData.tokenId,
            });

            const collateralServiceProviderLTokenBalanceBefore =
              await elyfiContracts.lToken.balanceOf(CSP.address);

            const tx = await elyfiContracts.moneyPool
              .connect(borrower)
              .repay(elyfiContracts.underlyingAsset.address, testAssetBondData.tokenId);

            const [reserveDataAfter, userDataAfter] = await takeDataSnapshot(
              borrower,
              elyfiContracts
            );

            const assetBondDataAfter = await getAssetBondData({
              underlyingAsset: elyfiContracts.underlyingAsset,
              dataPipeline: elyfiContracts.dataPipeline,
              tokenizer: elyfiContracts.tokenizer,
              tokenId: testAssetBondData.tokenId,
            });

            const collateralServiceProviderLTokenBalanceAfter =
              await elyfiContracts.lToken.balanceOf(CSP.address);

            const [, feeOnRepayment] = calculateAssetBondDebtData(
              assetBondDataBefore,
              await getTimestamp(tx)
            );

            const expectedReserveData = expectReserveDataAfterRepay({
              assetBondData: assetBondDataBefore,
              reserveData: reserveDataBefore,
              txTimestamp: await getTimestamp(tx),
            });

            const expectedUserData = expectUserDataAfterRepay({
              assetBondData: assetBondDataBefore,
              userDataBefore: userDataBefore,
              reserveDataAfter: reserveDataAfter,
              txTimestamp: await getTimestamp(tx),
            });

            const expectedAssetBondData = expectAssetBondDataAfterRepay({
              assetBondData: assetBondDataBefore,
            });

            expect(collateralServiceProviderLTokenBalanceAfter).to.be.equal(
              collateralServiceProviderLTokenBalanceBefore.add(feeOnRepayment)
            );
            expect(assetBondDataAfter).equalAssetBondData(expectedAssetBondData);
            expect(reserveDataAfter).equalReserveData(expectedReserveData);
            expect(userDataAfter).equalUserData(expectedUserData);
          });
        }
      );

      context('when the current is greater than the liquidation timestamp', async () => {
        beforeEach('approve and increase time', async () => {
          const tx = await elyfiContracts.underlyingAsset
            .connect(borrower)
            .approve(elyfiContracts.moneyPool.address, utils.parseEther('1000'));

          await advanceTimeTo(await getTimestamp(tx), liquidationTimestamp.add(1));
        });
        it('reverts', async () => {
          await expect(
            elyfiContracts.moneyPool
              .connect(borrower)
              .repay(elyfiContracts.underlyingAsset.address, testAssetBondData.tokenId)
          ).to.be.revertedWith('LoanExpired');
        });
      });
    });
  });
});
