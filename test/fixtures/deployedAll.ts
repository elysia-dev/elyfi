import { MockProvider } from "@ethereum-waffle/provider";
import { Wallet } from "@ethersproject/wallet";
import ElyfiContracts from "../types/ElyfiContracts";
import {
  makeAllContracts,
} from "../utils/makeContract";

export default async function deployedAll(
  wallets: Wallet[],
  _provider: MockProvider
): Promise<{ wallets: Wallet[], elyfiContracts: ElyfiContracts }> {
  const elyfiContracts = await makeAllContracts()

  return {
    wallets,
    elyfiContracts
  }
}