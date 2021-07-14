import { Assertion, util, expect } from 'chai';
import { BigNumber } from 'ethers';
import AssetBondData from '../types/AssetBondData';
import IncentivePoolData from '../types/IncentivePoolData';
import ReserveData from '../types/ReserveData';
import UserData from '../types/UserData';
import UserIncentiveData from '../types/UserIncentiveData';

const flag = util.flag;

declare global {
  export namespace Chai {
    interface Assertion {
      bigNumberCloseTo(expect: BigNumber, delta: number, msg: string): void;
      equalUserData(expectedData: UserData): void;
      equalReserveData(expect: ReserveData): void;
      equalAssetBondData(expect: AssetBondData): void;
      equalUserIncentiveData(expect: UserIncentiveData): void;
      equalIncentivePoolData(expect: IncentivePoolData): void;
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
    expect(expectedData[key]).to.eq(actualData[key]);
  });
});

Assertion.addMethod('equalAssetBondData', function (expectedData: AssetBondData) {
  const actualData = <AssetBondData>this._obj;

  (Object.keys(actualData) as (keyof AssetBondData)[]).forEach((key) => {
    expect(expectedData[key]).to.eq(actualData[key]);
  });
});

Assertion.addMethod('equalIncentivePoolData', function (expectedData: IncentivePoolData) {
  const actualData = <IncentivePoolData>this._obj;

  (Object.keys(actualData) as (keyof IncentivePoolData)[]).forEach((key) => {
    console.log(
      'pool contract | test',
      key,
      expectedData[key].toString(),
      actualData[key].toString()
    );
    expect(expectedData[key]).to.eq(actualData[key]);
  });
});

Assertion.addMethod('equalUserIncentiveData', function (expectedData: UserIncentiveData) {
  const actualData = <UserIncentiveData>this._obj;

  (Object.keys(actualData) as (keyof UserIncentiveData)[]).forEach((key) => {
    console.log(
      'user contract | test',
      key,
      expectedData[key].toString(),
      actualData[key].toString()
    );
    expect(expectedData[key]).to.eq(actualData[key]);
  });
});
