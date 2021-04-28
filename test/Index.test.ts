import { ethers, waffle } from 'hardhat'
import { smoddit } from '@eth-optimism/smock'
import { address, ETH, toIndex, toRate } from './utils/Ethereum';
import { DTokenTest, ERC20Test, LTokenTest, MoneyPoolTest } from '../typechain';
import { makeMoneyPool, makeTokens, makeUnderlyingAsset } from './utils/makeContract';
import { BigNumber } from 'ethers';

describe("Index", () => {
    let underlyingAsset: ERC20Test
    let moneyPool: MoneyPoolTest
    let lToken: LTokenTest
    let dToken: DTokenTest

    const provider = waffle.provider
    const [admin, account1, account2] = provider.getWallets()

    beforeEach(async () => {
        const MoneyPoolModifibleFactory = await smoddit('MoneyPoolTest');
        const moneyPoolModifiable = await MoneyPoolModifibleFactory.deploy()

        await moneyPoolModifiable.smodify.put({
            ethReserve: {
                ETH: {
                    lTokenInterestIndex: toIndex(1),
                    dTokenInterestIndex: toIndex(1),
                    realAssetAPR: toRate(0.1),
                    digitalAssetAPR: toRate(0.1),
                    supplyAPR: toRate(0.2),
                    lastUpdateTimestamp: 0,
                    lTokenAddress: address(1),
                    dTokenAddress: address(2),
                    interestModelAddress: address(3)
                }
            }
        })
    })
})
