import { BigNumber } from 'ethers';
import { ethers, waffle } from 'hardhat'
import { ModifiableContract, ModifiableContractFactory, smockit, smoddit } from '@eth-optimism/smock'
import { address, advanceBlock, ETH, expandToDecimals, getTimestamp, RAY, toIndex, toRate } from './utils/Ethereum';
import { Connector, DTokenTest, ERC20Test, InterestRateModel, LTokenTest, MoneyPoolTest, Tokenizer, TokenizerTest } from '../typechain';
import { makeInterestRateModel, makeMoneyPool, makeLToken, makeDToken, makeUnderlyingAsset, makeConnector, makeTokenizer } from './utils/makeContract';
import { defaultReserveData } from './utils/Interfaces';
import { expect } from 'chai'

describe("Tokenizer", () => {
    let underlyingAsset: ERC20Test
    let connector: Connector
    let moneyPool: MoneyPoolTest
    let interestModel: InterestRateModel
    let lToken: LTokenTest
    let dToken: DTokenTest
    let tokenizer: TokenizerTest
    let tokenizerMock: ModifiableContract
    let tokenizerMockFactory: ModifiableContractFactory

    const provider = waffle.provider
    const [deployer, account1, account2] = provider.getWallets()

    beforeEach(async () => {
        underlyingAsset = await makeUnderlyingAsset({
            deployer: deployer,
        })

        connector = await makeConnector({
            deployer
        })

        moneyPool = await makeMoneyPool({
            deployer: deployer,
            connector: connector
        })

        interestModel = await makeInterestRateModel({
            deployer: deployer,
        })

        lToken = await makeLToken({
            deployer: deployer,
            moneyPool: moneyPool,
            underlyingAsset: underlyingAsset,
        })

        dToken = await makeDToken({
            deployer: deployer,
            moneyPool: moneyPool,
            underlyingAsset: underlyingAsset,
        })

        tokenizer = await makeTokenizer({
            deployer: deployer,
            moneyPool: moneyPool
        })

        await moneyPool.addNewReserve(
            underlyingAsset.address,
            lToken.address,
            dToken.address,
            interestModel.address,
            tokenizer.address
        )
    })

    describe("View Functions", async () => {
        beforeEach(async () => {
            tokenizerMockFactory = await smoddit('TokenizerTest');

            tokenizerMock = await tokenizerMockFactory.deploy();
            const initTx = await advanceBlock();

            await tokenizerMock.smodify.put({
                _averageATokenAPR: toRate(0.1),
                _totalATokenBalanceOfMoneyPool: expandToDecimals(100, 18),
                _lastUpdateTimestamp: await getTimestamp(initTx)
            })
        })

        it("Mints AToken and updates states", async () => {

        })
    })

    describe("Mint AToken", async () => {
        beforeEach(async () => {
        })

        it("Mints AToken and updates states", async () => {

        })
    })

})
