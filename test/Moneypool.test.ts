import { BigNumber } from 'ethers';
import { ethers, waffle } from 'hardhat'
import { smoddit } from '@eth-optimism/smock'
import { address, ETH, expandToDecimals, getTimestamp, RAY, toIndex, toRate } from './utils/Ethereum';
import { Connector, DataPipeline, DTokenTest, ERC20Test, InterestRateModel, LTokenTest, MoneyPoolTest, Tokenizer, TokenizerTest } from '../typechain';
import { makeInterestRateModel, makeMoneyPool, makeLToken, makeDToken, makeUnderlyingAsset, makeConnector, makeTokenizer, makeDataPipeline } from './utils/MakeContract';
import { defaultReserveData } from './utils/Interfaces';
import { expect } from 'chai'
import { expectedReserveDataAfterInvestMoneyPool } from './utils/Expect';
import { getReserveData, getUserData } from './utils/Helpers';
require("./assertions/equals")

describe("MoneyPool", () => {
    let underlyingAsset: ERC20Test
    let connector: Connector
    let moneyPool: MoneyPoolTest
    let interestModel: InterestRateModel
    let lToken: LTokenTest
    let dToken: DTokenTest
    let tokenizer: TokenizerTest
    let dataPipeline: DataPipeline

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

        dataPipeline = await makeDataPipeline({
            deployer: deployer,
            moneyPool: moneyPool
        })

        await moneyPool.addNewReserve(
            underlyingAsset.address,
            lToken.address,
            dToken.address,
            interestModel.address,
            tokenizer.address,
            defaultReserveData.moneyPoolFactor
        )

        await underlyingAsset.connect(deployer).transfer(
            account1.address,
            RAY);
    })

    describe("AddReserve", async () => {
        it("Sets reserveData properly", async () => {
            const initialContractReserveData = await getReserveData({
                underlyingAsset: underlyingAsset,
                dataPipeline: dataPipeline
            })

            expect(initialContractReserveData.underlyingAssetName).to.be.equal(defaultReserveData.underlyingAssetName)
            expect(initialContractReserveData.underlyingAssetSymbol).to.be.equal(defaultReserveData.underlyingAssetSymbol)
            expect(initialContractReserveData.lTokenInterestIndex).to.be.equal(defaultReserveData.lTokenInterestIndex)
            expect(initialContractReserveData.dTokenInterestIndex).to.be.equal(defaultReserveData.dTokenInterestIndex)
        })
    })

    describe("Invest", async () => {
        it("Mints lToken and takes asset", async () => {
            const amountInvest = expandToDecimals(10000, 18);

            const contractReserveDataBeforeInvest = await getReserveData({
                underlyingAsset: underlyingAsset,
                dataPipeline: dataPipeline
            })
            const contractUserDataBeforeInvest = await getUserData({
                underlyingAsset: underlyingAsset,
                dataPipeline: dataPipeline,
                user: account1
            })

            await underlyingAsset.connect(account1).approve(moneyPool.address, RAY)

            const investTx = await moneyPool.connect(account1).investMoneyPool(
                underlyingAsset.address,
                account1.address,
                amountInvest
            )

            const contractReserveDataAfterInvest = await getReserveData({
                underlyingAsset: underlyingAsset,
                dataPipeline: dataPipeline
            })
            const contractUserDataAfterInvest = await getUserData({
                underlyingAsset: underlyingAsset,
                dataPipeline: dataPipeline,
                user: account1
            })

            const expectedReserveDataAfterInvest = expectedReserveDataAfterInvestMoneyPool({
                amountInvest: BigNumber.from(amountInvest),
                reserveDataBefore: contractReserveDataBeforeInvest,
                txTimestamp: await getTimestamp(investTx)
            })

            // const expectedUserDataAfterInvest = expectedUserDataAfterInvestMoneyPool({
            //     amountInvest: amountInvest,
            //     userDataBefore: contractUserDataBeforeInvest,
            //     reserveDataBefore: contractReserveDataBeforeInvest,
            //     txTimeStamp: await getTimestamp(investTx)
            // })

            expect(contractReserveDataAfterInvest).to.be.equalReserveData(expectedReserveDataAfterInvest)

            // console.log(
            //     1, contractReserveDataBeforeInvest,
            //     2, contractUserDataBeforeInvest,
            //     3, contractReserveDataAfterInvest,
            //     4, contractUserDataAfterInvest,
            //     5, expectedReserveDataAfterInvest)
            // expect(contractReserveDataAfterInvest).to.be.eq(expectedReserveDataAfterInvest)
        })
    })
})
