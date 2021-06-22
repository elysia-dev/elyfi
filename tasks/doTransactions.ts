import { task } from 'hardhat/config';
import '@nomiclabs/hardhat-waffle';
import { getContract, getContractAt } from 'hardhat-deploy-ethers/dist/src/helpers';
import {
  MoneyPool,
  ERC20,
  Tokenizer,
  Connector,
  DataPipeline,
  DToken,
  InterestRateModel,
  LToken,
  MoneyPoolTest,
  ERC20Test,
} from '../typechain';
import MoneyPoolABI from '../data/abi/MoneyPool.json';
import ERC20ABI from '../data/abi/ERC20.json';
import TokenizerABI from '../data/abi/Tokenizer.json';
import { ethers, Wallet } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import fs from 'fs';
import ElyfiContracts from '../test/types/ElyfiContracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import path from 'path';

interface Args {
  pool: string;
  asset: string;
  bond: string;
}

type DeployedContract = {
  address: string;
  abi: [];
};

export const getDeployedContracts = async (
  hre: HardhatRuntimeEnvironment,
  deployer: SignerWithAddress
): Promise<ElyfiContracts | null> => {
  let elyfiContracts!: ElyfiContracts;
  let underlyingAsset!: ERC20Test;
  let connector!: Connector;
  let moneyPool!: MoneyPoolTest;
  let interestRateModel!: InterestRateModel;
  let lToken!: LToken;
  let dToken!: DToken;
  let tokenizer!: Tokenizer;
  let dataPipeline!: DataPipeline;

  const deploymentDataPath = path.join(__dirname, '..', 'deployments', 'ganache');

  const files = fs.readdirSync(deploymentDataPath);

  for (const file of files) {
    if (path.extname(file) == '.json') {
      const deployedContract = require(path.join(deploymentDataPath, file)) as DeployedContract;

      switch (file) {
        case 'Connector.json':
          connector = (await getContractAt(
            hre,
            deployedContract.abi,
            deployedContract.address,
            deployer
          )) as Connector;
          break;
        case 'DataPipeline.json':
          dataPipeline = (await getContractAt(
            hre,
            deployedContract.abi,
            deployedContract.address,
            deployer
          )) as DataPipeline;
          break;

        case 'DToken.json':
          dToken = (await getContractAt(
            hre,
            deployedContract.abi,
            deployedContract.address,
            deployer
          )) as DToken;
          break;

        case 'ERC20Test.json':
          underlyingAsset = (await getContractAt(
            hre,
            deployedContract.abi,
            deployedContract.address,
            deployer
          )) as ERC20;
          break;

        case 'InteresRateModel.json':
          interestRateModel = (await getContractAt(
            hre,
            deployedContract.abi,
            deployedContract.address,
            deployer
          )) as InterestRateModel;
          break;

        case 'LToken.json':
          lToken = (await getContractAt(
            hre,
            deployedContract.abi,
            deployedContract.address,
            deployer
          )) as LToken;
          break;

        case 'MoneyPool.json':
          moneyPool = (await getContractAt(
            hre,
            deployedContract.abi,
            deployedContract.address,
            deployer
          )) as MoneyPoolTest;
          break;

        case 'Tokenizer.json':
          tokenizer = (await getContractAt(
            hre,
            deployedContract.abi,
            deployedContract.address,
            deployer
          )) as Tokenizer;
          break;
      }
    }
  }

  elyfiContracts = {
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
  // return {
  //   underlyingAsset,
  //   connector,
  //   moneyPool,
  //   interestRateModel,
  //   lToken,
  //   dToken,
  //   tokenizer,
  //   dataPipeline,
  // };
};

task('createDeposit', 'Create deposit : 1500ETH')
  .addParam('asset', "The asset's address")
  .addParam('pool', "The moneypool's address")
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const [deployer, account1] = await hre.ethers.getSigners();
    const deployedContract = await getDeployedContracts(hre, deployer);

    // const deployedMoneyPool = (await getContractAt(
    //   hre,
    //   MoneyPoolABI,
    //   args.pool,
    //   deployer
    // )) as MoneyPool;

    // const deployedMoneyPool = deployedContract.moneyPool;

    // const deployedAsset = (await getContractAt(hre, ERC20ABI, args.asset, deployer)) as ERC20;

    // await deployedAsset.transfer(account1.address, ethers.utils.parseEther('1000'));

    // await deployedAsset.connect(account1).approve(args.pool, ethers.utils.parseEther('1500'));

    // await deployedMoneyPool
    //   .connect(account1)
    //   .deposit(args.asset, account1.address, ethers.utils.parseEther('1000'));

    // await deployedMoneyPool
    //   .connect(account1)
    //   .deposit(args.asset, account1.address, ethers.utils.parseEther('500'));

    // console.log(`${account1.address} deposits 1000ETH and 500ETH`);
  });

