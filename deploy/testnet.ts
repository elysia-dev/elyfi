import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import {
  testIncentiveAmountPerSecond,
  testInterestModelParams,
  testReserveData,
} from '../test/utils/testData';
import { getContractAt } from 'hardhat-deploy-ethers/dist/src/helpers';
import { MoneyPool } from '../typechain';
import {
  getAssetBond,
  getDai,
  getElyfi,
  getIndex,
  getRate,
  deployTimeConverter,
  deployValidation,
} from './utils/contractDeployer';
import { ethers } from 'hardhat';

export enum ELYFIContractType {
  CONNECTOR,
  MONEYPOOL,
  LTOKEN,
  DTOKEN,
  TOKENIZER,
  DATA_PIPELINE,
}
const deployTestnet: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const testUnderlyingAsset = await getDai(hre, deployer);

  const testIncentiveAsset = await getElyfi(hre, deployer);

  const timeConverter = await deployTimeConverter(hre);

  const index = await getIndex(hre);

  const rate = await getRate(hre);

  const validation = await deployValidation(hre);

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
    args: [moneyPool.address, testIncentiveAsset.address, testIncentiveAmountPerSecond],
    log: true,
  });

  const interestRateModel = await deploy('InterestRateModel', {
    from: deployer,
    args: [
      testInterestModelParams.optimalUtilizationRate,
      testInterestModelParams.borrowRateBase,
      testInterestModelParams.borrowRateOptimal,
      testInterestModelParams.borrowRateMax,
    ],
    log: true,
  });

  const lToken = await deploy('LToken', {
    from: deployer,
    args: [
      moneyPool.address,
      testUnderlyingAsset?.address,
      incentivePool.address,
      'testLToken',
      'L',
    ],
    log: true,
  });

  const dToken = await deploy('DToken', {
    from: deployer,
    args: [moneyPool.address, testUnderlyingAsset?.address, 'testDToken', 'D'],
    log: true,
  });

  const tokenizer = await deploy('Tokenizer', {
    from: deployer,
    args: [connector.address, moneyPool.address, 'testTokenizer', 'T'],
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

  console.log('deploy done');

  const deployedMoneyPool = (await getContractAt(
    hre,
    moneyPool.abi,
    moneyPool.address,
    deployer
  )) as MoneyPool;

  // const deployedTestAsset = (await getContractAt(
  //   hre,
  //   testIncentiveAsset.abi,
  //   testIncentiveAsset.address,
  //   deployer
  // )) as ERC20Test;

  const addNewReserveTx = await deployedMoneyPool.addNewReserve(
    testUnderlyingAsset?.address,
    lToken.address,
    dToken.address,
    interestRateModel.address,
    tokenizer.address,
    incentivePool.address,
    testReserveData.moneyPoolFactor
  );

  const reserveData = await deployedMoneyPool.getReserveData(testUnderlyingAsset?.address);

  console.log('addNewReserve done');

  await testIncentiveAsset.transfer(incentivePool.address, ethers.utils.parseEther('5000000'));

  if (hre.network.name === 'ganache') return;

  await hre.run('etherscan-verify', {
    network: hre.network.name,
  });
};

deployTestnet.tags = ['testnet'];

export default deployTestnet;
