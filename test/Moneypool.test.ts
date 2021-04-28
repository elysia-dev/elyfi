import { expect } from 'chai'
import { ethers, waffle } from 'hardhat'
import { smoddit } from '@eth-optimism/smock'
import { address, ETH, RAY, toIndex, toRate } from './utils/Ethereum';
import { DTokenTest, ERC20Test, InterestRateModel, LTokenTest, MoneyPoolTest } from '../typechain';
import { makeInterestModel, makeMoneyPool, makeLToken, makeDToken, makeUnderlyingAsset } from './utils/makeContract';
import { BigNumber } from 'ethers';
import { defaultReserveData } from './utils/Interfaces';

describe("MoneyPool", () => {
    let underlyingAsset: ERC20Test
    let moneyPool: MoneyPoolTest
    let interestModel: InterestRateModel
    let lToken: LTokenTest
    let dToken: DTokenTest

    const provider = waffle.provider
    const [admin, account1, account2] = provider.getWallets()

    beforeEach(async () => {
        underlyingAsset = await makeUnderlyingAsset({
            deployer: admin,
        })

        moneyPool = await makeMoneyPool({
            deployer: admin,
        })

        interestModel = await makeInterestModel({
            deployer: admin,
        })

        lToken = await makeLToken({
            deployer: admin,
            moneyPool: moneyPool,
            underlyingAsset: underlyingAsset,
        })

        dToken = await makeDToken({
            deployer: admin,
            moneyPool: moneyPool,
            underlyingAsset: underlyingAsset,
        })

        await moneyPool.addNewReserve(
            underlyingAsset.address,
            lToken.address,
            dToken.address,
            interestModel.address
        )
    })

    describe("AddReserve", async () => {
        it("Set reserveData properly", async () => {
            const reserveData = await moneyPool.getReserveData(underlyingAsset.address)
            expect(reserveData[0]).to.equal(defaultReserveData.lTokenInterestIndex)
            expect(reserveData[1]).to.equal(defaultReserveData.dTokenInterestIndex)
            expect(reserveData[2]).to.equal(defaultReserveData.realAssetAPR)
            expect(reserveData[3]).to.equal(defaultReserveData.digitalAssetAPR)
            expect(reserveData[4]).to.equal(defaultReserveData.supplyAPR)
            expect(reserveData[6]).to.equal(lToken.address)
            expect(reserveData[7]).to.equal(dToken.address)
            expect(reserveData[8]).to.equal(interestModel.address)
        })
    })

    describe("Invest", async () => {
        it("Mints lToken and takes asset", async () => {
            await underlyingAsset.connect(admin).approve(moneyPool.address, RAY)
            await moneyPool.invest(
                underlyingAsset.address,
                admin.address,
                10000
            )
        })
    })
})
