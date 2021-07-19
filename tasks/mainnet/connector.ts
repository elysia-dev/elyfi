import { task } from 'hardhat/config';
import { getConnector, getMoneyPool, getTokenizer } from '../../utils/getDeployedContracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import AssetBondSettleData from '../../test/types/AssetBondSettleData';
import { Connector, MoneyPool, Tokenizer } from '../../typechain';
import { getNamedAccounts } from 'hardhat';
import { getPoolAdmin } from '../../utils/getWallets';

interface Args {
  asset: string;
  bond: string;
  nonce: string;
  data: string;
  amount: string;
  txSender: string;
  loanStart: string;
  address: string;
}

const checkCollateralServiceProvider = async ({
  connector,
  txSender,
  deployer,
}: {
  connector: Connector;
  txSender: SignerWithAddress;
  deployer: SignerWithAddress;
}) => {
  const isCollateralServiceProvider = await connector.isCollateralServiceProvider(txSender.address);
  if (!isCollateralServiceProvider) {
    const addCollateralServiceProviderTx = await connector
      .connect(deployer)
      .addCollateralServiceProvider(txSender.address);
    await addCollateralServiceProviderTx.wait();
    console.log(
      `Deployer add a collateral service provider role to ${txSender.address.substr(0, 10)}`
    );
  }
};

const checkCouncil = async ({
  connector,
  txSender,
  deployer,
}: {
  connector: Connector;
  txSender: SignerWithAddress;
  deployer: SignerWithAddress;
}) => {
  const isCouncil = await connector.isCouncil(txSender.address);
  if (!isCouncil) {
    const addCouncilTx = await connector.connect(deployer).addCouncil(txSender.address);
    await addCouncilTx.wait();
    console.log(`Deployer add a council role to ${txSender.address.substr(0, 10)}`);
  }
};

task('mainnet:addCSP', 'Add collateral service provider')
  .addParam('address', 'The address for the role')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const connector = (await getConnector(hre)) as Connector;

    const poolAdmin = getPoolAdmin();

    const isCollateralServiceProvider = await connector.isCollateralServiceProvider(args.address);
    if (!isCollateralServiceProvider) {
      const addCollateralServiceProviderTx = await connector
        .connect(poolAdmin)
        .addCollateralServiceProvider(args.address);
      await addCollateralServiceProviderTx.wait();
      console.log(`Deployer add a collateral service provider role to ${args.address}`);
      return;
    }
    console.log(`${args.address} has already collateral service provider role`);
  });

task('mainnet:addCouncil', 'Add Council')
  .addParam('address', 'The address for the role')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const connector = (await getConnector(hre)) as Connector;

    const poolAdmin = getPoolAdmin();

    const isCouncil = await connector.isCouncil(args.address);
    if (!isCouncil) {
      const addCouncilTx = await connector.connect(poolAdmin).addCouncil(args.address);
      await addCouncilTx.wait();
      console.log(`Deployer add a council role to ${args.address}`);
    }
    console.log(`${args.address} has already council role`);
  });
