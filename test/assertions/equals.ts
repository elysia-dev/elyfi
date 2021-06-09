import { Assertion, util } from 'chai';
import { BigNumber } from 'bignumber.js';

const flag = util.flag;

declare global {
  export namespace Chai {
    interface Assertion {
      bigNumberCloseTo(expect: BigNumber, delta: number, msg: string): void;
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