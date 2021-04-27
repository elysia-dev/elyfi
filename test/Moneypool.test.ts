import { ethers, waffle } from 'hardhat'
import { smoddit } from '@eth-optimism/smock'
import { address, ETH, toIndex, toRate } from './utils/Ethereum';
import { DTokenTest, ERC20Test, LTokenTest, MoneyPoolTest } from '../typechain';
import { makeMoneyPool, makeTokens, makeUnderlyingAsset } from './utils/makeContract';
import { BigNumber } from 'ethers';

describe("MoneyPool", () => {
    let underlyingAsset: ERC20Test
    let moneyPool: MoneyPoolTest
    let lToken: LTokenTest
    let dToken: DTokenTest

    const provider = waffle.provider
    const [admin, account1, account2] = provider.getWallets()

    beforeEach(async () => {
        underlyingAsset = await makeUnderlyingAsset({
            deployer: admin,
        })
    })

    describe("Invest", async () => {
        it("it ")
    })
})
