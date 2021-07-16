import { BigNumber, constants, utils, Wallet } from 'ethers';
import { ethers, waffle } from 'hardhat';
import { setupAllContracts } from '../../utils/setup';
import { expect } from 'chai';
import ElyfiContracts from '../../types/ElyfiContracts';
import { settleAssetBond } from '../../utils/Helpers';
import { SECONDSPERDAY } from '../../utils/constants';
import AssetBondState from '../../types/AssetBondState';
import { toTimestamp } from '../../utils/time';
import { testAssetBond } from '../../utils/testData';

describe('Tokenizer.settle', () => {
  let elyfiContracts: ElyfiContracts;

  const testAssetBondData = { ...testAssetBond };
  const provider = waffle.provider;
  const [deployer, depositor, CSP, borrower, signer, account] = provider.getWallets();

  testAssetBondData.borrower = borrower.address;
  testAssetBondData.signer = signer.address;

  beforeEach('Governance added roles to each participant', async () => {
    elyfiContracts = await setupAllContracts();

    await elyfiContracts.underlyingAsset
      .connect(deployer)
      .transfer(depositor.address, utils.parseEther('1000'));
    await elyfiContracts.connector.connect(deployer).addCollateralServiceProvider(CSP.address);
    await elyfiContracts.connector.connect(deployer).addCouncil(signer.address);
  });

  context('Settle asset bond', async () => {
    beforeEach('Collateral Service Provider minted the empty asset bond', async () => {
      await elyfiContracts.tokenizer
        .connect(CSP)
        .mintAssetBond(CSP.address, testAssetBondData.tokenId);
    });

    context('when token owner settles asset bond informations', async () => {
      it('reverts if the caller is the token owner but not the collateral service provider', async () => {
        await elyfiContracts.connector
          .connect(deployer)
          .revokeCollateralServiceProvider(CSP.address);
        await expect(
          settleAssetBond({
            tokenizer: elyfiContracts.tokenizer,
            txSender: CSP,
            settleArguments: testAssetBondData,
          })
        ).to.be.revertedWith('OnlyCollateralServiceProvider');
      });
      it('reverts if the caller is not the owner.', async () => {
        await elyfiContracts.connector
          .connect(deployer)
          .addCollateralServiceProvider(account.address);
        await expect(
          settleAssetBond({
            tokenizer: elyfiContracts.tokenizer,
            txSender: account,
            settleArguments: testAssetBondData,
          })
        ).to.be.revertedWith('OnlyOnwerCanSettle');
      });
      it('reverts if the state of asset bond is not empty', async () => {
        await settleAssetBond({
          tokenizer: elyfiContracts.tokenizer,
          txSender: CSP,
          settleArguments: testAssetBondData,
        });
        await expect(
          settleAssetBond({
            tokenizer: elyfiContracts.tokenizer,
            txSender: CSP,
            settleArguments: testAssetBondData,
          })
        ).to.be.revertedWith('AlreadySettled');
      });

      context('when token owner settles asset bond but the informations are invalid', async () => {
        it('reverts if the block.timestamp is greater than the loan start timestamp', async () => {
          const invalidAssetBondData = { ...testAssetBondData };
          invalidAssetBondData.loanStartTimeYear = BigNumber.from(2021);

          expect(
            settleAssetBond({
              tokenizer: elyfiContracts.tokenizer,
              txSender: CSP,
              settleArguments: invalidAssetBondData,
            })
          ).to.be.revertedWith('OnlySettledSigned');
        });
        it('reverts if the loan duration is 0', async () => {
          const invalidAssetBondData = { ...testAssetBondData };
          invalidAssetBondData.loanDuration = BigNumber.from(0);

          expect(
            settleAssetBond({
              tokenizer: elyfiContracts.tokenizer,
              txSender: CSP,
              settleArguments: invalidAssetBondData,
            })
          ).to.be.revertedWith('LoanDurationInvalid');
        });

        it('reverts if the signer is not council', async () => {
          const invalidAssetBondData = { ...testAssetBondData };
          invalidAssetBondData.signer = account.address;

          expect(
            settleAssetBond({
              tokenizer: elyfiContracts.tokenizer,
              txSender: CSP,
              settleArguments: invalidAssetBondData,
            })
          ).to.be.revertedWith('SignerIsNotCouncil');
        });
      });
      it('settles data properly', async () => {
        const settleTx = await settleAssetBond({
          tokenizer: elyfiContracts.tokenizer,
          txSender: CSP,
          settleArguments: testAssetBondData,
        });

        const expectedLoanStartTimestamp = toTimestamp(
          testAssetBondData.loanStartTimeYear,
          testAssetBondData.loanStartTimeMonth,
          testAssetBondData.loanStartTimeDay
        );
        const expectedMaturityTimestamp = expectedLoanStartTimestamp.add(
          testAssetBondData.loanDuration.mul(SECONDSPERDAY)
        );
        const expectedLiquidationTimestamp = expectedMaturityTimestamp.add(
          BigNumber.from(10).mul(SECONDSPERDAY)
        );
        const assetBondData = await elyfiContracts.tokenizer.getAssetBondData(
          testAssetBondData.tokenId
        );

        expect(assetBondData.state).to.be.equal(AssetBondState.SETTLED);
        expect(assetBondData.borrower).to.be.equal(testAssetBondData.borrower);
        expect(assetBondData.signer).to.be.equal(testAssetBondData.signer);
        expect(assetBondData.collateralServiceProvider).to.be.equal(CSP.address);
        expect(assetBondData.principal).to.be.equal(testAssetBondData.principal);
        expect(assetBondData.debtCeiling).to.be.equal(testAssetBondData.debtCeiling);
        expect(assetBondData.couponRate).to.be.equal(testAssetBondData.couponRate);
        expect(assetBondData.interestRate).to.be.equal(constants.Zero);
        expect(assetBondData.delinquencyRate).to.be.equal(testAssetBondData.delinquencyRate);
        expect(assetBondData.loanStartTimestamp).to.be.equal(expectedLoanStartTimestamp);
        expect(assetBondData.collateralizeTimestamp).to.be.equal(constants.Zero);
        expect(assetBondData.maturityTimestamp).to.be.equal(expectedMaturityTimestamp);
        expect(assetBondData.liquidationTimestamp).to.be.equal(expectedLiquidationTimestamp);
        expect(assetBondData.ipfsHash).to.be.equal(testAssetBondData.ipfsHash);
        expect(assetBondData.signerOpinionHash).to.be.equal('');
      });
    });
  });
});
