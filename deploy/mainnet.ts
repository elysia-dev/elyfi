import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { getContractAt } from 'hardhat-deploy-ethers/dist/src/helpers';
import { daiReserveData } from '../data/moneyPool/reserves';
import { MoneyPool } from '../typechain';
import {
  getAssetBond,
  getDai,
  getElyfi,
  getIndex,
  getRate,
  getTimeConverter,
  getValidation,
} from './utils/dependencies';

export enum ELYFIContractType {
  CONNECTOR,
  MONEYPOOL,
  LTOKEN,
  DTOKEN,
  TOKENIZER,
  DATA_PIPELINE,
}

const deployMainnet: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const productionDaiReserveData = { ...daiReserveData };

  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const dai = await getDai(hre, deployer);

  const incentiveElyfi = await getElyfi(hre, deployer);

  const timeConverter = await getTimeConverter(hre);

  const index = await getIndex(hre);

  const rate = await getRate(hre);

  const validation = await getValidation(hre);

  const assetBond = await getAssetBond(hre, timeConverter);

  const connector = await deploy('Connector', {
    from: deployer,
    log: true,
  });

  const moneyPool = await deploy('MoneyPool', {
    from: deployer,
    args: ['16', connector.address],
    log: true,
    libraries: {
      AssetBond: assetBond.address,
      Validation: validation.address,
      TimeConverter: timeConverter.address,
      Index: index.address,
      Rate: rate.address,
    },
  });

  const incentivePool = await deploy('IncentivePool', {
    from: deployer,
    args: [
      moneyPool.address,
      incentiveElyfi.address,
      productionDaiReserveData.incentiveAmountPerSecond,
    ],
  });

  const interestRateModel = await deploy('InterestRateModel', {
    from: deployer,
    args: [
      productionDaiReserveData.interestRateModel.optimalUtilizationRate,
      productionDaiReserveData.interestRateModel.borrowRateBase,
      productionDaiReserveData.interestRateModel.borrowRateOptimal,
      productionDaiReserveData.interestRateModel.borrowRateMax,
    ],
    log: true,
  });

  const lToken = await deploy('LToken', {
    from: deployer,
    args: [
      moneyPool.address,
      dai?.address,
      incentivePool.address,
      productionDaiReserveData.lToken.name,
      productionDaiReserveData.lToken.symbol,
    ],
    log: true,
  });

  const dToken = await deploy('DToken', {
    from: deployer,
    args: [
      moneyPool.address,
      dai?.address,
      productionDaiReserveData.dToken.name,
      productionDaiReserveData.dToken.symbol,
    ],
    log: true,
  });

  const tokenizer = await deploy('Tokenizer', {
    from: deployer,
    args: [
      connector.address,
      moneyPool.address,
      productionDaiReserveData.tokenizer.name,
      productionDaiReserveData.tokenizer.symbol,
    ],
    log: true,
    libraries: {
      AssetBond: assetBond.address,
      Validation: validation.address,
      TimeConverter: timeConverter.address,
    },
  });

  const dataPipeline = await deploy('DataPipeline', {
    from: deployer,
    args: [moneyPool.address],
    log: true,
  });

  const deployedMoneyPool = (await getContractAt(
    hre,
    moneyPool.abi,
    moneyPool.address,
    deployer
  )) as MoneyPool;

  const addNewReserveTx = await deployedMoneyPool.addNewReserve(
    dai?.address,
    lToken.address,
    dToken.address,
    interestRateModel.address,
    tokenizer.address,
    incentivePool.address,
    productionDaiReserveData.moneyPoolFactor
  );

  await addNewReserveTx.wait();

  await hre.run('etherscan-verify', {
    network: hre.network.name,
  });
};

deployMainnet.tags = ['mainnet'];

export default deployMainnet;
