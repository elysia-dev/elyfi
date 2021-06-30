import { ethers, waffle } from 'hardhat';
import ElyfiContracts from '../types/ElyfiContracts';
import { BigNumber, utils } from 'ethers';
require('../../assertions/equals.ts');

describe('', () => {
  let elyfiContracts: ElyfiContracts;
  let borrowTxTimestamp: BigNumber;

  const provider = waffle.provider;
  const [deployer, CSP, borrower, signer, liquidator] = provider.getWallets();
  context('deposit', async () => {
    it('updates index and timestamp after deposit', async () => {});
  });
  context('withdraw', async () => {
    it('updates index and timestamp after withdraw', async () => {});
  });
  context('claimReward', async () => {
    it('update userLastUpdateTimestamp and accured reward after claim reward', async () => {});
  });
});
