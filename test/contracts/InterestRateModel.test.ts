import { expect } from 'chai';
import { ethers, waffle } from 'hardhat';
import ElyfiContracts from '../types/ElyfiContracts';
import { defaultInterestModelParams } from '../utils/Interfaces';
import {
  makeAllContracts,
} from '../utils/makeContract';

describe('Rate', () => {
  let elyfiContracts: ElyfiContracts

  const provider = waffle.provider;
  const [deployer] = provider.getWallets();

  beforeEach(async () => {
    elyfiContracts = await makeAllContracts();
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

    expect(borrowAPR).to.be.equal(defaultInterestModelParams.borrowRateBase);
    expect(supplyAPR).to.be.equal(0);
  });

  it('returns optimal rates at optimal utilization rate', async () => {
    await elyfiContracts.underlyingAsset.connect(deployer).transfer(elyfiContracts.lToken.address, ethers.utils.parseEther('2'));
    const [borrowAPR] = await elyfiContracts.interestRateModel.calculateRates(
      elyfiContracts.underlyingAsset.address,
      elyfiContracts.lToken.address,
      ethers.utils.parseEther('8'),
      0,
      0,
      0,
      0
    );

    expect(borrowAPR).to.be.equal(defaultInterestModelParams.borrowRateOptimal);
  });

  it('returns optimal rates at optimal utilization rate with borrowing', async () => {
    await elyfiContracts.underlyingAsset.connect(deployer).transfer(elyfiContracts.lToken.address, ethers.utils.parseEther('3'));
    const [borrowAPR] = await elyfiContracts.interestRateModel.calculateRates(
      elyfiContracts.underlyingAsset.address,
      elyfiContracts.lToken.address,
      ethers.utils.parseEther('8'),
      0,
      ethers.utils.parseEther('1'), //utilization rate after borrow '1' = 8/(8+(3-'1'))
      0,
      0
    );

    expect(borrowAPR).to.be.equal(defaultInterestModelParams.borrowRateOptimal);
  });

  it('returns optimal rates at optimal utilization rate with investment', async () => {
    await elyfiContracts.underlyingAsset.connect(deployer).transfer(elyfiContracts.lToken.address, ethers.utils.parseEther('1'));
    const [borrowAPR] = await elyfiContracts.interestRateModel.calculateRates(
      elyfiContracts.underlyingAsset.address,
      elyfiContracts.lToken.address,
      ethers.utils.parseEther('8'),
      ethers.utils.parseEther('1'), //utilization rate after invest '1' = 8/(8+(1+1))
      0,
      0,
      0
    );

    expect(borrowAPR).to.be.equal(defaultInterestModelParams.borrowRateOptimal);
  });
});