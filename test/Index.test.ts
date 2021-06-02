import { BigNumber } from 'bignumber.js';
import { ethers, waffle } from 'hardhat';
import { ModifiableContract, ModifiableContractFactory, smoddit } from '@eth-optimism/smock';
import {
  address,
  advanceBlock,
  advanceTime,
  getTimestamp,
  toIndex,
  toRate,
} from './utils/Ethereum';
import { calculateCompoundedInterest, calculateLinearInterest } from './utils/Math';
import { expect } from 'chai';

describe('Index', () => {
  let indexMock: ModifiableContract;
  let indexMockFactory: ModifiableContractFactory;
  let underlyingAssetAddress: string;

  const provider = waffle.provider;
  const [deployer, account1, account2] = provider.getWallets();

  underlyingAssetAddress = address(1);

  // BigNumber below 2^53 allowed in smodify
  // toString need refactor
  const testData = {
    lTokenInterestIndex: toIndex(1).toString(),
    borrowAPR: toRate(0.15).toString(),
    supplyAPR: toRate(0.2).toString(),
    lastUpdateTimestamp: new BigNumber(0),
  };

  beforeEach(async () => {
    indexMockFactory = await smoddit('IndexTest');

    indexMock = await indexMockFactory.deploy();

    const initTx = await advanceBlock();
    testData.lastUpdateTimestamp = await getTimestamp(initTx);

    // smoddit 'put' returns nothing, not evm interaction
    await indexMock.smodify.put({
      _reserves: {
        [underlyingAssetAddress]: testData,
      },
    });
  });

  it('Updates Indexes', async () => {
    const advanceTimeTx = await advanceTime(100);
    const updateTx = await indexMock.updateState(underlyingAssetAddress);
    const data = await indexMock.getReserveData(underlyingAssetAddress);

    // lTokenIndex
    expect(
      data[0].sub(
        calculateLinearInterest(
          new BigNumber(testData.supplyAPR),
          testData.lastUpdateTimestamp,
          await getTimestamp(updateTx)
        )
      )
    ).to.be.within(-(10 ** 7), 10 ** 7);

    // dTokenIndex
    expect(
      data[1].sub(
        calculateCompoundedInterest(
          new BigNumber(testData.borrowAPR),
          testData.lastUpdateTimestamp,
          await getTimestamp(updateTx)
        )
      )
    ).to.be.within(-(10 ** 7), 10 ** 7);
  });
});
