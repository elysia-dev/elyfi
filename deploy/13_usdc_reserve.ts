import hre from 'hardhat';
import { DeployFunction } from 'hardhat-deploy/types';
import { usdcReserveData } from '../data/moneyPool/reserves';
import { getElyfi, getUsdc } from '../utils/getDependencies';

const deploy: DeployFunction = async function () {
  const adminAddress = '0x715B006d4723977CcDb1581a62948f6354752e62';
  const address2 = '0xA929022c9107643515F5c777cE9a910F0D1e490C';
  const admin = hre.ethers.provider.getSigner(adminAddress);
  console.log(admin);
  const deployer = admin._address;
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
    const IncentivePool = await hre.ethers.getContractFactory('IncentivePool');
    const incentivePool = await IncentivePool.deploy(
      moneyPool.address,
      incentiveAsset.address,
      reserveData.incentivePool.incentiveAmountPerSecond
    );
    console.log(incentivePool);

    const InterestRateModel = await hre.ethers.getContractFactory('InterestRateModel');
    const interestRateModel = await InterestRateModel.deploy(
      reserveData.interestRateModel.params.optimalUtilizationRate,
      reserveData.interestRateModel.params.borrowRateBase,
      reserveData.interestRateModel.params.borrowRateOptimal,
      reserveData.interestRateModel.params.borrowRateMax,
      connector.address
    );
    console.log(interestRateModel);

    const LToken = await hre.ethers.getContractFactory('LToken');
    const lToken = await LToken.deploy(
      moneyPool.address,
      underlyingAsset?.address,
      incentivePool.address,
      reserveData.lToken.name,
      reserveData.lToken.symbol
    );
    console.log(lToken);

    const DToken = await hre.ethers.getContractFactory('DToken');
    const dToken = await DToken.deploy(
      moneyPool.address,
      underlyingAsset?.address,
      reserveData.dToken.name,
      reserveData.dToken.symbol
    );
    console.log(dToken);

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
    console.log(tokenizer);

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
    console.log('addNewReserve done');
  } else {
    const incentivePool = await deploy(reserveData.incentivePool.name, {
      from: deployer,
      args: [
        moneyPool.address,
        incentiveAsset.address,
        reserveData.incentivePool.incentiveAmountPerSecond,
      ],
      log: true,
      contract: 'IncentivePool',
    });

    const interestRateModel = await deploy(reserveData.interestRateModel.name, {
      from: deployer,
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

    const lToken = await deploy(reserveData.lToken.name, {
      from: deployer,
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

    const dToken = await deploy(reserveData.dToken.name, {
      from: deployer,
      args: [
        moneyPool.address,
        underlyingAsset?.address,
        reserveData.dToken.name,
        reserveData.dToken.symbol,
      ],
      log: true,
      contract: 'DToken',
    });

    const tokenizer = await deploy(reserveData.tokenizer.name, {
      from: deployer,
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
    console.log('addNewReserve done');
  }
};

deploy.tags = ['usdc_reserve'];

export default deploy;
