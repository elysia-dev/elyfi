import { BigNumber } from 'ethers';
import { waffle } from 'hardhat';

export function toTimestamp(year: BigNumber, month: BigNumber, day: BigNumber) {
  return BigNumber.from(Date.UTC(year.toNumber(), month.toNumber(), day.toNumber()) / 1000);
}

export async function advanceBlock() {
  return waffle.provider.send('evm_mine', []);
}

export async function advanceTime(secondsToIncrease: number) {
  await waffle.provider.send('evm_increaseTime', [secondsToIncrease]);
  return await waffle.provider.send('evm_mine', []);
}

export async function advanceTimeTo(current: BigNumber, target: BigNumber) {
  const secondsToIncrease = target.sub(current).toNumber();
  await waffle.provider.send('evm_increaseTime', [secondsToIncrease]);
  return await waffle.provider.send('evm_mine', []);
}

export async function advanceBlockTo(to: number) {
  for (let i = await waffle.provider.getBlockNumber(); i < to; i++) {
    await advanceBlock();
  }
}

export async function saveEVMSnapshot(): Promise<string> {
  const snapshotId = await waffle.provider.send('evm_snapshot', []);
  return snapshotId;
}

export async function revertFromEVMSnapshot(snapshotId: string) {
  await waffle.provider.send('evm_revert', [snapshotId]);
}

export async function getTimestamp(tx: any) {
  return BigNumber.from((await waffle.provider.getBlock(tx.blockNumber)).timestamp);
}
