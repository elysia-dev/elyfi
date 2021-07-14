import { Assertion, util, expect } from 'chai';
import { BigNumber } from 'ethers';
import AssetBondData from '../types/AssetBondData';
import IncentivePoolData from '../types/IncentivePoolData';
import ReserveData from '../types/ReserveData';
import UserData from '../types/UserData';
import UserIncentiveData from '../types/UserIncentiveData';

const flag = util.flag;

type ElyfiData = ReserveData | UserData | AssetBondData | IncentivePoolData | UserIncentiveData;

declare global {
  export namespace Chai {
    interface Assertion {
      bigNumberCloseTo(expect: BigNumber, delta: number, msg: string): void;
      deepEqualWithBigNumber(expectedData: ElyfiData): void;
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
    BigNumber.prototype.gte.bind(actualData)(expected.sub(delta)) &&
    BigNumber.prototype.lte.bind(actualData)(expected.add(delta)),
    `expected #{act} to be within '${delta}' of #{exp}`,
    `expected #{act} to be further than '${delta}' from #{exp}`,
    expected.toString(),
    actualData.toString()
  );
});

Assertion.addMethod('deepEqualWithBigNumber', function (expectedData: ElyfiData) {
  const actualData = <ElyfiData>this._obj;

  (Object.keys(actualData) as (keyof ElyfiData)[]).forEach((key) => {
    const castedData = expectedData[key] as { _isBigNumber: boolean }

    if (castedData?._isBigNumber) {
      expect(expectedData[key], key).to.bigNumberCloseTo(actualData[key] as BigNumber, 1, '');
    } else {
      expect(expectedData[key], key).to.eq(actualData[key]);
    }
  });
});

Assertion.addMethod('equalReserveData', function (expectedData: ReserveData) {
  const actualData = <ReserveData>this._obj;

  (Object.keys(actualData) as (keyof ReserveData)[]).forEach((key) => {
    expect(expectedData[key], key).to.eq(actualData[key]);
  });
});

Assertion.addMethod('equalUserData', function (expectedData: UserData) {
  const actualData = <UserData>this._obj;

  (Object.keys(actualData) as (keyof UserData)[]).forEach((key) => {
    expect(expectedData[key], key).to.eq(actualData[key]);
  });
});

Assertion.addMethod('equalAssetBondData', function (expectedData: AssetBondData) {
  const actualData = <AssetBondData>this._obj;

  (Object.keys(actualData) as (keyof AssetBondData)[]).forEach((key) => {
    expect(expectedData[key], key).to.eq(actualData[key]);
  });
});

Assertion.addMethod('equalIncentivePoolData', function (expectedData: IncentivePoolData) {
  const actualData = <IncentivePoolData>this._obj;

  (Object.keys(actualData) as (keyof IncentivePoolData)[]).forEach((key) => {
    expect(expectedData[key], key).to.eq(actualData[key]);
  });
});

Assertion.addMethod('equalUserIncentiveData', function (expectedData: UserIncentiveData) {
  const actualData = <UserIncentiveData>this._obj;

  (Object.keys(actualData) as (keyof UserIncentiveData)[]).forEach((key) => {
    expect(expectedData[key], key).to.eq(actualData[key]);
  });
});
