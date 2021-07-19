import { task } from 'hardhat/config';
import { getConnector } from '../../utils/getDeployedContracts';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Connector } from '../../typechain';
import { getPoolAdmin } from '../../utils/getWallets';

interface Args {
  address: string;
}

task('mainnet:addCSP', 'Add collateral service provider')
  .addParam('address', 'The address for the role')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const connector = (await getConnector(hre)) as Connector;
    const poolAdmin = await getPoolAdmin(hre);

    const isMoneyPoolAdmin = await connector.isMoneyPoolAdmin(poolAdmin.address);
    if (!isMoneyPoolAdmin) {
      console.log(`The caller is not the poolAdmin`);
      return;
    }

    const isCollateralServiceProvider = await connector.isCollateralServiceProvider(args.address);
    if (!isCollateralServiceProvider) {
      const addCollateralServiceProviderTx = await connector
        .connect(poolAdmin)
        .addCollateralServiceProvider(args.address);
      await addCollateralServiceProviderTx.wait();
      console.log(`The pool admin add a collateral service provider role to ${args.address}`);
      return;
    }
    console.log(`${args.address} has already collateral service provider role`);
  });

task('mainnet:addCouncil', 'Add Council')
  .addParam('address', 'The address for the role')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const connector = (await getConnector(hre)) as Connector;
    const poolAdmin = await getPoolAdmin(hre);

    const isMoneyPoolAdmin = await connector.isMoneyPoolAdmin(poolAdmin.address);
    if (!isMoneyPoolAdmin) {
      console.log(`The caller is not the poolAdmin`);
      return;
    }

    const isCouncil = await connector.isCouncil(args.address);
    if (!isCouncil) {
      const addCouncilTx = await connector.connect(poolAdmin).addCouncil(args.address);
      await addCouncilTx.wait();
      console.log(`The pool admin add a council role to ${args.address}`);
    }
    console.log(`${args.address} has already council role`);
  });
