import { Contract, ethers } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployedContract } from 'hardhat-deploy/types';
import path from 'path';

const getdependency = (hre: HardhatRuntimeEnvironment, dependency: string) => {
  const dependencies = {
    Dai: 'Dai.json',
    EL: 'ELToken.json',
    Elyfi: 'Elyfi.json',
  };
  const filePath = path.join(
    __dirname,
    '..',
    'dependencies',
    hre.network.name,
    dependencies[dependency as keyof typeof dependencies]
  );

  return filePath;
};

export const getElysia = async (hre: HardhatRuntimeEnvironment): Promise<Contract> => {
  const file = require(getdependency(hre, 'EL')) as DeployedContract;
  return await hre.ethers.getContractAt(file.abi, file.address);
};

export const getDai = async (hre: HardhatRuntimeEnvironment): Promise<Contract> => {
  const file = require(getdependency(hre, 'Dai')) as DeployedContract;

  return await hre.ethers.getContractAt(file.abi, file.address);
};

export const getElyfi = async (hre: HardhatRuntimeEnvironment): Promise<Contract> => {
  const file = require(getdependency(hre, 'Elyfi')) as DeployedContract;
  return await hre.ethers.getContractAt(file.abi, file.address);
};
