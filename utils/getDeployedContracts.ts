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

type DeployedContract = {
  address: string;
  abi: [];
};

async function getDeployedContract(
  hre: HardhatRuntimeEnvironment,
  deployedContract: DeployedContract,
  signer: SignerWithAddress
): Promise<Contract> {
  return getContractAt(hre, deployedContract.abi, deployedContract.address, signer);
}
//need refactor
export const getDeployedContracts = async (
  hre: HardhatRuntimeEnvironment,
  deployer: SignerWithAddress
): Promise<ElyfiContracts | null> => {
  let underlyingAsset!: ERC20Test;
  let connector!: Connector;
  let moneyPool!: MoneyPoolTest;
  let incentiveAsset!: ERC20Test;
  let incentivePool!: IncentivePool;
  let interestRateModel!: InterestRateModel;
  let lToken!: LToken;
  let dToken!: DToken;
  let tokenizer!: Tokenizer;
  let dataPipeline!: DataPipeline;

  const deploymentDataPath = path.join(__dirname, '..', 'deployments', hre.network.name);

  const files = fs.readdirSync(deploymentDataPath);

  const getDeployedContract = (deployedContract: DeployedContract) => {
    return getContractAt(hre, deployedContract.abi, deployedContract.address, deployer);
  };

  for (const file of files) {
    if (path.extname(file) == '.json') {
      const deployedContract = require(path.join(deploymentDataPath, file)) as DeployedContract;

      switch (file) {
        case 'Connector.json':
          try {
            connector = (await getDeployedContract(deployedContract)) as Connector;
          } catch (e) {
            console.log(e);
          }
          break;

        case 'IncentivePool.json':
          try {
            incentivePool = (await getDeployedContract(deployedContract)) as IncentivePool;
          } catch (e) {
            console.log(e);
          }
          break;

        case 'DataPipeline.json':
          try {
            dataPipeline = (await getDeployedContract(deployedContract)) as DataPipeline;
          } catch (e) {
            console.log(e);
          }
          break;

        case 'DToken.json':
          try {
            dToken = (await getDeployedContract(deployedContract)) as DToken;
          } catch (e) {
            console.log(e);
          }
          break;

        case 'ERC20Test.json':
          try {
            underlyingAsset = (await getDeployedContract(deployedContract)) as ERC20Test;
          } catch (e) {
            console.log(e);
          }
          break;

        case 'ERC20Test.json':
          try {
            incentiveAsset = (await getDeployedContract(deployedContract)) as ERC20Test;
          } catch (e) {
            console.log(e);
          }
          break;

        case 'InteresRateModel.json':
          try {
            interestRateModel = (await getDeployedContract(deployedContract)) as InterestRateModel;
          } catch (e) {
            console.log(e);
          }
          break;

        case 'LToken.json':
          try {
            lToken = (await getDeployedContract(deployedContract)) as LToken;
          } catch (e) {
            console.log(e);
          }
          break;

        case 'MoneyPool.json':
          try {
            moneyPool = (await getDeployedContract(deployedContract)) as MoneyPoolTest;
          } catch (e) {
            console.log(e);
          }
          break;

        case 'Tokenizer.json':
          try {
            tokenizer = (await getDeployedContract(deployedContract)) as Tokenizer;
          } catch (e) {
            console.log(e);
          }
          break;
      }
    }
  }

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
