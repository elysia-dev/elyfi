import { Contract, ethers } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { defaultInterestModelParams, defaultReserveData } from '../test/utils/Interfaces';
import TestnetEL_ABI from '../dependencies/TestnetEL.json';
import ELToken_ABI from '../dependencies/ELToken.json';
import { getContractAt } from 'hardhat-deploy-ethers/dist/src/helpers';
import { MoneyPool } from '../typechain';

export enum ELYFIContractType {
  CONNECTOR,
  MONEYPOOL,
  LTOKEN,
  DTOKEN,
  TOKENIZER,
  DATA_PIPELINE,
}

const getElysia = async (hre: HardhatRuntimeEnvironment, signer: string): Promise<Contract> => {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;
  let elysia: Contract;
  if (hre.network.name) {
    switch (hre.network.name) {
      case 'mainnet':
        elysia = await hre.ethers.getContractAt(
          ELToken_ABI,
          '0x2781246fe707bB15CeE3e5ea354e2154a2877B16'
        );
        return elysia;
      case 'binanceTestnet':
        elysia = await hre.ethers.getContractAt(
          TestnetEL_ABI,
          '0xecd32309edFdBA6d51236A4517e9c2589c84C843'
        );
        return elysia;
    }
  }

  const elysiaLocalDeploy = await deploy('ERC20Test', {
    from: deployer,
    args: [ethers.utils.parseUnits('1', 23), 'Test', 'Test'],
  });

  elysia = await hre.ethers.getContractAt(elysiaLocalDeploy.abi, elysiaLocalDeploy.address);

  console.log(`Asset address ${elysia.address}`)

  return elysia;
};

const deployTest: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const elysia = await getElysia(hre, deployer);

  const connector = await deploy('Connector', {
    from: deployer,
    log: true,
  });

  const moneyPool = await deploy('MoneyPool', {
    from: deployer,
    args: ['16', connector.address],
    log: true,
  });

  const interestRateModel = await deploy('InterestRateModel', {
    from: deployer,
    args: [
      defaultInterestModelParams.optimalUtilizationRate,
      defaultInterestModelParams.borrowRateBase,
      defaultInterestModelParams.borrowRateOptimal,
      defaultInterestModelParams.borrowRateMax,
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
    defaultReserveData.moneyPoolFactor
  );

  if (hre.network.name === 'ganache') return;

  await hre.run("verify:verify", {
    address: connector.address
  })

  await hre.run("verify:verify", {
    address: moneyPool.address,
    constructorArguments: [
      16,
      connector.address
    ],
  })

  await hre.run("verify:verify", {
    address: interestRateModel.address,
    constructorArguments: [
      defaultInterestModelParams.optimalUtilizationRate,
      defaultInterestModelParams.borrowRateBase,
      defaultInterestModelParams.borrowRateOptimal,
      defaultInterestModelParams.borrowRateMax
    ],
  })

  await hre.run("verify:verify", {
    address: lToken.address,
    constructorArguments: [
      moneyPool.address, elysia?.address, 'testLToken', 'L'
    ],
  })

  await hre.run("verify:verify", {
    address: dToken.address,
    constructorArguments: [
      moneyPool.address, elysia?.address, 'testDToken', 'D'
    ],
  })

  await hre.run("verify:verify", {
    address: tokenizer.address,
    constructorArguments: [
      connector.address, moneyPool.address, 'testTokenizer', 'T'
    ],
  })
  await hre.run("verify:verify", {
    address: dataPipeline.address,
    constructorArguments: [
      moneyPool.address
    ],
  })
};

export default deployTest;
