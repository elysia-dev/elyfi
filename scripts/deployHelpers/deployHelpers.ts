import { Contract } from 'ethers';
import { join } from 'path';
import { Low, JSONFile } from 'lowdb';
import { ethers } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { Connector__factory } from '../../typechain';

export enum ELYFIContractType {
  CONNECTOR,
  MONEYPOOL,
  LTOKEN,
  DTOKEN,
  TOKENIZER,
  DATA_PIPELINE,
}

export type DeployedContractData = {
  contractName: ELYFIContractType[];
  contractAddress: string[];
  [key: string]: string[] | ELYFIContractType[];
};

export async function saveDeployedContractInDB(
  contractType: ELYFIContractType,
  contractInstance: Contract
) {
  const file = join(__dirname, 'db.json');
  const adapter = new JSONFile<DeployedContractData>(file);
  const db = new Low<DeployedContractData>(adapter);

  await db.read();

  db.data ||= { contractAddress: [], contractName: [] };

  db.data.contractAddress.push(contractInstance.address);
  db.data.contractName.push(contractType);

  await db.write();
}

export const deployConnector: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy('Connector', {
    from: deployer,
  });
  //const factory = (await ethers.getContractFactory('Connector', deployer)) as Connector__factory;

  //const connector = await factory.deploy();
};

// export async function deployConnector() {
//   const connectorFactory = (await ethers.getContractFactory(
//     'Connector',
//     deployer
//   )) as Connector__factory;
// }
