import { utils } from 'ethers';
import { waffle } from 'hardhat';
import { makeAllContracts } from '../../utils/makeContract';
import { expect } from 'chai';
import ElyfiContracts from '../../types/ElyfiContracts';
import AssetBondState from '../../types/AssetBondState';
import { testAssetBondData } from '../../utils/testData';

describe('Tokenizer.mint', () => {
  let elyfiContracts: ElyfiContracts;

  const provider = waffle.provider;
  const [deployer, depositor, CSP, borrower, signer, account] = provider.getWallets();

  testAssetBondData.borrower = borrower.address;
  testAssetBondData.signer = signer.address;

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
});
