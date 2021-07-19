import '@nomiclabs/hardhat-waffle';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import path from 'path';
import { Contract } from 'ethers';

type DeployedContract = {
  address: string;
  abi: [];
};

const getDeploymentPath = (network: string, file: string) => {
  return path.join(__dirname, '..', 'deployments', network, file);
};

const elyfi = {
  MoneyPool: 'MoneyPool.json',
  Connector: 'Connector.json',
  DataPipeline: 'DataPipeline.json',
  DToken: 'DToken.json',
  LToken: 'LToken.json',
  Tokenizer: 'Tokenizer.json',
  InterestRateModel: 'InterestRateModel.json',
  IncentivePool: 'IncentivePool.json',
};

export const getMoneyPool = async (hre: HardhatRuntimeEnvironment): Promise<Contract> => {
  const file = require(getDeploymentPath(hre.network.name, elyfi.MoneyPool)) as DeployedContract;
  return await hre.ethers.getContractAt(file.abi, file.address);
};

export const getConnector = async (hre: HardhatRuntimeEnvironment): Promise<Contract> => {
  const file = require(getDeploymentPath(hre.network.name, elyfi.Connector)) as DeployedContract;
  return await hre.ethers.getContractAt(file.abi, file.address);
};

export const getLToken = async (hre: HardhatRuntimeEnvironment): Promise<Contract> => {
  const file = require(getDeploymentPath(hre.network.name, elyfi.LToken)) as DeployedContract;
  return await hre.ethers.getContractAt(file.abi, file.address);
};

export const getDToken = async (hre: HardhatRuntimeEnvironment): Promise<Contract> => {
  const file = require(getDeploymentPath(hre.network.name, elyfi.DToken)) as DeployedContract;
  return await hre.ethers.getContractAt(file.abi, file.address);
};

export const getTokenizer = async (hre: HardhatRuntimeEnvironment): Promise<Contract> => {
  const file = require(getDeploymentPath(hre.network.name, elyfi.Tokenizer)) as DeployedContract;
  return await hre.ethers.getContractAt(file.abi, file.address);
};

export const getInterestRateModel = async (hre: HardhatRuntimeEnvironment): Promise<Contract> => {
  const file = require(getDeploymentPath(
    hre.network.name,
    elyfi.InterestRateModel
  )) as DeployedContract;
  return await hre.ethers.getContractAt(file.abi, file.address);
};

export const getIncentivePool = async (hre: HardhatRuntimeEnvironment): Promise<Contract> => {
  const file = require(getDeploymentPath(
    hre.network.name,
    elyfi.IncentivePool
  )) as DeployedContract;
  return await hre.ethers.getContractAt(file.abi, file.address);
};
