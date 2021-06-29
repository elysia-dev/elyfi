import { ethers, waffle } from 'hardhat';
import { advanceTimeTo, getTimestamp, toRate, toTimestamp } from '../utils/Ethereum';
import { expect } from 'chai';
import {
  expectAssetBondDataAfterLiquidate,
  expectReserveDataAfterLiquidate,
  expectUserDataAfterLiquidate,
} from '../utils/Expect';
import ElyfiContracts from '../types/ElyfiContracts';
import { BigNumber, utils } from 'ethers';
require('../../assertions/equals.ts');

describe('MoneyPool.liquidation', () => {
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
