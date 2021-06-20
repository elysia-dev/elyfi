import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import { getContractAt } from 'hardhat-deploy-ethers/dist/src/helpers';
import { MoneyPool, ERC20 } from '../typechain';
import MoneyPoolABI from '../data/abi/MoneyPool.json';
import ERC20ABI from '../data/abi/ERC20.json';
import { utils } from "ethers";

interface Args {
  pool: string
  asset: string
}

task("createDeposit", "Create deposit : 1500ETH")
  .addParam("asset", "The asset's address")
  .addParam("pool", "The moneypool's address")
  .setAction(async (args: Args, hre) => {
    const [deployer, account1] = await hre.ethers.getSigners();

    const deployedMoneyPool = (await getContractAt(
      hre,
      MoneyPoolABI,
      args.pool,
      deployer
    )) as MoneyPool;

    const deployedAsset = (await getContractAt(
      hre,
      ERC20ABI,
      args.asset,
      deployer
    )) as ERC20

    await deployedAsset.transfer(account1.address, utils.parseEther('1000'));

    await deployedAsset.connect(account1).approve(
      args.pool,
      utils.parseEther('1500')
    )

    await deployedMoneyPool.connect(account1).deposit(
      args.asset,
      account1.address,
      utils.parseEther('1000'),
    )

    await deployedMoneyPool.connect(account1).deposit(
      args.asset,
      account1.address,
      utils.parseEther('500'),
    )

    console.log(`${account1.address} dposits 1000ETH and 500ETH`)
  })

task("createWithdraw", "Create withdraw : 1500ETH")
  .addParam("asset", "The asset's address")
  .addParam("pool", "The moneypool's address")
  .setAction(async (args: Args, hre) => {
    const [deployer, account1] = await hre.ethers.getSigners();

    const deployedMoneyPool = (await getContractAt(
      hre,
      MoneyPoolABI,
      args.pool,
      deployer
    )) as MoneyPool;

    const deployedAsset = (await getContractAt(
      hre,
      ERC20ABI,
      args.asset,
      deployer
    )) as ERC20

    await deployedMoneyPool.connect(account1).withdraw(
      args.asset,
      account1.address,
      utils.parseEther('1000'),
    )

    await deployedMoneyPool.connect(account1).withdraw(
      args.asset,
      account1.address,
      utils.parseEther('500'),
    )

    console.log(`${account1.address} withdraws 1000ETH and 500ETH`)
  })