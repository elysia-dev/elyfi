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

// Addresses

export function address(n: number) {
  return `0x${n.toString(16).padStart(40, '0')}`;
}

// Constants

export const RAY = expandToDecimals(10, 27)
export const ONE_YEAR = 31536000
export const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"