import { BigNumber } from 'bignumber.js';
import { waffle } from 'hardhat';
import { RAY, WAD } from './constants';

// Time

export async function advanceBlock() {
  return waffle.provider.send('evm_mine', []);
}

export async function advanceTime(secondsToIncrease: number) {
  await waffle.provider.send('evm_increaseTime', [secondsToIncrease]);
  return await waffle.provider.send('evm_mine', []);
}

export async function advanceBlockTo(to: number) {
  for (let i = await waffle.provider.getBlockNumber(); i < to; i++) {
    await advanceBlock();
  }
}

export async function getTimestamp(tx: any) {
  return new BigNumber((await waffle.provider.getBlock(tx.blockNumber)).timestamp);
}

// Underflow error, need refactor
export function toIndex(m: number): BigNumber {
  return new BigNumber(m * 1000).multipliedBy(new BigNumber(10).pow(24));
}

// Underflow error, need refactor
export function toRate(m: number): BigNumber {
  return new BigNumber(m * 1000).multipliedBy(new BigNumber(10).pow(24));
}

// ray calculation

export function rayMul(m: BigNumber, n: BigNumber): BigNumber {
  const halfRay = new BigNumber(RAY).div(2).decimalPlaces(0, BigNumber.ROUND_DOWN);
  return m.multipliedBy(n).plus(halfRay).div(RAY).decimalPlaces(0, BigNumber.ROUND_DOWN);
}

export function rayDiv(m: BigNumber, n: BigNumber): BigNumber {
  const half = n.div(2).decimalPlaces(0, BigNumber.ROUND_DOWN);

  return half
    .plus(m.multipliedBy(RAY))
    .decimalPlaces(0, BigNumber.ROUND_DOWN)
    .div(n)
    .decimalPlaces(0, BigNumber.ROUND_DOWN);
}

export function wadToRay(m: BigNumber): BigNumber {
  return m.multipliedBy(RAY).div(WAD).decimalPlaces(0, BigNumber.ROUND_DOWN);
}

// Addresses

export function address(m: number) {
  return `0x${m.toString(16).padStart(40, '0')}`;
}
