import { ethers, waffle } from 'hardhat'
import { ERC20Test, InterestRateModel, LTokenTest, MoneyPoolTest } from '../typechain';
import { makeInterestModel, makeLToken, makeMoneyPool, makeUnderlyingAsset } from './utils/makeContract';

describe("Rate", () => {
    let underlyingAsset: ERC20Test
    let moneyPool: MoneyPoolTest
    let interestRateModel: InterestRateModel
    let lToken: LTokenTest

    const provider = waffle.provider
    const [deployer, account1, account2] = provider.getWallets()

    beforeEach(async () => {
        underlyingAsset = await makeUnderlyingAsset({
            deployer: deployer,
        })

        moneyPool = await makeMoneyPool({
            deployer: deployer,
        })

        interestRateModel = await makeInterestModel({
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

        console.log(result)
    })
})
