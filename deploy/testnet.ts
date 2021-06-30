import { Contract, ethers } from 'ethers';
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
//import { saveDeployedContract } from './utils/save';

export enum ELYFIContractType {
  CONNECTOR,
  MONEYPOOL,
  LTOKEN,
  DTOKEN,
  TOKENIZER,
  DATA_PIPELINE,
}
const deployTestnet: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

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
    args: [
      moneyPool.address,
      testUnderlyingAsset?.address,
      incentivePool.address,
      'testLToken',
      'L',
    ],
    log: true,
  });

  const dToken = await deploy('DToken', {
    from: deployer,
    args: [moneyPool.address, testUnderlyingAsset?.address, 'testDToken', 'D'],
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

  console.log('deploy done');

  const deployedMoneyPool = (await getContractAt(
    hre,
    moneyPool.abi,
    moneyPool.address,
    deployer
  )) as MoneyPool;

  console.log('getContract done');

  await deployedMoneyPool.addNewReserve(
    testUnderlyingAsset?.address,
    lToken.address,
    dToken.address,
    interestRateModel.address,
    tokenizer.address,
    incentivePool.address,
    testReserveData.moneyPoolFactor
  );

  console.log('addNewReserve done');

  if (hre.network.name === 'ganache') return;

  try {
    console.log('deploy plugin - verify start');
    await hre.run('etherscan-verify', {
      network: hre.network.name,
    });
  } catch (e) {
    console.log('deploy plugin - verify error');
    console.log(e);
  }

  //   await hre.run('verify:verify', {
  //     address: connector.address,
  //   });

  //   await hre.run('verify:verify', {
  //     address: moneyPool.address,
  //     constructorArguments: [16, connector.address],
  //   });

  //   await hre.run('verify:verify', {
  //     address: interestRateModel.address,
  //     constructorArguments: [
  //       testInterestModelParams.optimalUtilizationRate,
  //       testInterestModelParams.borrowRateBase,
  //       testInterestModelParams.borrowRateOptimal,
  //       testInterestModelParams.borrowRateMax,
  //     ],
  //   });

  //   await hre.run('verify:verify', {
  //     address: lToken.address,
  //     constructorArguments: [moneyPool.address, testUnderlyingAsset?.address, 'testLToken', 'L'],
  //   });

  //   await hre.run('verify:verify', {
  //     address: dToken.address,
  //     constructorArguments: [moneyPool.address, testUnderlyingAsset?.address, 'testDToken', 'D'],
  //   });

  //   await hre.run('verify:verify', {
  //     address: tokenizer.address,
  //     constructorArguments: [connector.address, moneyPool.address, 'testTokenizer', 'T'],
  //   });
  //   await hre.run('verify:verify', {
  //     address: dataPipeline.address,
  //     constructorArguments: [moneyPool.address],
  //   });
};

deployTestnet.tags = ['testnet'];

export default deployTestnet;
