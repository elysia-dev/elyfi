import { expect } from 'chai';
import { ethers, waffle } from 'hardhat';
import ElyfiContracts from '../types/ElyfiContracts';
import { expandToDecimals, toRate } from '../utils/Ethereum';
import { defaultInterestModelParams } from '../utils/Interfaces';
import {
  makeAllContracts,
} from '../utils/makeContract';

describe('Rate', () => {
  let elyfiContracts: ElyfiContracts

  const provider = waffle.provider;
  const [deployer] = provider.getWallets();

  beforeEach(async () => {
    elyfiContracts = await makeAllContracts(deployer);
  });

  it('returns base rates at 0% utilization rate', async () => {
    // [vars.newBorrowAPR, vars.newSupplyAPR)
    const [borrowAPR, supplyAPR] = await elyfiContracts.interestRateModel.calculateRates(
      elyfiContracts.underlyingAsset.address,
      elyfiContracts.lToken.address,
      0,
      0,
      0,
      0,
      0
    );

    expect(borrowAPR).to.be.equal(ethers.BigNumber.from(defaultInterestModelParams.borrowRateBase.toFixed()));
    expect(supplyAPR).to.be.equal(0);
  });

  it('returns optimal rates at optimal utilization rate', async () => {
    await elyfiContracts.underlyingAsset.connect(deployer).transfer(elyfiContracts.lToken.address, expandToDecimals(2, 18));
    const [borrowAPR] = await elyfiContracts.interestRateModel.calculateRates(
      elyfiContracts.underlyingAsset.address,
      elyfiContracts.lToken.address,
      expandToDecimals(8, 18), //utilization rate = 8/(8+2)
      0,
      0,
      0,
      0
    );

    expect(borrowAPR).to.be.equal(ethers.BigNumber.from(defaultInterestModelParams.borrowRateOptimal.toFixed()));
  });

  it('returns optimal rates at optimal utilization rate with borrowing', async () => {
    await elyfiContracts.underlyingAsset.connect(deployer).transfer(elyfiContracts.lToken.address, expandToDecimals(3, 18));
    const [borrowAPR] = await elyfiContracts.interestRateModel.calculateRates(
      elyfiContracts.underlyingAsset.address,
      elyfiContracts.lToken.address,
      expandToDecimals(8, 18),
      0,
      expandToDecimals(1, 18), //utilization rate after borrow '1' = 8/(8+(3-'1'))
      0,
      0
    );

    expect(borrowAPR).to.be.equal(ethers.BigNumber.from(defaultInterestModelParams.borrowRateOptimal.toFixed()));
  });

  it('returns optimal rates at optimal utilization rate with investment', async () => {
    await elyfiContracts.underlyingAsset.connect(deployer).transfer(elyfiContracts.lToken.address, expandToDecimals(1, 18));
    const [borrowAPR] = await elyfiContracts.interestRateModel.calculateRates(
      elyfiContracts.underlyingAsset.address,
      elyfiContracts.lToken.address,
      expandToDecimals(8, 18),
      expandToDecimals(1, 18), //utilization rate after invest '1' = 8/(8+(1+1))
      0,
      0,
      0
    );

    expect(borrowAPR).to.be.equal(ethers.BigNumber.from(defaultInterestModelParams.borrowRateOptimal.toFixed()));
  });
});