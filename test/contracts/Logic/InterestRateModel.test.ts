import { expect } from 'chai';
import { ethers, waffle } from 'hardhat';
import ElyfiContracts from '../../types/ElyfiContracts';
import { setupAllContracts } from '../../utils/makeContract';
import { testInterestModelParams } from '../../utils/testData';

describe('Rate', () => {
  let elyfiContracts: ElyfiContracts;

  const provider = waffle.provider;
  const [deployer] = provider.getWallets();

  beforeEach(async () => {
    elyfiContracts = await setupAllContracts();
  });

  it('returns base rates at 0% utilization rate', async () => {
    // [vars.newBorrowAPY, vars.newDepositAPY)
    const lTokenAssetBalance = await elyfiContracts.underlyingAsset.balanceOf(
      elyfiContracts.lToken.address
    );
    const [borrowAPY, depositAPY] = await elyfiContracts.interestRateModel.calculateRates(
      lTokenAssetBalance,
      0,
      0,
      0,
      0
    );

    expect(borrowAPY).to.be.equal(testInterestModelParams.borrowRateBase);
    expect(depositAPY).to.be.equal(0);
  });

  it('returns optimal rates at optimal utilization rate', async () => {
    await elyfiContracts.underlyingAsset
      .connect(deployer)
      .transfer(elyfiContracts.lToken.address, ethers.utils.parseEther('2'));
    const lTokenAssetBalance = await elyfiContracts.underlyingAsset.balanceOf(
      elyfiContracts.lToken.address
    );

    const [borrowAPY] = await elyfiContracts.interestRateModel.calculateRates(
      lTokenAssetBalance,
      ethers.utils.parseEther('8'),
      0,
      0,
      0
    );

    expect(borrowAPY).to.be.equal(testInterestModelParams.borrowRateOptimal);
  });

  it('returns optimal rates at optimal utilization rate with borrowing', async () => {
    await elyfiContracts.underlyingAsset
      .connect(deployer)
      .transfer(elyfiContracts.lToken.address, ethers.utils.parseEther('3'));
    const lTokenAssetBalance = await elyfiContracts.underlyingAsset.balanceOf(
      elyfiContracts.lToken.address
    );

    const [borrowAPY] = await elyfiContracts.interestRateModel.calculateRates(
      lTokenAssetBalance,
      ethers.utils.parseEther('8'),
      0,
      ethers.utils.parseEther('1'), //utilization rate after borrow '1' = 8/(8+(3-'1'))
      0
    );

    expect(borrowAPY).to.be.equal(testInterestModelParams.borrowRateOptimal);
  });

  it('returns optimal rates at optimal utilization rate with deposit', async () => {
    await elyfiContracts.underlyingAsset
      .connect(deployer)
      .transfer(elyfiContracts.lToken.address, ethers.utils.parseEther('1'));
    const lTokenAssetBalance = await elyfiContracts.underlyingAsset.balanceOf(
      elyfiContracts.lToken.address
    );

    const [borrowAPY] = await elyfiContracts.interestRateModel.calculateRates(
      lTokenAssetBalance,
      ethers.utils.parseEther('8'),
      ethers.utils.parseEther('1'), //utilization rate after deposit '1' = 8/(8+(1+1))
      0,
      0
    );

    expect(borrowAPY).to.be.equal(testInterestModelParams.borrowRateOptimal);
  });
});
