import { setupAllContracts } from '../../test/utils/setup';
import { MockProvider } from '@ethereum-waffle/provider';
import UserType from '../enums/UserType';
import { ethers } from 'hardhat';
import ElyfiContracts from '../../test/types/ElyfiContracts';

const makeTestSuiteContracts = async (provider: MockProvider): Promise<ElyfiContracts> => {
  const wallets = provider.getWallets();
  const deployer = wallets[UserType.Deployer];
  const elyfiContracts = await setupAllContracts();

  const nonce = await provider.getTransactionCount(deployer.address);

  [
    UserType.CSP,
    UserType.Account1,
    UserType.Account2,
    UserType.Account3,
    UserType.Account4,
  ].forEach(async (user, index) => {
    const { data } = await elyfiContracts.underlyingAsset.populateTransaction.transfer(
      wallets[user].address,
      ethers.utils.parseEther('1000')
    );

    const tx = await deployer.sendTransaction({
      to: elyfiContracts.underlyingAsset.address,
      data,
      nonce: nonce + index,
    });

    await provider.waitForTransaction(tx.hash);
  });

  return elyfiContracts;
};

export default makeTestSuiteContracts;
