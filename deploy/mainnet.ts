import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import {
  testIncentiveAmountPerSecond,
  testInterestModelParams,
  testReserveData,
} from '../test/utils/testData';
import { getContractAt } from 'hardhat-deploy-ethers/dist/src/helpers';
import { MoneyPool } from '../typechain';
import { getDai, getElyfi, getElysia } from './utils/dependencies';

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

  const testUnderlyingAsset = await getDai(hre, deployer);

  const testIncentiveAsset = await getElyfi(hre, deployer);

  const connector = await deploy('Connector', {
    from: deployer,
    log: true,
  });

  const moneyPool = await deploy('MoneyPool', {
    from: deployer,
    args: ['16', connector.address],
    log: true,
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
    args: [moneyPool.address, elysia?.address, 'testLToken', 'L'],
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

  await hre.run('verify:verify', {
    address: connector.address,
  });

  await hre.run('verify:verify', {
    address: moneyPool.address,
    constructorArguments: [16, connector.address],
  });

  await hre.run('verify:verify', {
    address: interestRateModel.address,
    constructorArguments: [
      testInterestModelParams.optimalUtilizationRate,
      testInterestModelParams.borrowRateBase,
      testInterestModelParams.borrowRateOptimal,
      testInterestModelParams.borrowRateMax,
    ],
  });

  await hre.run('verify:verify', {
    address: lToken.address,
    constructorArguments: [moneyPool.address, elysia?.address, 'testLToken', 'L'],
  });

  await hre.run('verify:verify', {
    address: dToken.address,
    constructorArguments: [moneyPool.address, elysia?.address, 'testDToken', 'D'],
  });

  await hre.run('verify:verify', {
    address: tokenizer.address,
    constructorArguments: [connector.address, moneyPool.address, 'testTokenizer', 'T'],
  });
  await hre.run('verify:verify', {
    address: dataPipeline.address,
    constructorArguments: [moneyPool.address],
  });
};

deployMainnet.tags = ['mainnet'];

export default deployMainnet;
