import '@nomiclabs/hardhat-waffle';
import { getContractAt } from 'hardhat-deploy-ethers/dist/src/helpers';
import {
  Tokenizer,
  Connector,
  DataPipeline,
  DToken,
  InterestRateModel,
  LToken,
  MoneyPoolTest,
  ERC20Test,
  IncentivePool,
} from '../typechain';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import ElyfiContracts from '../test/types/ElyfiContracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import fs from 'fs';
import path from 'path';
import { Contract } from 'ethers';
import { getDai, getElyfi } from './getDependencies';

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
//need refactor
export const getDeployedContracts = async (
  hre: HardhatRuntimeEnvironment,
  deployer: SignerWithAddress
): Promise<ElyfiContracts | null> => {
  let underlyingAsset = (await getDai(hre)) as ERC20Test;
  let connector = (await getConnector(hre)) as Connector;
  let moneyPool = (await getMoneyPool(hre)) as MoneyPoolTest;
  let incentiveAsset = (await getElyfi(hre)) as ERC20Test;
  let incentivePool!: IncentivePool;
  let interestRateModel!: InterestRateModel;
  let lToken!: LToken;
  let dToken!: DToken;
  let tokenizer!: Tokenizer;
  let dataPipeline!: DataPipeline;

  const elyfiContracts = {
    underlyingAsset,
    incentiveAsset,
    connector,
    moneyPool,
    incentivePool,
    interestRateModel,
    lToken,
    dToken,
    tokenizer,
    dataPipeline,
  };

  return !!elyfiContracts ? elyfiContracts : null;
};

export default getDeployedContracts;
