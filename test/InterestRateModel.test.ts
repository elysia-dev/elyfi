import { expect } from 'chai';
import { ethers, waffle } from 'hardhat'
import { Connector, ERC20Test, InterestRateModel, LTokenTest, MoneyPoolTest } from '../typechain';
import { expandToDecimals } from './utils/Ethereum';
import { defaultInterestModelParams } from './utils/Interfaces';
import { makeConnector, makeInterestRateModel, makeLToken, makeMoneyPool, makeUnderlyingAsset } from './utils/makeContract';

describe("Rate", () => {
    let underlyingAsset: ERC20Test
    let connector: Connector
    let moneyPool: MoneyPoolTest
    let interestRateModel: InterestRateModel
    let lToken: LTokenTest

    const provider = waffle.provider
    const [deployer, account1, account2] = provider.getWallets()

    beforeEach(async () => {
        underlyingAsset = await makeUnderlyingAsset({
            deployer: deployer,
            totalSupply: expandToDecimals(10, 18)
        })

        connector = await makeConnector({
            deployer
        })

        moneyPool = await makeMoneyPool({
            deployer: deployer,
            connector: connector
        })

        interestRateModel = await makeInterestRateModel({
            deployer: deployer,
        })

        lToken = await makeLToken({
            deployer: deployer,
            moneyPool: moneyPool,
            underlyingAsset: underlyingAsset,
        })
    })

    it("Returns base rates at 0% utilization rate", async () => {
        // put returns nothing, not evm interaction
        const result = await interestRateModel.calculateRates(
            underlyingAsset.address,
            lToken.address,
            0,
            0,
            0,
            0,
            0,
            0
        )

        expect(result[0]).to.be.equal(defaultInterestModelParams.realAssetBorrowRateBase)
        expect(result[1]).to.be.equal(defaultInterestModelParams.digitalAssetBorrowRateBase)
        expect(result[2]).to.be.equal(0)
    })

    it("Returns optimal rates at optimal utilization rate", async () => {
        const result = await interestRateModel.calculateRates(
            underlyingAsset.address,
            lToken.address,
            expandToDecimals(8, 18), //utilization rate = (8+0)/10
            0,
            0,
            0,
            0,
            0
        )

        console.log(result)
        expect(result[0]).to.be.equal(defaultInterestModelParams.realAssetBorrowRateOptimal)
        expect(result[1]).to.be.equal(defaultInterestModelParams.digitalAssetBorrowRateOptimal)
    })
})
