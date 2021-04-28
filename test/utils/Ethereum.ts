import { BigNumber } from "ethers";
import { waffle } from "hardhat";

// Time

export async function advanceBlock() {
  return waffle.provider.send("evm_mine", [])
}

export async function advanceBlockTo(to: number) {
  for (let i = await waffle.provider.getBlockNumber(); i < to; i++) {
    await advanceBlock()
  }
}

export async function advanceTime() { }

// Numbers

export function expandToDecimals(n: number, m: number): BigNumber {
  return BigNumber.from(n).mul(BigNumber.from(10).pow(m))
}

// Underflow error, need refactor
export function toIndex(n: number): BigNumber {
  return BigNumber.from(n*1000).mul(BigNumber.from(10).pow(24))
}

// Underflow error, need refactor
export function toRate(n: number): BigNumber {
  return BigNumber.from(n*1000).mul(BigNumber.from(10).pow(24))
}

export function rayMul(n: BigNumber, m: BigNumber): BigNumber {
  return n.mul(m).div(RAY);
}

export function rayDiv(n: BigNumber, m: BigNumber): BigNumber {
  return n.mul(RAY).div(m);
}

// Addresses

export function address(n: number) {
  return `0x${n.toString(16).padStart(40, '0')}`;
}

// Constants

export const MAXUINT = BigNumber.from('115792089237316195423570985008687907853269984665640564039457584007913129639935')
export const RAY = expandToDecimals(1, 27)
export const PERCENTAGE_FACTOR = '10000';
export const HALF_PERCENTAGE = '5000';
export const WAD = expandToDecimals(1, 18)

export const SECONDSPERYEAR = 31536000
export const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"