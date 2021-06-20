import { Assertion, util, expect } from 'chai';
import { BigNumber } from 'ethers';
import { AssetBondData, ReserveData, UserData } from '../utils/Interfaces';

const flag = util.flag;

declare global {
  export namespace Chai {
    interface Assertion {
      bigNumberCloseTo(expect: BigNumber, delta: number, msg: string): void;
      equalUserData(expectedData: UserData): void;
      equalReserveData(expect: ReserveData): void;
      equalAssetBondData(expect: AssetBondData): void;
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
    expected.toString(),
    actualData.toString()
  );
});

Assertion.addMethod('equalReserveData', function (expectedData: ReserveData) {
  const actualData = <ReserveData>this._obj;

  (Object.keys(actualData) as (keyof ReserveData)[]).forEach((key) => {
    expect(expectedData[key]).to.eq(actualData[key]);
  });
});

Assertion.addMethod('equalUserData', function (expectedData: UserData) {
  const actualData = <UserData>this._obj;

  (Object.keys(actualData) as (keyof UserData)[]).forEach((key) => {
    console.log(key, expectedData[key].toString(), actualData[key].toString());
    expect(expectedData[key]).to.eq(actualData[key]);
  });
});

Assertion.addMethod('equalAssetBondData', function (expectedData: AssetBondData) {
  const actualData = <AssetBondData>this._obj;

  (Object.keys(actualData) as (keyof AssetBondData)[]).forEach((key) => {
    expect(expectedData[key]).to.eq(actualData[key]);
  });
});
