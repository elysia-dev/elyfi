import {
  makeAllContracts,
} from '../../test/utils/makeContract';
import { MockProvider } from '@ethereum-waffle/provider';
import UserType from '../enums/UserType';
import { ethers } from 'hardhat';
import ElyfiContracts from '../../test/types/ElyfiContracts';

const makeTestSuiteContracts = async (provider: MockProvider): Promise<ElyfiContracts> => {
  const wallets = provider.getWallets();
  const deployer = wallets[UserType.Deployer];
  const elyfiContracts = await makeAllContracts(deployer);

  [UserType.Account0, UserType.Account1, UserType.Account2, UserType.Account3].forEach(async (user) => {
    await elyfiContracts.underlyingAsset.connect(deployer).transfer(wallets[user].address, ethers.utils.formatEther(1000));
  })

  return elyfiContracts
}

export default makeTestSuiteContracts;
