import { expect } from 'chai';
import { getReserveData } from '../../utils/Helpers';
import { defaultReserveData } from '../../utils/Interfaces';
import ElyfiContracts from '../../types/ElyfiContracts';
import loadFixture from '../../utils/loadFixture';
import deployedAll from '../../fixtures/deployedAll';
require('../../assertions/equals.ts');

describe('MoneyPool.addReserve', async () => {
  let elyfiContracts: ElyfiContracts

  beforeEach(async () => {
    const fixture = await loadFixture(deployedAll);
    elyfiContracts = fixture.elyfiContracts;
  });

  it('sets reserveData properly', async () => {
    const initialContractReserveData = await getReserveData({
      underlyingAsset: elyfiContracts.underlyingAsset,
      dataPipeline: elyfiContracts.dataPipeline,
      lToken: elyfiContracts.lToken,
    });

    expect(initialContractReserveData.underlyingAssetName).to.be.equal(
      defaultReserveData.underlyingAssetName
    );
    expect(initialContractReserveData.underlyingAssetSymbol).to.be.equal(
      defaultReserveData.underlyingAssetSymbol
    );
  });
});