import { Contract, ethers } from 'ethers';
import { join } from 'path';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { defaultInterestModelParams, defaultReserveData } from '../test/utils/Interfaces';
import TestnetEL_ABI from '../dependencies/TestnetEL.json';
import ELToken_ABI from '../dependencies/ELToken.json';
import { getContractAt } from 'hardhat-deploy-ethers/dist/src/helpers';
import { MoneyPool } from '../typechain';
import { expandToDecimals } from '../test/utils/Ethereum';

export enum ELYFIContractType {
  CONNECTOR,
  MONEYPOOL,
  LTOKEN,
  DTOKEN,
  TOKENIZER,
  DATA_PIPELINE,
}

// export type DeployedContractData = {
//     contractName: ELYFIContractType[];
//     contractAddress: string[];
//     [key: string]: string[] | ELYFIContractType[];
//   };

//   export async function saveDeployedContractInDB(
//     contractType: ELYFIContractType,
//     contractInstance: Contract
//   ) {
//     const file = join(__dirname, 'db.json');
//     const adapter = new JSONFile<DeployedContractData>(file);
//     const db = new Low<DeployedContractData>(adapter);

//     await db.read();

//     db.data ||= { contractAddress: [], contractName: [] };

//     db.data.contractAddress.push(contractInstance.address);
//     db.data.contractName.push(contractType);

//     await db.write();
//   }

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
    args: [expandToDecimals(1, 23), 'Test', 'Test'],
  });

  elysia = await hre.ethers.getContractAt(elysiaLocalDeploy.abi, elysiaLocalDeploy.address);

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
      defaultInterestModelParams.optimalUtilizationRate.toFixed(),
      defaultInterestModelParams.borrowRateBase.toFixed(),
      defaultInterestModelParams.borrowRateOptimal.toFixed(),
      defaultInterestModelParams.borrowRateMax.toFixed(),
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
    args: [connector.address, 'testTokenizer', 'T'],
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
    defaultReserveData.moneyPoolFactor.toFixed()
  );
};

export default deployTest;
