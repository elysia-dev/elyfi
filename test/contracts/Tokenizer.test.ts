import { BigNumber, utils, Wallet } from 'ethers';
import { ethers, waffle } from 'hardhat';
import { makeAllContracts } from '../utils/makeContract';
import { expect } from 'chai';
import ElyfiContracts from '../types/ElyfiContracts';
import { AssetBondData, AssetBondSettleData, AssetBondState } from '../utils/Interfaces';
import { toRate } from '../utils/Ethereum';
import { settleAssetBond } from '../utils/Helpers';
import { SECONDSPERDAY } from '../utils/constants';

describe('Tokenizer', () => {
  let elyfiContracts: ElyfiContracts;

  const provider = waffle.provider;
  const [deployer, investor, CSP, borrower, signer, account] = provider.getWallets();

  const testAssetBondData: AssetBondSettleData = <AssetBondSettleData>{
    ...(<AssetBondSettleData>{}),
    borrower: borrower.address,
    signer: signer.address,
    tokenId: BigNumber.from('100100200300400'),
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

  beforeEach('Governance added roles to each account', async () => {
    elyfiContracts = await makeAllContracts();

    await elyfiContracts.underlyingAsset
      .connect(deployer)
      .transfer(investor.address, utils.parseEther('1000'));
    await elyfiContracts.connector.connect(deployer).addCollateralServiceProvider(CSP.address);
    await elyfiContracts.connector.connect(deployer).addCouncil(signer.address);
  });

  context('Mint asset bond', async () => {
    context('when an account does not have an appropriate role', async () => {
      it('reverts when the general account mints', async () => {
        await expect(
          elyfiContracts.tokenizer
            .connect(account)
            .mintAssetBond(CSP.address, testAssetBondData.tokenId)
        ).to.be.reverted;
      });
    });

    context('when an account has collateral service provider role', async () => {
      it('reverts when token id already exists', async () => {
        await elyfiContracts.tokenizer
          .connect(CSP)
          .mintAssetBond(CSP.address, testAssetBondData.tokenId);
        await expect(
          elyfiContracts.tokenizer
            .connect(CSP)
            .mintAssetBond(CSP.address, testAssetBondData.tokenId)
        ).to.be.revertedWith('ERC721: token already minted');
      });
      context('when the token id is invalid', async () => {
        it('');
      });

      context('when the token id is vaild', async () => {
        it('reverts if the token receiver is not collateral service provider', async () => {
          await expect(
            elyfiContracts.tokenizer
              .connect(CSP)
              .mintAssetBond(account.address, testAssetBondData.tokenId)
          ).to.be.reverted;
        });
        it('mints asset bond to oneself and saves minter', async () => {
          await expect(
            elyfiContracts.tokenizer
              .connect(CSP)
              .mintAssetBond(CSP.address, testAssetBondData.tokenId)
          ).to.emit(elyfiContracts.tokenizer, 'EmptyAssetBondMinted');
          expect(await elyfiContracts.tokenizer.getMinter(testAssetBondData.tokenId)).to.be.equal(
            CSP.address
          );
          expect(await elyfiContracts.tokenizer.ownerOf(testAssetBondData.tokenId)).to.be.equal(
            CSP.address
          );
          expect(
            (await elyfiContracts.tokenizer.getAssetBondData(testAssetBondData.tokenId)).state
          ).to.be.equal(AssetBondState.EMPTY);
        });
        it('mints asset bond to receiver who has CSP role and saves minter', async () => {
          await elyfiContracts.connector
            .connect(deployer)
            .addCollateralServiceProvider(account.address);
          await expect(
            elyfiContracts.tokenizer
              .connect(CSP)
              .mintAssetBond(account.address, testAssetBondData.tokenId)
          ).to.emit(elyfiContracts.tokenizer, 'EmptyAssetBondMinted');
          expect(await elyfiContracts.tokenizer.getMinter(testAssetBondData.tokenId)).to.be.equal(
            CSP.address
          );
          expect(await elyfiContracts.tokenizer.ownerOf(testAssetBondData.tokenId)).to.be.equal(
            account.address
          );
          expect(
            (await elyfiContracts.tokenizer.getAssetBondData(testAssetBondData.tokenId)).state
          ).to.be.equal(AssetBondState.EMPTY);
        });
      });
    });
  });
  context('Settle asset bond', async () => {
    beforeEach('Collateral Service Provider minted the empty asset bond', async () => {
      await elyfiContracts.tokenizer
        .connect(CSP)
        .mintAssetBond(CSP.address, testAssetBondData.tokenId);
    });
    it('reverts if the caller is not the owner.', async () => {
      await expect(
        settleAssetBond({
          tokenizer: elyfiContracts.tokenizer,
          txSender: account,
          settleArguments: testAssetBondData,
        })
      ).to.be.reverted;
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
        ).to.be.reverted;
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
        ).to.be.reverted;
      });
      context('when token owner settles asset bond but the informations are invalid', async () => {
        it('reverts if block.timestamp exceeds loan start timestamp exceeds', async () => {
          const invalidAssetBondData = testAssetBondData;
          invalidAssetBondData.loanStartTimeYear = BigNumber.from(2021);
          expect(
            settleAssetBond({
              tokenizer: elyfiContracts.tokenizer,
              txSender: CSP,
              settleArguments: invalidAssetBondData,
            })
          ).to.be.reverted;
        });
        it('reverts if loan duration is 0', async () => {
          const invalidAssetBondData = testAssetBondData;
          invalidAssetBondData.loanDuration = BigNumber.from(0);
          expect(
            settleAssetBond({
              tokenizer: elyfiContracts.tokenizer,
              txSender: CSP,
              settleArguments: invalidAssetBondData,
            })
          ).to.be.reverted;
        });
      });
      it('settles data properly', async () => {
        const settleTx = await settleAssetBond({
          tokenizer: elyfiContracts.tokenizer,
          txSender: CSP,
          settleArguments: testAssetBondData,
        });
        const expectedLoanStartTimestamp =
          Date.UTC(
            testAssetBondData.loanStartTimeYear.toNumber(),
            testAssetBondData.loanStartTimeMonth.toNumber(),
            testAssetBondData.loanStartTimeDay.toNumber()
          ) / 1000;
        console.log(expectedLoanStartTimestamp);
        const expectedMaturityTimestamp =
          expectedLoanStartTimestamp + testAssetBondData.loanDuration.mul(SECONDSPERDAY).toNumber();
        const expectedLiquidationTimestamp =
          expectedMaturityTimestamp + BigNumber.from(10).mul(SECONDSPERDAY).toNumber();
        const assetBondData = await elyfiContracts.tokenizer.getAssetBondData(
          testAssetBondData.tokenId
        );
        console.log(assetBondData.state);
        expect(assetBondData.state).to.be.equal(AssetBondState.SETTLED);
        expect(assetBondData.borrower).to.be.equal(testAssetBondData.borrower);
        expect(assetBondData.signer).to.be.equal(testAssetBondData.signer);
        expect(assetBondData.collateralServiceProvider).to.be.equal(CSP.address);
        expect(assetBondData.principal).to.be.equal(testAssetBondData.principal);
        expect(assetBondData.debtCeiling).to.be.equal(testAssetBondData.debtCeiling);
        expect(assetBondData.couponRate).to.be.equal(testAssetBondData.couponRate);
        expect(assetBondData.interestRate).to.be.equal(BigNumber.from(0));
        expect(assetBondData.overdueInterestRate).to.be.equal(
          testAssetBondData.overdueInterestRate
        );
        expect(assetBondData.loanStartTimestamp).to.be.equal(expectedLoanStartTimestamp);
        expect(assetBondData.collateralizeTimestamp).to.be.equal(BigNumber.from(0));
        expect(assetBondData.maturityTimestamp).to.be.equal(expectedMaturityTimestamp);
        expect(assetBondData.liquidationTimestamp).to.be.equal(expectedLiquidationTimestamp);
        expect(assetBondData.ipfsHash).to.be.equal(testAssetBondData.ipfsHash);
        expect(assetBondData.signerOpinionHash).to.be.equal('');
      });
    });
  });
});
