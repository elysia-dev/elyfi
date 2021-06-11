import { BigNumber, utils } from 'ethers';
import { ethers, waffle } from 'hardhat';
import { makeAllContracts } from '../utils/makeContract';
import { expect } from 'chai';
import ElyfiContracts from '../types/ElyfiContracts';
import { AssetBondData, AssetBondState } from '../utils/Interfaces';
import { toRate } from '../utils/Ethereum';

describe('Tokenizer', () => {
  let elyfiContracts: ElyfiContracts;

  const provider = waffle.provider;
  const [deployer, investor, CSP, borrower, signer, account] = provider.getWallets();
  const abTokenId = '100100200300400';

  const testAssetBondArguements = {
    borrower: borrower.address,
    signer: signer.address,
    tokenId: abTokenId,
    principal: ethers.utils.parseEther('10'),
    debtCeiling: ethers.utils.parseEther('13'),
    couponRate: toRate(0.1),
    overdueInterestRate: toRate(0.03),
    loanDuration: 365,
    loanStartTimeYear: 2022,
    loanStartTimeMonth: 1,
    loanStartTimeDay: 1,
    ipfsHash: 'test',
  };

  beforeEach('add roles to each account', async () => {
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
          elyfiContracts.tokenizer.connect(account).mintAssetBond(CSP.address, abTokenId)
        ).to.be.reverted;
      });
    });

    context('when an account has collateral service provider role', async () => {
      it('reverts when token id already exists', async () => {
        await elyfiContracts.tokenizer.connect(CSP).mintAssetBond(CSP.address, abTokenId);
        await expect(
          elyfiContracts.tokenizer.connect(CSP).mintAssetBond(CSP.address, abTokenId)
        ).to.be.revertedWith('ERC721: token already minted');
      });
      context('when the token id is invalid', async () => {
        it('');
      });

      context('when the token id is vaild', async () => {
        it('reverts if the token receiver is not collateral service provider', async () => {
          await expect(
            elyfiContracts.tokenizer.connect(CSP).mintAssetBond(account.address, abTokenId)
          ).to.be.reverted;
        });
        it('mints asset bond to oneself and saves minter', async () => {
          await expect(
            elyfiContracts.tokenizer.connect(CSP).mintAssetBond(CSP.address, abTokenId)
          ).to.emit(elyfiContracts.tokenizer, 'EmptyAssetBondMinted');
          expect(await elyfiContracts.tokenizer.getMinter(abTokenId)).to.be.equal(CSP.address);
          expect(await elyfiContracts.tokenizer.ownerOf(abTokenId)).to.be.equal(CSP.address);
          expect((await elyfiContracts.tokenizer.getAssetBondData(abTokenId)).state).to.be.equal(
            AssetBondState.EMPTY
          );
        });
        it('mints asset bond to receiver who has CSP role and saves minter', async () => {
          await elyfiContracts.connector
            .connect(deployer)
            .addCollateralServiceProvider(account.address);
          await expect(
            elyfiContracts.tokenizer.connect(CSP).mintAssetBond(account.address, abTokenId)
          ).to.emit(elyfiContracts.tokenizer, 'EmptyAssetBondMinted');
          expect(await elyfiContracts.tokenizer.getMinter(abTokenId)).to.be.equal(CSP.address);
          expect(await elyfiContracts.tokenizer.ownerOf(abTokenId)).to.be.equal(account.address);
          expect((await elyfiContracts.tokenizer.getAssetBondData(abTokenId)).state).to.be.equal(
            AssetBondState.EMPTY
          );
        });
      });
    });
  });
  context('Settle asset bond', async () => {
    it('reverts if the caller is not the owner', async () => {
      await expect(
        elyfiContracts.tokenizer
          .connect(CSP)
          .settleAssetBond(
            testAssetBondArguements.borrower,
            testAssetBondArguements.signer,
            testAssetBondArguements.tokenId,
            testAssetBondArguements.principal,
            testAssetBondArguements.debtCeiling,
            testAssetBondArguements.couponRate,
            testAssetBondArguements.overdueInterestRate,
            testAssetBondArguements.loanDuration,
            testAssetBondArguements.loanStartTimeYear,
            testAssetBondArguements.loanStartTimeMonth,
            testAssetBondArguements.loanStartTimeDay,
            testAssetBondArguements.ipfsHash
          )
      ).to.be.reverted;
    });
    context('when token owner settles asset bond informations', async () => { });
  });
});
