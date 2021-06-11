import { MockProvider } from "@ethereum-waffle/provider";
import { Wallet } from "@ethersproject/wallet";
import { utils } from "ethers";
import UserType from "../../test-suites/enums/UserType";
import ElyfiContracts from "../types/ElyfiContracts";
import {
  makeAllContracts,
} from "../utils/makeContract";

export default async function utilizedMoneypool(
  wallets: Wallet[],
  _provider: MockProvider
): Promise<{ wallets: Wallet[], elyfiContracts: ElyfiContracts }> {
  const deployer = wallets[UserType.Deployer]
  const elyfiContracts = await makeAllContracts(deployer)

  // Utilzed Ratio = 5 / 15 = 33%
  const totalSupply = utils.parseEther('10');
  const totalBorrow = utils.parseEther('5');

  await elyfiContracts.underlyingAsset.connect(deployer).transfer(elyfiContracts.lToken.address, totalSupply);

  await elyfiContracts.moneyPool.connect(deployer).utilzedReserveForTest(
    elyfiContracts.underlyingAsset.address,
    totalSupply,
    totalBorrow,
  )

  return {
    wallets,
    elyfiContracts
  }
}