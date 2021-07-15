import { waffle } from 'hardhat';
import { expect } from 'chai';
import { BigNumber, utils } from 'ethers';
import { expectReserveDataAfterBorrow, expectUserDataAfterBorrow } from '../../utils/Expect';
import takeDataSnapshot from '../../utils/takeDataSnapshot';
import { RAY, SECONDSPERDAY } from '../../utils/constants';
import loadFixture from '../../utils/loadFixture';
import { settleAssetBond } from '../../utils/Helpers';
import { testAssetBond } from '../../utils/testData';
import {
  toTimestamp,
  advanceTimeTo,
  getTimestamp,
  saveEVMSnapshot,
  revertFromEVMSnapshot,
} from '../../utils/time';
import AssetBondState from '../../types/AssetBondState';
import ElyfiContracts from '../../types/ElyfiContracts';
import utilizedMoneypool from '../../fixtures/utilizedMoneypool';

require('../../assertions/equals.ts');

describe('MoneyPool.borrow', () => {
  const testAssetBondData = { ...testAssetBond };
  let elyfiContracts: ElyfiContracts;

  const provider = waffle.provider;
  const [deployer, depositor, CSP, borrower, signer, otherCSP] = provider.getWallets();

  testAssetBondData.borrower = borrower.address;
  testAssetBondData.signer = signer.address;

  beforeEach(async () => {
    const fixture = await loadFixture(utilizedMoneypool);
    elyfiContracts = fixture.elyfiContracts;

    await elyfiContracts.underlyingAsset
      .connect(deployer)
      .transfer(depositor.address, utils.parseEther('1000'));

    await elyfiContracts.connector.connect(deployer).addCollateralServiceProvider(CSP.address);
    await elyfiContracts.connector.connect(deployer).addCollateralServiceProvider(otherCSP.address);
    await elyfiContracts.connector.connect(deployer).addCouncil(signer.address);
  });

  // TODO
  // 1. validate abToken status
  // 2. validate amount
  context('when the CSP minted the asset bond token', async () => {
    beforeEach('The collateral service provider minted the asset bond', async () => {
      await elyfiContracts.tokenizer
        .connect(CSP)
        .mintAssetBond(CSP.address, testAssetBondData.tokenId);
    });
    it('reverts if the asset bond is not settled', async () => {
      await expect(
        elyfiContracts.moneyPool
          .connect(CSP)
          .borrow(elyfiContracts.underlyingAsset.address, testAssetBondData.tokenId)
      ).to.be.revertedWith('OnlySignedTokenBorrowAllowed');
    });

    context('when the asset bond token is settled', async () => {
      beforeEach('The collateral service provider settled the asset bond', async () => {
        await settleAssetBond({
          tokenizer: elyfiContracts.tokenizer,
          txSender: CSP,
          settleArguments: testAssetBondData,
        });
        await elyfiContracts.tokenizer
          .connect(CSP)
          .approve(elyfiContracts.moneyPool.address, testAssetBondData.tokenId);
      });
      it('reverts if the asset bond is not signed', async () => {
        await expect(
          elyfiContracts.moneyPool
            .connect(CSP)
            .borrow(elyfiContracts.underlyingAsset.address, testAssetBondData.tokenId)
        ).to.be.revertedWith('OnlySignedTokenBorrowAllowed');
      });

      context('when the asset bond token is signed', async () => {
        beforeEach('The signer signed asset bond', async () => {
          const signerOpinionHash = 'test opinion hash';
          await elyfiContracts.tokenizer
            .connect(signer)
            .signAssetBond(testAssetBondData.tokenId, signerOpinionHash);
        });

        it('reverts if the moneypool is paused', async () => {
          await elyfiContracts.moneyPool
            .connect(deployer)
            .pauseMoneyPool(elyfiContracts.underlyingAsset.address);
          await expect(
            elyfiContracts.moneyPool
              .connect(otherCSP)
              .borrow(elyfiContracts.underlyingAsset.address, testAssetBondData.tokenId)
          ).to.be.revertedWith('ReservePaused');
        });

        it('reverts if the moneypool is deactivated', async () => {
          await elyfiContracts.moneyPool
            .connect(deployer)
            .deactivateMoneyPool(elyfiContracts.underlyingAsset.address);
          await expect(
            elyfiContracts.moneyPool
              .connect(otherCSP)
              .borrow(elyfiContracts.underlyingAsset.address, testAssetBondData.tokenId)
          ).to.be.revertedWith('ReserveInactivated');
        });

        it('reverts if the caller is not the asset bond owner', async () => {
          await expect(
            elyfiContracts.moneyPool
              .connect(otherCSP)
              .borrow(elyfiContracts.underlyingAsset.address, testAssetBondData.tokenId)
          ).to.be.revertedWith('OnlyOwnerBorrowAllowed');
        });

        it('reverts if liquidity is insufficient', async () => {
          await expect(
            elyfiContracts.moneyPool
              .connect(CSP)
              .borrow(elyfiContracts.underlyingAsset.address, testAssetBondData.tokenId)
          ).to.be.revertedWith('NotEnoughLiquidity');
        });

        context('when liquidity is sufficient', async () => {
          beforeEach('Additional liquidity supplied ', async () => {
            await elyfiContracts.underlyingAsset
              .connect(depositor)
              .approve(elyfiContracts.moneyPool.address, RAY);
            const tx = await elyfiContracts.moneyPool
              .connect(depositor)
              .deposit(
                elyfiContracts.underlyingAsset.address,
                depositor.address,
                testAssetBondData.debtCeiling
              );
          });

          it('reverts if the current timestamp is less than loanStartTimestamp', async () => {
            await expect(
              elyfiContracts.moneyPool
                .connect(CSP)
                .borrow(elyfiContracts.underlyingAsset.address, testAssetBondData.tokenId)
            ).to.be.revertedWith('NotTimeForLoanStart');
          });

          context('when time passes', async () => {
            let snapshotId: string;
            let loanStartTimestamp: BigNumber;
            beforeEach('time passes', async () => {
              snapshotId = await saveEVMSnapshot();

              const tx = await elyfiContracts.moneyPool
                .connect(depositor)
                .deposit(
                  elyfiContracts.underlyingAsset.address,
                  depositor.address,
                  testAssetBondData.debtCeiling
                );

              loanStartTimestamp = toTimestamp(
                testAssetBondData.loanStartTimeYear,
                testAssetBondData.loanStartTimeMonth,
                testAssetBondData.loanStartTimeDay
              );
              await advanceTimeTo(await getTimestamp(tx), loanStartTimestamp);
            });

            afterEach('', async () => {
              await revertFromEVMSnapshot(snapshotId);
            });

            it('update borrower balance and reserve and user data after borrow', async () => {
              const [reserveDataBefore, userDataBefore] = await takeDataSnapshot(
                CSP,
                elyfiContracts
              );
              const amount = testAssetBondData.principal;

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

              const assetBondData = await elyfiContracts.tokenizer.getAssetBondData(
                testAssetBondData.tokenId
              );
              expect(assetBondData.state).to.be.equal(AssetBondState.COLLATERALIZED);
              expect(assetBondData.interestRate).to.be.equal(reserveDataBefore.borrowAPY);
              expect(assetBondData.collateralizeTimestamp).to.be.equal(await getTimestamp(tx));
              expect(await elyfiContracts.tokenizer.ownerOf(testAssetBondData.tokenId)).to.be.equal(
                elyfiContracts.moneyPool.address
              );
              expect(reserveDataAfter).deepEqualWithBigNumber(expectedReserveData);
              expect(userDataAfter).deepEqualWithBigNumber(expectedUserData);
            });

            it('reverts if asset bond outdated for borrowing', async () => {
              await advanceTimeTo(
                loanStartTimestamp,
                loanStartTimestamp.add(BigNumber.from(SECONDSPERDAY).div(4).mul(3))
              );
              await expect(
                elyfiContracts.moneyPool
                  .connect(CSP)
                  .borrow(elyfiContracts.underlyingAsset.address, testAssetBondData.tokenId)
              ).to.be.revertedWith('TimeOutForCollateralize');
            });
          });
        });
      });
    });
  });
});
