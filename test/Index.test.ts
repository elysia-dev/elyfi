import { BigNumber } from 'ethers';
import { ethers, waffle } from 'hardhat';
import {
  ModifiableContract,
  ModifiableContractFactory,
  smockit,
  smoddit,
} from '@eth-optimism/smock';
import {
  address,
  advanceBlock,
  advanceTime,
  ETH,
  expandToDecimals,
  getTimestamp,
  toIndex,
  toRate,
} from './utils/Ethereum';
import { DTokenTest__factory } from '../typechain';
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
    dTokenInterestIndex: toIndex(1).toString(),
    realAssetAPR: toRate(0.15).toString(),
    digitalAssetAPR: toRate(0.1).toString(),
    supplyAPR: toRate(0.2).toString(),
    lastUpdateTimestamp: BigNumber.from(0),
    dTokenAddress: '',
  };

  const dTokenImplicitTotalSupply = BigNumber.from(10000);

  beforeEach(async () => {
    const dTokenFactory = (await ethers.getContractFactory(
      'DTokenTest',
      deployer
    )) as DTokenTest__factory;
    const dTokenMock = await smockit(dTokenFactory);

    testData.dTokenAddress = dTokenMock.address;

    indexMockFactory = await smoddit('IndexTest');

    indexMock = await indexMockFactory.deploy();

    // contract mocking
    dTokenMock.smocked.implicitTotalSupply.will.return.with(dTokenImplicitTotalSupply);

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
          BigNumber.from(testData.supplyAPR),
          testData.lastUpdateTimestamp,
          await getTimestamp(updateTx)
        )
      )
    ).to.be.within(-(10 ** 7), 10 ** 7);

    // dTokenIndex
    expect(
      data[1].sub(
        calculateCompoundedInterest(
          BigNumber.from(testData.digitalAssetAPR),
          testData.lastUpdateTimestamp,
          await getTimestamp(updateTx)
        )
      )
    ).to.be.within(-(10 ** 7), 10 ** 7);
  });
});
