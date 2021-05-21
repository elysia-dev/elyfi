import { expect } from 'chai';
import { waffle } from 'hardhat'
import { Connector, ERC20Test, InterestRateModel, LTokenTest, MoneyPoolTest } from '../typechain';
import { expandToDecimals, toRate } from './utils/Ethereum';
import { defaultInterestModelParams } from './utils/Interfaces';
import { makeConnector, makeInterestRateModel, makeLToken, makeMoneyPool, makeUnderlyingAsset } from './utils/MakeContract'

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

    context(".borrow APR", async () => {
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
            // 0 : real , 1 : digital 2 : supply
            expect(result[0]).to.be.equal(defaultInterestModelParams.realAssetBorrowRateBase)
            expect(result[1]).to.be.equal(defaultInterestModelParams.digitalAssetBorrowRateBase)
            expect(result[2]).to.be.equal(0)
        })

        it("Returns optimal rates at optimal utilization rate", async () => {
            await underlyingAsset.connect(deployer).transfer(lToken.address, expandToDecimals(2, 18))
            const result = await interestRateModel.calculateRates(
                underlyingAsset.address,
                lToken.address,
                expandToDecimals(8, 18), //utilization rate = 8/(8+2)
                0,
                0,
                0,
                0,
                0
            )

            expect(result[0]).to.be.equal(defaultInterestModelParams.realAssetBorrowRateOptimal)
            expect(result[1]).to.be.equal(defaultInterestModelParams.digitalAssetBorrowRateOptimal)
        })

        it("Returns optimal rates at optimal utilization rate with borrowing", async () => {
            await underlyingAsset.connect(deployer).transfer(lToken.address, expandToDecimals(3, 18))
            const result = await interestRateModel.calculateRates(
                underlyingAsset.address,
                lToken.address,
                expandToDecimals(8, 18),
                0,
                0,
                expandToDecimals(1, 18), //utilization rate after borrow '1' = 8/(8+(3-'1'))
                0,
                0
            )

            expect(result[0]).to.be.equal(defaultInterestModelParams.realAssetBorrowRateOptimal)
            expect(result[1]).to.be.equal(defaultInterestModelParams.digitalAssetBorrowRateOptimal)
        })

        it("Returns optimal rates at optimal utilization rate with investment", async () => {
            await underlyingAsset.connect(deployer).transfer(lToken.address, expandToDecimals(1, 18))
            const result = await interestRateModel.calculateRates(
                underlyingAsset.address,
                lToken.address,
                expandToDecimals(8, 18),
                0,
                expandToDecimals(1, 18), //utilization rate after invest '1' = 8/(8+(1+1))
                0,
                0,
                0
            )

            expect(result[0]).to.be.equal(defaultInterestModelParams.realAssetBorrowRateOptimal)
            expect(result[1]).to.be.equal(defaultInterestModelParams.digitalAssetBorrowRateOptimal)
        })
    })

    context(".supply APR", async () => {
        it("Returns half of the overall borrow APR when 50% utilization ratio", async () => {
            await underlyingAsset.connect(deployer).transfer(lToken.address, expandToDecimals(5, 18))

            const averageRealAssetAPR = toRate(0.1)
            const result = await interestRateModel.calculateRates(
                underlyingAsset.address,
                lToken.address,
                expandToDecimals(5, 18), //utilization rate = 5/(5+5)
                0,
                0,
                0,
                averageRealAssetAPR,
                0
            )

            expect(result[2]).to.be.equal(averageRealAssetAPR.div(2))
        })
    })
})
