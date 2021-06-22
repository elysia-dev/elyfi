import '@nomiclabs/hardhat-waffle';
import { getContractAt } from 'hardhat-deploy-ethers/dist/src/helpers';
import {
  ERC20,
  Tokenizer,
  Connector,
  DataPipeline,
  DToken,
  InterestRateModel,
  LToken,
  MoneyPoolTest,
  ERC20Test,
} from '../../typechain';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import fs from 'fs';
import ElyfiContracts from '../..//test/types/ElyfiContracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import path from 'path';

type DeployedContract = {
  address: string;
  abi: [];
};

//need refactor
export const getDeployedContracts = async (
  hre: HardhatRuntimeEnvironment,
  deployer: SignerWithAddress
): Promise<ElyfiContracts | null> => {
  let underlyingAsset!: ERC20Test;
  let connector!: Connector;
  let moneyPool!: MoneyPoolTest;
  let interestRateModel!: InterestRateModel;
  let lToken!: LToken;
  let dToken!: DToken;
  let tokenizer!: Tokenizer;
  let dataPipeline!: DataPipeline;

  const deploymentDataPath = path.join(__dirname, '..', '..', 'deployments', 'ganache');

  const files = fs.readdirSync(deploymentDataPath);

  for (const file of files) {
    if (path.extname(file) == '.json') {
      const deployedContract = require(path.join(deploymentDataPath, file)) as DeployedContract;

      switch (file) {
        case 'Connector.json':
          try {
            connector = (await getContractAt(
              hre,
              deployedContract.abi,
              deployedContract.address,
              deployer
            )) as Connector;
          } catch (e) {
            console.log(e);
          }
          break;
        case 'DataPipeline.json':
          try {
            dataPipeline = (await getContractAt(
              hre,
              deployedContract.abi,
              deployedContract.address,
              deployer
            )) as DataPipeline;
          } catch (e) {
            console.log(e);
          }
          break;

        case 'DToken.json':
          try {
            dToken = (await getContractAt(
              hre,
              deployedContract.abi,
              deployedContract.address,
              deployer
            )) as DToken;
          } catch (e) {
            console.log(e);
          }
          break;

        case 'ERC20Test.json':
          try {
            underlyingAsset = (await getContractAt(
              hre,
              deployedContract.abi,
              deployedContract.address,
              deployer
            )) as ERC20;
          } catch (e) {
            console.log(e);
          }
          break;

        case 'InteresRateModel.json':
          try {
            interestRateModel = (await getContractAt(
              hre,
              deployedContract.abi,
              deployedContract.address,
              deployer
            )) as InterestRateModel;
          } catch (e) {
            console.log(e);
          }
          break;

        case 'LToken.json':
          try {
            lToken = (await getContractAt(
              hre,
              deployedContract.abi,
              deployedContract.address,
              deployer
            )) as LToken;
          } catch (e) {
            console.log(e);
          }
          break;

        case 'MoneyPool.json':
          try {
            moneyPool = (await getContractAt(
              hre,
              deployedContract.abi,
              deployedContract.address,
              deployer
            )) as MoneyPoolTest;
          } catch (e) {
            console.log(e);
          }
          break;

        case 'Tokenizer.json':
          try {
            tokenizer = (await getContractAt(
              hre,
              deployedContract.abi,
              deployedContract.address,
              deployer
            )) as Tokenizer;
          } catch (e) {
            console.log(e);
          }
          break;
      }
    }
  }

  const elyfiContracts = {
    underlyingAsset,
    connector,
    moneyPool,
    interestRateModel,
    lToken,
    dToken,
    tokenizer,
    dataPipeline,
  };

  return !!elyfiContracts ? elyfiContracts : null;
};

export default getDeployedContracts;
