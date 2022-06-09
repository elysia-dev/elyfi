import { JsonRpcSigner } from '@ethersproject/providers';
import hre from 'hardhat';
import { DeployFunction } from 'hardhat-deploy/types';
import { usdcReserveData } from '../data/moneyPool/reserves';
import { getElyfi, getUsdc } from '../utils/getDependencies';

const deploy: DeployFunction = async function () {
  const { deploy, get } = hre.deployments;
  const moneyPool = await get('MoneyPool');
  const connector = await get('Connector');
  const assetBond = await get('AssetBond');
  const validation = await get('Validation');
  const timeConverter = await get('TimeConverter');

  // Assets depend on the reserve
  let underlyingAsset = await getUsdc(hre);
  let incentiveAsset = await getElyfi(hre);

  /*
  if (hre.network.name == 'ganache' || hre.network.name == 'hardhat') {
    const tokenDeployment = await deploy('ERC20Test', {
      from: deployer,
      args: [ethers.utils.parseUnits('1', 36), 'name', 'symbol'],
      log: true,
    });
    const token = await hre.ethers.getContractAt(tokenDeployment.abi, tokenDeployment.address);
    underlyingAsset = incentiveAsset = token;
  }
  */

  const reserveData = usdcReserveData;

  // Make sure core contracts not deployed again
  const deployedMoneyPool = await hre.ethers.getContractAt(moneyPool.abi, moneyPool.address);

  if (hre.network.name == 'ganache' || hre.network.name == 'hardhat') {
    const adminAddress = '0x715B006d4723977CcDb1581a62948f6354752e62';
    const admin = hre.ethers.provider.getSigner(adminAddress);

    const IncentivePool = await hre.ethers.getContractFactory('IncentivePool');
    const incentivePool = await IncentivePool.deploy(
      moneyPool.address,
      incentiveAsset.address,
      reserveData.incentivePool.incentiveAmountPerSecond
    );
    console.log(`incentivePool.address: ${incentivePool.address}`);

    const InterestRateModel = await hre.ethers.getContractFactory('InterestRateModel');
    const interestRateModel = await InterestRateModel.deploy(
      reserveData.interestRateModel.params.optimalUtilizationRate,
      reserveData.interestRateModel.params.borrowRateBase,
      reserveData.interestRateModel.params.borrowRateOptimal,
      reserveData.interestRateModel.params.borrowRateMax,
      connector.address
    );
    console.log(`interestRateModel.address: ${interestRateModel.address}`);

    const LToken = await hre.ethers.getContractFactory('LToken');
    const lToken = await LToken.deploy(
      moneyPool.address,
      underlyingAsset?.address,
      incentivePool.address,
      reserveData.lToken.name,
      reserveData.lToken.symbol
    );
    console.log(`lToken: ${lToken.address}`);

    const DToken = await hre.ethers.getContractFactory('DToken');
    const dToken = await DToken.deploy(
      moneyPool.address,
      underlyingAsset?.address,
      reserveData.dToken.name,
      reserveData.dToken.symbol
    );
    console.log(`dToken: ${dToken.address}`);

    const Tokenizer = await hre.ethers.getContractFactory('Tokenizer', {
      libraries: {
        AssetBond: assetBond.address,
        Validation: validation.address,
        TimeConverter: timeConverter.address,
      },
    });
    const tokenizer = await Tokenizer.deploy(
      connector.address,
      moneyPool.address,
      reserveData.tokenizer.name,
      reserveData.tokenizer.symbol
    );
    console.log(`tokenizer: ${tokenizer.address}`);

    const addNewReserveTx = await deployedMoneyPool
      .connect(admin)
      .addNewReserve(
        underlyingAsset?.address,
        lToken.address,
        dToken.address,
        interestRateModel.address,
        tokenizer.address,
        incentivePool.address,
        reserveData.moneyPoolFactor
      );
    console.log(addNewReserveTx);
  } else {
    const { deployer: deployerAddress } = await hre.getNamedAccounts();
    const deployer: JsonRpcSigner = hre.ethers.provider.getSigner(deployerAddress);

    const incentivePool = await deploy(reserveData.incentivePool.name, {
      from: deployerAddress,
      args: [
        moneyPool.address,
        incentiveAsset.address,
        reserveData.incentivePool.incentiveAmountPerSecond,
      ],
      log: true,
      contract: 'IncentivePool',
    });
    console.log(`incentivePool.address: ${incentivePool.address}`);

    const interestRateModel = await deploy(reserveData.interestRateModel.name, {
      from: deployerAddress,
      args: [
        reserveData.interestRateModel.params.optimalUtilizationRate,
        reserveData.interestRateModel.params.borrowRateBase,
        reserveData.interestRateModel.params.borrowRateOptimal,
        reserveData.interestRateModel.params.borrowRateMax,
        connector.address,
      ],
      log: true,
      contract: 'InterestRateModel',
    });
    console.log(`interestRateModel.address: ${interestRateModel.address}`);

    const lToken = await deploy(reserveData.lToken.name, {
      from: deployerAddress,
      args: [
        moneyPool.address,
        underlyingAsset?.address,
        incentivePool.address,
        reserveData.lToken.name,
        reserveData.lToken.symbol,
      ],
      log: true,
      contract: 'LToken',
    });
    console.log(`lToken: ${lToken.address}`);

    const dToken = await deploy(reserveData.dToken.name, {
      from: deployerAddress,
      args: [
        moneyPool.address,
        underlyingAsset?.address,
        reserveData.dToken.name,
        reserveData.dToken.symbol,
      ],
      log: true,
      contract: 'DToken',
    });
    console.log(`dToken: ${dToken.address}`);

    const tokenizer = await deploy(reserveData.tokenizer.name, {
      from: deployerAddress,
      args: [
        connector.address,
        moneyPool.address,
        reserveData.tokenizer.name,
        reserveData.tokenizer.symbol,
      ],
      log: true,
      libraries: {
        AssetBond: assetBond.address,
        Validation: validation.address,
        TimeConverter: timeConverter.address,
      },
      contract: 'Tokenizer',
    });
    console.log(`tokenizer: ${tokenizer.address}`);

    const addNewReserveTx = await deployedMoneyPool
      .connect(deployer)
      .addNewReserve(
        underlyingAsset?.address,
        lToken.address,
        dToken.address,
        interestRateModel.address,
        tokenizer.address,
        incentivePool.address,
        reserveData.moneyPoolFactor
      );
    console.log(addNewReserveTx);

    await hre.run('etherscan-verify', {
      network: hre.network.name,
    });
  }
};

deploy.tags = ['usdc_reserve'];

export default deploy;
