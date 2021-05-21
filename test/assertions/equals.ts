import { Assertion } from "chai"
import { BigNumber } from "ethers"
import { ReserveData, UserData } from "../utils/Interfaces"

declare global {
    export namespace Chai {
        interface Assertion {
            equalReserveData(expectedData: ReserveData): void;
            equalUserData(expectedData: UserData): void;
        }
    }
}

type ReserveDataKey = keyof ReserveData

Assertion.addMethod("equalReserveData", function (expectedData: ReserveData) {
    const actualData = <ReserveData>this._obj;

    const keys : ReserveDataKey[] = Object.keys(expectedData) as ReserveDataKey []

    keys.forEach((key) => {
        if (
            key === 'moneyPoolFactor' ||
            key === 'underlyingAssetAddress' ||
            key === 'underlyingAssetName' ||
            key === 'underlyingAssetSymbol' ||
            key === 'underlyingAssetDecimals' ||
            key === 'lTokenAddress' ||
            key === 'dTokenAddress' ||
            key === 'interestRateModelAddress' ||
            key === 'tokenizerAddress' ||
            key === 'interestRateModelParams'
        ) {return}
        const actualDataValue = actualData[key]
        const expectedDataValue = expectedData[key]

        console.log(`${key} : ${actualDataValue.toString()}`)

        new Assertion(actualDataValue).to.be.eq(expectedDataValue,
            `Expected ${expectedDataValue} to be equal ${actualDataValue} in ${key}`)
    })
})

type UserDataKey = keyof UserData

Assertion.addMethod("equalUserData", function (expectedData: UserData) {
    const actualData = <UserData>this._obj;

    const keys : UserDataKey[] = Object.keys(expectedData) as UserDataKey []

    keys.forEach((key) => {
        if (
            key === 'aTokenInvestments'
        ) {return}
        const actualDataValue = actualData[key]
        const expectedDataValue = expectedData[key]

        console.log(`${key} : ${actualDataValue.toString()}`)

        new Assertion(actualDataValue).to.be.eq(expectedDataValue,
            `Expected ${expectedDataValue} to be equal ${actualDataValue} in ${key}`)
    })
})