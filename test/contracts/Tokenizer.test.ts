import { BigNumber, constants, utils, Wallet } from 'ethers';
import { ethers, waffle } from 'hardhat';
import { makeAllContracts } from '../utils/makeContract';
import { expect } from 'chai';
import ElyfiContracts from '../types/ElyfiContracts';
import { settleAssetBond } from '../utils/Helpers';
import { SECONDSPERDAY } from '../utils/constants';
import AssetBondState from '../types/AssetBondState';
import { toTimestamp } from '../utils/time';
import { testAssetBondData } from './../utils/testData';

describe('Tokenizer', () => {
  let elyfiContracts: ElyfiContracts;

  const provider = waffle.provider;
  const [deployer, depositor, CSP, borrower, signer, account] = provider.getWallets();

  testAssetBondData.borrower = borrower.address;
  testAssetBondData.signer = signer.address;
  const signerOpinionHash: string = 'test hash';

  beforeEach('Governance added roles to each participant', async () => {
    elyfiContracts = await makeAllContracts();

    await elyfiContracts.underlyingAsset
      .connect(deployer)
      .transfer(depositor.address, utils.parseEther('1000'));
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
        ).to.be.revertedWith('OnlyCollateralServiceProvider');
      });
    });

    context('when an account has collateral service provider role', async () => {
      context('when the token id is invalid', async () => {
        it('reverts if the latitude is invalid');
        it('reverts if the longitude is invalid');
        it('reverts when the latitude in token id is invalid');
      });

      context('when the token id is vaild', async () => {
        it('reverts if the token receiver is not collateral service provider', async () => {
          await expect(
            elyfiContracts.tokenizer
              .connect(CSP)
              .mintAssetBond(account.address, testAssetBondData.tokenId)
          ).to.be.revertedWith('MintedAssetBondReceiverNotAllowed');
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
        it('mints asset bond to receiver who has CSP role and saves minter', async () => {
          await elyfiContracts.connector
            .connect(deployer)
            .addCollateralServiceProvider(account.address);

          await expect(
            elyfiContracts.tokenizer
              .connect(CSP)
              .mintAssetBond(account.address, testAssetBondData.tokenId.add(1))
          ).to.emit(elyfiContracts.tokenizer, 'EmptyAssetBondMinted');
          expect(
            await elyfiContracts.tokenizer.getMinter(testAssetBondData.tokenId.add(1))
          ).to.be.equal(CSP.address);
          expect(
            await elyfiContracts.tokenizer.ownerOf(testAssetBondData.tokenId.add(1))
          ).to.be.equal(account.address);
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
        await elyfiContracts.connector.connect(deployer).addCollateralServiceProvider(CSP.address);
        await expect(
          settleAssetBond({
            tokenizer: elyfiContracts.tokenizer,
            txSender: account,
            settleArguments: testAssetBondData,
          })
        ).to.be.revertedWith('OnlyOwnerHasAuthrotyToSettle');
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
        ).to.be.revertedWith('AssetBondAlreadySettled');
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
          ).to.be.revertedWith('SettledLoanStartTimestampInvalid');
        });
        it('reverts if the loan duration is 0', async () => {
          const invalidAssetBondData = { ...testAssetBondData };
          invalidAssetBondData.loanDuration = BigNumber.from(0);
          console.log('0', testAssetBondData.loanStartTimeYear.toString());

          expect(
            settleAssetBond({
              tokenizer: elyfiContracts.tokenizer,
              txSender: CSP,
              settleArguments: invalidAssetBondData,
            })
          ).to.be.revertedWith('LoanDurationInvalid');
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
        expect(assetBondData.overdueInterestRate).to.be.equal(
          testAssetBondData.overdueInterestRate
        );
        expect(assetBondData.loanStartTimestamp).to.be.equal(expectedLoanStartTimestamp);
        expect(assetBondData.collateralizeTimestamp).to.be.equal(constants.Zero);
        expect(assetBondData.maturityTimestamp).to.be.equal(expectedMaturityTimestamp);
        expect(assetBondData.liquidationTimestamp).to.be.equal(expectedLiquidationTimestamp);
        expect(assetBondData.ipfsHash).to.be.equal(testAssetBondData.ipfsHash);
        expect(assetBondData.signerOpinionHash).to.be.equal('');
      });
    });
  });

  context('Sign asset bond', async () => {
    beforeEach('Collateral Service Provider settled the asset bond properly', async () => {
      await elyfiContracts.tokenizer
        .connect(CSP)
        .mintAssetBond(CSP.address, testAssetBondData.tokenId);
    });

    it('reverts if the caller is not designated member', async () => {
      await expect(
        elyfiContracts.tokenizer
          .connect(account)
          .signAssetBond(testAssetBondData.tokenId, signerOpinionHash)
      ).to.be.revertedWith('');
    });

    context('when signer signs the asset bond but not settled', async () => {
      it('reverts if the token state is not SETTLED', async () => {
        await elyfiContracts.connector
          .connect(deployer)
          .revokeCollateralServiceProvider(CSP.address);
        await expect(
          settleAssetBond({
            tokenizer: elyfiContracts.tokenizer,
            txSender: CSP,
            settleArguments: testAssetBondData,
          })
        ).to.be.revertedWith('OnlySettledTokenSignAllowed');
      });

      context('when signer signs the settled asset bond', async () => {
        beforeEach('Collateral Service Provider settled the asset bond properly', async () => {
          await settleAssetBond({
            tokenizer: elyfiContracts.tokenizer,
            txSender: CSP,
            settleArguments: testAssetBondData,
          });
        });

        it('signs the asset bond properly', async () => {
          await elyfiContracts.tokenizer
            .connect(signer)
            .signAssetBond(testAssetBondData.tokenId, signerOpinionHash);

          const assetBondData = await elyfiContracts.tokenizer.getAssetBondData(
            testAssetBondData.tokenId
          );

          expect(assetBondData.state).to.be.equal(AssetBondState.CONFIRMED);
          expect(assetBondData.signerOpinionHash).to.be.equal(signerOpinionHash);
        });
      });
    });
  });
});
