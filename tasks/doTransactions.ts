import { task } from 'hardhat/config';
import '@nomiclabs/hardhat-waffle';
import { getContractAt } from 'hardhat-deploy-ethers/dist/src/helpers';
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
import ElyfiContracts from '../test/types/ElyfiContracts';
import getDeployedContracts from '../test/utils/getDeployedContracts';

interface Args {
  pool: string;
  asset: string;
  bond: string;
}

task('createDeposit', 'Create deposit : 1500ETH').setAction(
  async (hre: HardhatRuntimeEnvironment) => {
    const [deployer, account1] = await hre.ethers.getSigners();
    const deployedContract = (await getDeployedContracts(hre, deployer)) as ElyfiContracts;

    const deployedMoneyPool = deployedContract.moneyPool;

    const deployedAsset = deployedContract.underlyingAsset;

    await deployedAsset
      .connect(deployer)
      .transfer(account1.address, ethers.utils.parseEther('1000'));

    await deployedAsset
      .connect(account1)
      .approve(deployedMoneyPool.address, ethers.utils.parseEther('1500'));

    await deployedMoneyPool
      .connect(account1)
      .deposit(deployedAsset.address, account1.address, ethers.utils.parseEther('100'));

    // await deployedMoneyPool
    //   .connect(account1)
    //   .deposit(args.asset, account1.address, ethers.utils.parseEther('500'));

    console.log(`${account1.address} deposits 1000ETH and 500ETH`);
  }
);

task('createWithdraw', 'Create withdraw : 1500ETH').setAction(
  async (hre: HardhatRuntimeEnvironment) => {
    const [deployer, account1] = await hre.ethers.getSigners();
    const deployedContract = (await getDeployedContracts(hre, deployer)) as ElyfiContracts;

    const deployedMoneyPool = deployedContract.moneyPool;

    const deployedAsset = deployedContract.underlyingAsset;

    await deployedMoneyPool
      .connect(account1)
      .withdraw(deployedAsset.address, account1.address, ethers.utils.parseEther('1000'));

    await deployedMoneyPool
      .connect(account1)
      .withdraw(deployedAsset.address, account1.address, ethers.utils.parseEther('500'));

    console.log(`${account1.address} withdraws 1000ETH and 500ETH`);
  }
);

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
