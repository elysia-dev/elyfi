import { Assertion, util } from 'chai';
import { BigNumber } from 'bignumber.js';
import { ReserveData, UserData } from '../utils/Interfaces';

const flag = util.flag;

declare global {
  export namespace Chai {
    interface Assertion {
      bigNumberCloseTo(expect: BigNumber, delta: number, msg: string): void;
      equalReserveData(expectedData: ReserveData): void;
      equalUserData(expectedData: UserData): void;
    }
  }
}

Assertion.addMethod('bigNumberCloseTo', function (expected, delta, msg) {
  if (msg) {
    flag(this, 'message', msg);
  }
  const actualData = <BigNumber>this._obj;

  this.assert(
    BigNumber.prototype.gte.bind(actualData)(expected.minus(delta)) &&
    BigNumber.prototype.lte.bind(actualData)(expected.plus(delta)),
    `expected #{act} to be within '${delta}' of #{exp}`,
    `expected #{act} to be further than '${delta}' from #{exp}`,
    expected.toFixed(),
    actualData.toFixed()
  );
});

// new Assertion(actualDataValue).to.be.bigNumberCloseTo(
//     expectedDataValue,
//     1000,
//     `Expected ${expectedDataValue} to be equal ${actualDataValue} in ${key}`
//   );

type ReserveDataKey = keyof ReserveData;

Assertion.addMethod('equalReserveData', function (expectedData: ReserveData) {
  const actualData = <ReserveData>this._obj;

  const keys: ReserveDataKey[] = Object.keys(expectedData) as ReserveDataKey[];

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
      key === 'dTokenLastUpdateTimestamp' ||
      key === 'tokenizerAddress' ||
      key === 'interestRateModelParams'
    ) {
      return;
    }
    const actualDataValue = actualData[key];
    const expectedDataValue = expectedData[key];

    //console.log(`${key} : ${actualDataValue.toFixed()} in reserveData actual`);
    //console.log(`${key} : ${expectedDataValue.toFixed()} in reserveData expected`);

    new Assertion(actualDataValue).to.be.bigNumberCloseTo(
      expectedDataValue,
      10,
      `Expected ${expectedDataValue} to be equal ${actualDataValue} in ${key}`
    );
  });
});

type UserDataKey = keyof UserData;

Assertion.addMethod('equalUserData', function (expectedData: UserData) {
  const actualData = <UserData>this._obj;

  const keys: UserDataKey[] = Object.keys(expectedData) as UserDataKey[];

  keys.forEach((key) => {
    const actualDataValue = actualData[key];
    const expectedDataValue = expectedData[key];

    //console.log(`${key} : ${actualDataValue.toFixed()} in userData actual`);
    //console.log(`${key} : ${expectedDataValue.toFixed()} in userData expected`);

    new Assertion(actualDataValue).to.be.bigNumberCloseTo(
      expectedDataValue,
      10,
      `Expected ${expectedDataValue} to be equal ${actualDataValue} in ${key}`
    );
  });
});
