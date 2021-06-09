import { waffle } from 'hardhat';
import { expect } from 'chai';
import { getReserveData } from '../../utils/Helpers';
import { defaultReserveData } from '../../utils/Interfaces';
import ElyfiContracts from '../../types/ElyfiContracts';
import { makeAllContracts } from '../../utils/makeContract';
require('../../assertions/equals.ts');

describe('MoneyPool.addReserve', async () => {
  let elyfiContracts: ElyfiContracts

  const provider = waffle.provider;
  const [deployer] = provider.getWallets();

  beforeEach(async () => {
    elyfiContracts = await makeAllContracts(deployer)
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