import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

export enum ELYFIContractType {
  CONNECTOR,
  MONEYPOOL,
  LTOKEN,
  DTOKEN,
  TOKENIZER,
  DATA_PIPELINE,
}
const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const timeConverter = await deploy('TimeConverter', {
    from: deployer,
    log: true,
  });
  const index = await deploy('Index', {
    from: deployer,
    log: true,
  });
  const rate = await deploy('Rate', {
    from: deployer,
    log: true,
  });
  const validation = await deploy('Validation', {
    from: deployer,
    log: true,
  });
  const assetBond = await deploy('AssetBond', {
    from: deployer,
    log: true,
    libraries: {
      TimeConverter: timeConverter.address,
    },
  });

  const connector = await deploy('Connector', {
    from: deployer,
    log: true,
  });
  const moneyPool = await deploy('MoneyPool', {
    from: deployer,
    args: ['16', connector.address],
    log: true,
    libraries: {
      AssetBond: assetBond.address,
      Validation: validation.address,
      TimeConverter: timeConverter.address,
      Index: index.address,
      Rate: rate.address,
    },
  });
  const dataPipeline = await deploy('DataPipeline', {
    from: deployer,
    args: [moneyPool.address],
    log: true,
  });

  console.log('core deploy done');

  if (hre.network.name != 'ganache' && hre.network.name != 'hardhat') {
    await hre.run('etherscan-verify', {
      network: hre.network.name,
    });
  }
};

deploy.tags = ['core'];

export default deploy;
