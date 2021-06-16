import { BigNumber } from 'ethers';
import { ModifiableContract, ModifiableContractFactory, smoddit } from '@eth-optimism/smock';
import {
  address,
  advanceBlock,
  advanceTime,
  getTimestamp,
  toIndex,
  toRate,
} from '../utils/Ethereum';
import { calculateLinearInterest } from '../utils/Math';
import { expect } from 'chai';

describe('Index', () => {
  let indexMock: ModifiableContract;
  let indexMockFactory: ModifiableContractFactory;
  let underlyingAssetAddress: string;

  underlyingAssetAddress = address(1);

  // BigNumber below 2^53 allowed in smodify
  // toString need refactor
  const testData = {
    lTokenInterestIndex: toIndex(1).toString(),
    borrowAPY: toRate(0.15).toString(),
    depositAPY: toRate(0.2).toString(),
    lastUpdateTimestamp: BigNumber.from(0),
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
    await advanceTime(100);
    const updateTx = await indexMock.updateState(underlyingAssetAddress);
    const data = await indexMock.getReserveData(underlyingAssetAddress);

    expect(
      data.lTokenInterestIndex.sub(
        calculateLinearInterest(
          BigNumber.from(testData.depositAPY),
          testData.lastUpdateTimestamp,
          await getTimestamp(updateTx)
        )
      )
    ).to.be.within(-(10 ** 7), 10 ** 7);
  });
});
