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

export function toIndex(n: number): BigNumber {
  return BigNumber.from(n).mul(BigNumber.from(10).pow(27))
}

export function toRate(n: number): BigNumber {
  return BigNumber.from(n).mul(BigNumber.from(10).pow(27))
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

export const RAY = expandToDecimals(10, 27)
export const PERCENTAGE_FACTOR = '10000';
export const HALF_PERCENTAGE = '5000';
export const WAD = expandToDecimals(10, 18)

export const SECONDSPERYEAR = 31536000
export const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"