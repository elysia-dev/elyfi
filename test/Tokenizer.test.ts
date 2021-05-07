import { BigNumber } from 'ethers';
import { ethers, waffle } from 'hardhat'
import { smoddit } from '@eth-optimism/smock'
import { address, ETH, RAY, toIndex, toRate } from './utils/Ethereum';
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

    describe("MintABToken", async () => {
        it("", async () => {
        })
    })

    describe("Invest", async () => {
        it("Mints lToken and takes asset", async () => {
            await underlyingAsset.connect(deployer).approve(moneyPool.address, RAY)
            const investTx = await moneyPool.invest(
                underlyingAsset.address,
                deployer.address,
                10000
            )
            expect(await lToken.balanceOf(deployer.address)).to.be.equal(10000)
            expect(await underlyingAsset.balanceOf(lToken.address)).to.be.equal(10000)
        })
    })
})
