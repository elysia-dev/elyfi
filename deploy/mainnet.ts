import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import {
  testIncentiveAmountPerSecond,
  testInterestModelParams,
  testReserveData,
} from '../test/utils/testData';
import { getContractAt } from 'hardhat-deploy-ethers/dist/src/helpers';
import { MoneyPool } from '../typechain';
import { getAssetBond, getDai, getElyfi, getElysia, getValidation } from './utils/dependencies';

export enum ELYFIContractType {
  CONNECTOR,
  MONEYPOOL,
  LTOKEN,
  DTOKEN,
  TOKENIZER,
  DATA_PIPELINE,
}

const deployMainnet: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const elysia = await getElysia(hre, deployer);

  const testIncentiveAsset = await getElyfi(hre, deployer);

  const validation = await getValidation(hre);

  const assetBond = await getAssetBond(hre);

  const connector = await deploy('Connector', {
    from: deployer,
    log: true,
  });

  const moneyPool = await deploy('MoneyPool', {
    from: deployer,
    args: ['16', connector.address],
    log: true,
    libraries: {
      Validation: validation.address,
      AssetBond: assetBond.address,
    },
  });

  const incentivePool = await deploy('IncentivePool', {
    from: deployer,
    args: [moneyPool.address, testIncentiveAsset.address, testIncentiveAmountPerSecond],
  });

  const interestRateModel = await deploy('InterestRateModel', {
    from: deployer,
    args: [
      testInterestModelParams.optimalUtilizationRate,
      testInterestModelParams.borrowRateBase,
      testInterestModelParams.borrowRateOptimal,
      testInterestModelParams.borrowRateMax,
    ],
    log: true,
  });

  const lToken = await deploy('LToken', {
    from: deployer,
    args: [moneyPool.address, elysia?.address, incentivePool.address, 'testLToken', 'L'],
    log: true,
  });

  const dToken = await deploy('DToken', {
    from: deployer,
    args: [moneyPool.address, elysia?.address, 'testDToken', 'D'],
    log: true,
  });

  const tokenizer = await deploy('Tokenizer', {
    from: deployer,
    args: [connector.address, moneyPool.address, 'testTokenizer', 'T'],
    log: true,
    libraries: {
      Validation: validation.address,
      AssetBond: assetBond.address,
    },
  });

  const dataPipeline = await deploy('DataPipeline', {
    from: deployer,
    args: [moneyPool.address],
    log: true,
  });

  const deployedMoneyPool = (await getContractAt(
    hre,
    moneyPool.abi,
    moneyPool.address,
    deployer
  )) as MoneyPool;

  await deployedMoneyPool.addNewReserve(
    elysia?.address,
    lToken.address,
    dToken.address,
    interestRateModel.address,
    tokenizer.address,
    incentivePool.address,
    testReserveData.moneyPoolFactor
  );

  if (hre.network.name === 'ganache') return;

  await hre.run('etherscan-verify', {
    network: hre.network.name,
  });
};

deployMainnet.tags = ['mainnet'];

export default deployMainnet;
