import { Contract, ethers } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployedContract } from 'hardhat-deploy/types';
import path from 'path';

const dependencies = {
  mainnet: { Dai: 'Dai.json', EL: 'ELToken.json', Elyfi: 'Elyfi.json' },
  ropsten: { Dai: 'Dai.json', EL: 'ELToken.json', Elyfi: 'Elyfi.json' },
};

export const getElysia = async (hre: HardhatRuntimeEnvironment): Promise<Contract> => {
  const filePath = path.join(
    __dirname,
    '..',
    'dependencies',
    hre.network.name,
    dependencies[hre.network.name as keyof typeof dependencies].EL
  );
  const file = require(filePath) as DeployedContract;

  return await hre.ethers.getContractAt(file.abi, file.address);
};

export const getDai = async (hre: HardhatRuntimeEnvironment): Promise<Contract> => {
  const filePath = path.join(
    __dirname,
    '..',
    'dependencies',
    hre.network.name,
    dependencies[hre.network.name as keyof typeof dependencies].Dai
  );
  const file = require(filePath) as DeployedContract;

  return await hre.ethers.getContractAt(file.abi, file.address);
};

export const getElyfi = async (hre: HardhatRuntimeEnvironment): Promise<Contract> => {
  const filePath = path.join(
    __dirname,
    '..',
    'dependencies',
    hre.network.name,
    dependencies[hre.network.name as keyof typeof dependencies].Elyfi
  );
  const file = require(filePath) as DeployedContract;

  return await hre.ethers.getContractAt(file.abi, file.address);
};
