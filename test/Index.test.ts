import { ethers, waffle } from 'hardhat'
import { smockit, smoddit } from '@eth-optimism/smock'
import { address, advanceBlock, advanceTime, ETH, expandToDecimals, getTimestamp, toIndex, toRate } from './utils/Ethereum';
import { DTokenTest, DTokenTest__factory, ERC20Test, LTokenTest, MoneyPoolTest } from '../typechain';
import { makeDToken, makeLToken, makeMoneyPool, makeUnderlyingAsset } from './utils/makeContract';
import { BigNumber, Contract } from 'ethers';
import { calculateCompoundedInterest, calculateLinearInterest } from './utils/Math';
import { expect } from 'chai';
import BN from 'bn.js'

chai.use(require('chai-bn')(BN));

describe("Index", () => {
    let indexMock: Contract
    let underlyingAssetAddress: string

    const provider = waffle.provider
    const [deployer, account1, account2] = provider.getWallets()

    underlyingAssetAddress = address(1)

    // BigNumber below 2^53 allowed in smodify
    // toString need refactor
    const testData = {
        lTokenInterestIndex: toIndex(1).toString(),
        dTokenInterestIndex: toIndex(1).toString(),
        realAssetAPR: toRate(0.15).toString(),
        digitalAssetAPR: toRate(0.1).toString(),
        supplyAPR: toRate(0.2).toString(),
        lastUpdateTimestamp: BigNumber.from(0),
        dTokenAddress: ""
    }

    beforeEach(async () => {
        const dTokenFactory = (await ethers.getContractFactory(
            "DTokenTest",
            deployer
            )) as DTokenTest__factory
        const dTokenMock = await smockit(dTokenFactory)

        testData.dTokenAddress = dTokenMock.address

        const IndexMockFactory = await smoddit('IndexMock');
        indexMock = await IndexMockFactory.deploy()

        const dTokenImplicitTotalSupply = BigNumber.from(10000)

        dTokenMock.smocked.implicitTotalSupply.will.return.with(dTokenImplicitTotalSupply)

        const initTx = await advanceBlock()
        testData.lastUpdateTimestamp = await getTimestamp(initTx)

        await indexMock.smodify.put({
            _reserves: {
                [underlyingAssetAddress]: testData
            }
        })
        })

    it("Updates Indexes", async () => {
        // put returns nothing, not evm interaction
        const advanceTimeTx = await advanceTime(100)
        const updateTx = await indexMock.updateState(underlyingAssetAddress)
        const data = await indexMock.getReserveData(underlyingAssetAddress);

        // lTokenIndex
        expect(data[0]).to.be.equal(
            calculateLinearInterest(
                BigNumber.from(testData.supplyAPR),
                testData.lastUpdateTimestamp,
                await getTimestamp(updateTx))
        )
        // dTokenIndex
        expect(data[1]).to.be.equal(
            calculateCompoundedInterest(
                BigNumber.from(testData.digitalAssetAPR),
                testData.lastUpdateTimestamp,
                await getTimestamp(updateTx))
        )
    })
})
