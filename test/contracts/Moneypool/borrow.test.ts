import { ethers, waffle } from 'hardhat';
import { getTimestamp, toRate } from '../../utils/Ethereum';
import { expect } from 'chai';
import { expectReserveDataAfterBorrow, expectUserDataAfterBorrow } from '../../utils/Expect';
import ElyfiContracts from '../../types/ElyfiContracts';
import takeDataSnapshot from '../../utils/takeDataSnapshot';
import { BigNumber, utils } from 'ethers';
import loadFixture from '../../utils/loadFixture';
import utilizedMoneypool from '../../fixtures/utilizedMoneypool';
import { AssetBondSettleData } from '../../utils/Interfaces';
import { settleAssetBond } from '../../utils/Helpers';
require('../../assertions/equals.ts');

describe('MoneyPool.borrow', () => {
  let elyfiContracts: ElyfiContracts;

  const provider = waffle.provider;
  const [deployer, depositor, CSP, borrower, signer, otherCSP] = provider.getWallets();

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

  before(async () => {
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
    before(async () => {
      console.log(1);
      await elyfiContracts.tokenizer
        .connect(CSP)
        .mintAssetBond(CSP.address, testAssetBondData.tokenId);
    });
    it('reverts if the asset bond is not settled', async () => {
      await expect(
        elyfiContracts.moneyPool
          .connect(CSP)
          .borrow(elyfiContracts.underlyingAsset.address, testAssetBondData.tokenId)
      ).to.be.reverted;
    });

    context('when the asset bond token is settled', async () => {
      before(async () => {
        console.log(2);
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
        ).to.be.reverted;
      });

      context('when the asset bond token is signed', async () => {
        before(async () => {
          const signerOpinionHash = 'test opinion hash';
          await elyfiContracts.tokenizer
            .connect(signer)
            .signAssetBond(testAssetBondData.tokenId, signerOpinionHash);
        });

        it('reverts if the caller is not the asset bond owner', async () => {
          await expect(
            elyfiContracts.moneyPool
              .connect(otherCSP)
              .borrow(elyfiContracts.underlyingAsset.address, testAssetBondData.tokenId)
          ).to.be.reverted;
        });
        it('reverts if the moneypool liquidity is insufficient', async () => {});

        context('when moneypool liquidity is sufficient', async () => {
          it('update borrower balance and reserve and user data', async () => {
            const [reserveDataBefore, userDataBefore] = await takeDataSnapshot(CSP, elyfiContracts);
            const amount = testAssetBondData.principal;

            const tx = await elyfiContracts.moneyPool.connect(CSP);

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
        });
      });
    });
  });
});
