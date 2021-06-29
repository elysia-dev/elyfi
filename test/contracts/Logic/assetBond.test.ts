import { ethers, waffle } from 'hardhat';
import { makeAllContracts } from '../../utils/makeContract';
import { expect } from 'chai';
import ElyfiContracts from '../../types/ElyfiContracts';
import { AssetBondIdData } from '../../../misc/assetBond/types';
import { tokenIdGenerator } from '../../../misc/assetBond/generator';

describe('AssetBond', () => {
  let elyfiContracts: ElyfiContracts;

  const provider = waffle.provider;
  const [deployer, CSP] = provider.getWallets();

  const assetBondIdData: AssetBondIdData = {
    nonce: 0,
    countryCode: 82,
    collateralServiceProviderIdentificationNumber: 300104000,
    collateralLatitude: 3745612,
    collateralLatitudeSign: 1,
    collateralLongitude: 12695366,
    collateralLongitudeSign: 1,
    collateralDetail: 10010001,
    collateralCategory: 1,
    productNumber: 12,
  };

  const assetBondId = tokenIdGenerator(assetBondIdData);
  console.log(assetBondId.length);

  before('Governance added roles to each participant', async () => {
    elyfiContracts = await makeAllContracts();
    await elyfiContracts.connector.connect(deployer).addCollateralServiceProvider(CSP.address);
    await elyfiContracts.tokenizer.connect(CSP).mintAssetBond(CSP.address, assetBondId);
  });

  context('Asset bond id data', async () => {
    it('parser should return id data properly', async () => {
      const parsedTokenId = await elyfiContracts.tokenizer.getAssetBondIdData(assetBondId);
      expect(parsedTokenId.nonce).to.be.equal(assetBondIdData.nonce);
      expect(parsedTokenId.countryCode).to.be.equal(assetBondIdData.countryCode);
      expect(parsedTokenId.collateralServiceProviderIdentificationNumber).to.be.equal(
        assetBondIdData.collateralServiceProviderIdentificationNumber
      );
      expect(parsedTokenId.collateralLatitude).to.be.equal(assetBondIdData.collateralLatitude);
      expect(parsedTokenId.collateralLatitudeSign).to.be.equal(
        assetBondIdData.collateralLatitudeSign
      );
      expect(parsedTokenId.collateralLongitude).to.be.equal(assetBondIdData.collateralLongitude);
      expect(parsedTokenId.collateralLongitudeSign).to.be.equal(
        assetBondIdData.collateralLongitudeSign
      );
      expect(parsedTokenId.collateralDetail).to.be.equal(assetBondIdData.collateralDetail);
      expect(parsedTokenId.collateralCategory).to.be.equal(assetBondIdData.collateralCategory);
      expect(parsedTokenId.productNumber).to.be.equal(assetBondIdData.productNumber);
    });
  });
});
