import { BigNumber } from 'ethers';
import { RAY, WAD } from './constants';

// Underflow error, need refactor
export function toIndex(m: number): BigNumber {
  return BigNumber.from(m * 1000).mul(BigNumber.from(10).pow(24));
}

// Underflow error, need refactor
export function toRate(m: number): BigNumber {
  return BigNumber.from(m * 1000).mul(BigNumber.from(10).pow(24));
}

// ray calculation
//     return (a * b + halfRAY) / RAY;
export function rayMul(m: BigNumber, n: BigNumber): BigNumber {
  const halfRay = BigNumber.from(RAY).div(2);

  return m.mul(n).add(halfRay).div(RAY);
}

//rayDiv(uint256 a, uint256 b)
/*
require(b != 0, 'Division by Zero');
uint256 halfB = b / 2;
return (a * RAY + halfB) / b;
}
*/
export function rayDiv(m: BigNumber, n: BigNumber): BigNumber {
  const half = n.div(2);

  return half.add(m.mul(RAY)).div(n);
}

export function wadToRay(m: BigNumber): BigNumber {
  return m.mul(RAY).div(WAD);
}

// Addresses

export function address(m: number) {
  return `0x${m.toString(16).padStart(40, '0')}`;
}