task('createWithdraw', 'Create withdraw : 1500ETH')
  .addParam('asset', "The asset's address")
  .addParam('pool', "The moneypool's address")
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const [deployer, account1] = await hre.ethers.getSigners();

    const deployedMoneyPool = (await getContractAt(
      hre,
      MoneyPoolABI,
      args.pool,
      deployer
    )) as MoneyPool;

    const deployedAsset = (await getContractAt(hre, ERC20ABI, args.asset, deployer)) as ERC20;

    console.log(`${account1.address} withdraws 1000ETH and 500ETH`);
  });

task('createBorrow', 'Create borrow : 1500ETH')
  .addParam('asset', "The asset's address")
  .addParam('bond', 'The id of asset bond token')
  .addParam('pool', "The moneypool's address")
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const [deployer, account1] = await hre.ethers.getSigners();

    const deployedMoneyPool = (await getContractAt(
      hre,
      MoneyPoolABI,
      args.pool,
      deployer
    )) as MoneyPool;

    const deployedAsset = (await getContractAt(hre, ERC20ABI, args.asset, deployer)) as ERC20;

    const tx = await deployedMoneyPool.connect(account1).borrow(args.asset, args.bond);
    const borrowPrincipal = 1;

    console.log(
      `${account1.address} borrows against ${args.bond} which amount is ${borrowPrincipal}`
    );
  });

task('createRepay', 'Create repay : 1500ETH')
  .addParam('asset', "The asset's address")
  .addParam('bond', 'The id of asset bond token')
  .addParam('pool', "The moneypool's address")
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const [deployer, account1] = await hre.ethers.getSigners();

    const deployedMoneyPool = (await getContractAt(
      hre,
      MoneyPoolABI,
      args.pool,
      deployer
    )) as MoneyPool;

    const deployedAsset = (await getContractAt(hre, ERC20ABI, args.asset, deployer)) as ERC20;

    const tx = await deployedMoneyPool.connect(account1).borrow(args.asset, args.bond);
    const accruedDebtOnMoneyPool = 1;
    const feeOnCollateralServiceProvider = 1;

    console.log(
      `${account1.address} repays a loan on ${args.bond} which repayment amount is ${accruedDebtOnMoneyPool}, ${feeOnCollateralServiceProvider}`
    );
  });

task('createAssetBond', 'Create empty asset bond')
  .addParam('asset', "The asset's address")
  .addParam('pool', "The moneypool's address")
  .addParam('bond', 'The id of asset bond token')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const [deployer, account1] = await hre.ethers.getSigners();

    const deployedMoneyPool = (await getContractAt(
      hre,
      MoneyPoolABI,
      args.pool,
      deployer
    )) as MoneyPool;

    const deployedAsset = (await getContractAt(hre, ERC20ABI, args.asset, deployer)) as ERC20;

    const tokenizerAddress = (await deployedMoneyPool.getReserveData(args.asset)).tokenizerAddress;

    const deployedTokenizer = (await getContractAt(
      hre,
      TokenizerABI,
      tokenizerAddress
    )) as Tokenizer;

    await deployedTokenizer.mintAssetBond;

    const tx = await deployedTokenizer.connect(account1).mintAssetBond(args.asset, args.bond);
    const accruedDebtOnMoneyPool = 1;
    const feeOnCollateralServiceProvider = 1;

    console.log(
      `${account1.address} repays a loan on ${args.bond} which repayment amount is ${accruedDebtOnMoneyPool}, ${feeOnCollateralServiceProvider}`
    );
  });
