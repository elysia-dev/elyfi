import { MockProvider } from "@ethereum-waffle/provider";
import { Wallet } from "@ethersproject/wallet";
import UserType from "../../test-suites/enums/UserType";
import ElyfiContracts from "../types/ElyfiContracts";
import {
  makeAllContracts,
} from "../utils/makeContract";

export default async function deployedAll(
  wallets: Wallet[],
  _provider: MockProvider
): Promise<{ wallets: Wallet[], elyfiContracts: ElyfiContracts }> {
  const deployer = wallets[UserType.Deployer]
  const elyfiContracts = await makeAllContracts(deployer)

  return {
    wallets,
    elyfiContracts
  }
}