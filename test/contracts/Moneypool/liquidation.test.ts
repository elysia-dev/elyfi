import { ethers, waffle } from 'hardhat';
import { advanceTimeTo, getTimestamp, toRate, toTimestamp } from '../../utils/Ethereum';
import { expect } from 'chai';
import {
  expectAssetBondDataAfterLiquidate,
  expectReserveDataAfterLiquidate,
  expectUserDataAfterLiquidate,
} from '../../utils/Expect';
import ElyfiContracts from '../../types/ElyfiContracts';
import takeDataSnapshot from '../../utils/takeDataSnapshot';
import { BigNumber, utils } from 'ethers';
import loadFixture from '../../utils/loadFixture';
import utilizedMoneypool from '../../fixtures/utilizedMoneypool';
import { getAssetBondData, settleAssetBond } from '../../utils/Helpers';
import { AssetBondSettleData } from '../../utils/Interfaces';
import { calculateAssetBondLiquidationData } from '../../utils/Math';
require('../../assertions/equals.ts');

describe('MoneyPool.liquidation', () => {
  let elyfiContracts: ElyfiContracts;
  let borrowTxTimestamp: BigNumber;

  const provider = waffle.provider;
  const [deployer, CSP, borrower, signer, liquidator] = provider.getWallets();
  const testAssetBondData: AssetBondSettleData = <AssetBondSettleData>{
    ...(<AssetBondSettleData>{}),
    borrower: borrower.address,
    signer: signer.address,
    tokenId: BigNumber.from('1001002003004005'),
    principal: ethers.utils.parseEther('1'),
    debtCeiling: ethers.utils.parseEther('13'),
    couponRate: toRate(0.1),
    overdueInterestRate: toRate(0.03),
    loanDuration: BigNumber.from(365),
    loanStartTimeYear: BigNumber.from(2022),
    loanStartTimeMonth: BigNumber.from(0),
    loanStartTimeDay: BigNumber.from(1),
    ipfsHash: 'test',
  };

  before('The asset bond is collateralized properly', async () => {
    const fixture = await loadFixture(utilizedMoneypool);
    const signerOpinionHash = 'test opinion hash';
    elyfiContracts = fixture.elyfiContracts;

    await elyfiContracts.connector.connect(deployer).addCollateralServiceProvider(CSP.address);
    await elyfiContracts.connector
      .connect(deployer)
      .addCollateralServiceProvider(liquidator.address);
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
    const tx = await elyfiContracts.tokenizer
      .connect(CSP)
      .approve(elyfiContracts.moneyPool.address, testAssetBondData.tokenId);
    const loanStartTimestamp = toTimestamp(
      testAssetBondData.loanStartTimeYear,
      testAssetBondData.loanStartTimeMonth,
      testAssetBondData.loanStartTimeDay
    );
    await advanceTimeTo(await getTimestamp(tx), loanStartTimestamp);
    const borrowTx = await elyfiContracts.moneyPool
      .connect(CSP)
      .borrow(elyfiContracts.underlyingAsset.address, testAssetBondData.tokenId);
    borrowTxTimestamp = await getTimestamp(borrowTx);
  });

  it('reverts if the caller is not collateral service provider', async () => {
    await expect(
      elyfiContracts.moneyPool
        .connect(borrower)
        .liquidate(elyfiContracts.underlyingAsset.address, testAssetBondData.tokenId)
    ).to.be.reverted;
  });

  it('reverts if the asset bond state is not `NOT_PERFORMED` state', async () => {
    await expect(
      elyfiContracts.moneyPool
        .connect(liquidator)
        .liquidate(elyfiContracts.underlyingAsset.address, testAssetBondData.tokenId)
    ).to.be.reverted;
  });

  context('when the asset bond state is `NOT_PERFORMED`', async () => {
    before('Time passes', async () => {
      const assetBondData = await elyfiContracts.tokenizer.getAssetBondData(
        testAssetBondData.tokenId
      );
      await advanceTimeTo(borrowTxTimestamp, assetBondData.liquidationTimestamp);
    });
    it('reverts if the account balance is insufficient to liquidate', async () => {
      await expect(
        elyfiContracts.moneyPool
          .connect(liquidator)
          .liquidate(elyfiContracts.underlyingAsset.address, testAssetBondData.tokenId)
      ).to.be.reverted;
    });

    context('when the borrower has sufficient underlying asset', async () => {
      before('The account balance increases', async () => {
        await elyfiContracts.underlyingAsset
          .connect(deployer)
          .transfer(liquidator.address, utils.parseEther('10'));
        await elyfiContracts.underlyingAsset
          .connect(liquidator)
          .approve(elyfiContracts.moneyPool.address, utils.parseEther('10'));
      });

      it('update user data and reserve data', async () => {
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
        const liquidatorBalanceBefore = await elyfiContracts.underlyingAsset.balanceOf(
          liquidator.address
        );
        const collateralServiceProviderLTokenBalanceBefore = await elyfiContracts.lToken.balanceOf(
          CSP.address
        );

        const tx = await elyfiContracts.moneyPool
          .connect(liquidator)
          .liquidate(elyfiContracts.underlyingAsset.address, testAssetBondData.tokenId);

        const [reserveDataAfter, userDataAfter] = await takeDataSnapshot(borrower, elyfiContracts);

        const assetBondDataAfter = await getAssetBondData({
          underlyingAsset: elyfiContracts.underlyingAsset,
          dataPipeline: elyfiContracts.dataPipeline,
          tokenizer: elyfiContracts.tokenizer,
          tokenId: testAssetBondData.tokenId,
        });
        const liquidatorBalanceAfter = await elyfiContracts.underlyingAsset.balanceOf(
          liquidator.address
        );
        const collateralServiceProviderLTokenBalanceAfter = await elyfiContracts.lToken.balanceOf(
          CSP.address
        );

        const [accruedDebtOnMoneyPool, feeOnLiquidate] = calculateAssetBondLiquidationData(
          assetBondDataBefore,
          await getTimestamp(tx)
        );
        const totalRetrieveAmount = accruedDebtOnMoneyPool.add(feeOnLiquidate);

        const expectedReserveData = expectReserveDataAfterLiquidate({
          assetBondData: assetBondDataBefore,
          reserveData: reserveDataBefore,
          txTimestamp: await getTimestamp(tx),
        });
        const expectedUserData = expectUserDataAfterLiquidate({
          assetBondData: assetBondDataBefore,
          userDataBefore: userDataBefore,
          reserveDataAfter: reserveDataAfter,
          txTimestamp: await getTimestamp(tx),
        });
        const expectedAssetBondData = expectAssetBondDataAfterLiquidate({
          assetBondData: assetBondDataBefore,
          liquidator: liquidator,
        });

        expect(liquidatorBalanceAfter).to.be.equal(
          liquidatorBalanceBefore.sub(totalRetrieveAmount)
        );
        expect(collateralServiceProviderLTokenBalanceAfter).to.be.equal(
          collateralServiceProviderLTokenBalanceBefore.add(feeOnLiquidate)
        );
        expect(assetBondDataAfter).to.be.equalAssetBondData(expectedAssetBondData);
        expect(reserveDataAfter).equalReserveData(expectedReserveData);
        expect(userDataAfter).equalUserData(expectedUserData);
      });
    });
  });
});
