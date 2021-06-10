import {
  LTokenTest,
  LTokenTest__factory,
  MoneyPoolTest,
  MoneyPoolTest__factory,
  ERC20Test,
  ERC20Test__factory,
  InterestRateModel,
  InterestRateModel__factory,
  TokenizerTest,
  TokenizerTest__factory,
  Connector,
  Connector__factory,
  DataPipeline,
  DataPipeline__factory,
  DTokenTest,
  DTokenTest__factory,
} from '../../typechain';
import { BigNumber } from 'bignumber.js';
import { Contract, Wallet } from 'ethers';
import { ethers } from 'hardhat';
import { defaultInterestModelParams, defaultReserveData, InterestModelParams } from './Interfaces';
import ElyfiContracts from '../types/ElyfiContracts';

export async function makeUnderlyingAsset({
  deployer,
  totalSupply = ethers.utils.parseUnits('1', 36).toString(),
  name = defaultReserveData.underlyingAssetName,
  symbol = defaultReserveData.underlyingAssetSymbol,
}: {
  deployer: Wallet;
  totalSupply?: string;
  name?: string;
  symbol?: string;
}): Promise<ERC20Test> {
  let underlyingAsset: ERC20Test;

  const underlyingAssetFactory = (await ethers.getContractFactory(
    'ERC20Test',
    deployer
  )) as ERC20Test__factory;

  underlyingAsset = await underlyingAssetFactory.deploy(totalSupply, name, symbol);

  return underlyingAsset;
}

export async function makeConnector({ deployer }: { deployer: Wallet }): Promise<Connector> {
  let connector: Connector;

  const connectorFactory = (await ethers.getContractFactory(
    'Connector',
    deployer
  )) as Connector__factory;

  connector = await connectorFactory.deploy();

  return connector;
}

export async function makeMoneyPool({
  deployer,
  maxReserveCount_ = new BigNumber(16).toString(),
  connector,
}: {
  deployer: Wallet;
  maxReserveCount_?: string;
  connector: Connector | Contract;
}): Promise<MoneyPoolTest> {
  let moneyPoolTest: MoneyPoolTest;

  const moneyPoolFactory = (await ethers.getContractFactory(
    'MoneyPoolTest',
    deployer
  )) as MoneyPoolTest__factory;

  moneyPoolTest = await moneyPoolFactory.deploy(maxReserveCount_, connector.address);

  return moneyPoolTest;
}

export async function makeLToken({
  deployer,
  moneyPool,
  underlyingAsset,
  lTokenName = 'LToken',
  lTokenSymbol = 'LT',
}: {
  deployer: Wallet;
  moneyPool: MoneyPoolTest | Contract;
  underlyingAsset: Contract;
  lTokenName?: string;
  lTokenSymbol?: string;
}): Promise<LTokenTest> {
  let lTokenTest: LTokenTest;

  const lTokenFactory = (await ethers.getContractFactory(
    'LTokenTest',
    deployer
  )) as LTokenTest__factory;

  lTokenTest = await lTokenFactory.deploy(
    moneyPool.address,
    underlyingAsset.address,
    lTokenName,
    lTokenSymbol
  );

  return lTokenTest;
}

export async function makeDToken({
  deployer,
  moneyPool,
  underlyingAsset,
  dTokenName = 'DToken',
  dTokenSymbol = 'DT',
}: {
  deployer: Wallet;
  moneyPool: MoneyPoolTest | Contract;
  underlyingAsset: Contract;
  dTokenName?: string;
  dTokenSymbol?: string;
}): Promise<DTokenTest> {
  let dTokenTest: DTokenTest;

  const dTokenFactory = (await ethers.getContractFactory(
    'DTokenTest',
    deployer
  )) as DTokenTest__factory;

  dTokenTest = await dTokenFactory.deploy(
    moneyPool.address,
    underlyingAsset.address,
    dTokenName,
    dTokenSymbol
  );

  return dTokenTest;
}

export async function makeInterestRateModel({
  deployer,
  interestRateModelParam = defaultInterestModelParams,
}: {
  deployer: Wallet;
  interestRateModelParam?: InterestModelParams;
}): Promise<InterestRateModel> {
  let interestRateModel: InterestRateModel;

  const interestRateModelFactory = (await ethers.getContractFactory(
    'InterestRateModel',
    deployer
  )) as InterestRateModel__factory;

  interestRateModel = await interestRateModelFactory.deploy(
    interestRateModelParam.optimalUtilizationRate.toFixed(),
    interestRateModelParam.borrowRateBase.toFixed(),
    interestRateModelParam.borrowRateOptimal.toFixed(),
    interestRateModelParam.borrowRateMax.toFixed()
  );

  return interestRateModel;
}

export async function makeTokenizer({
  deployer,
  connector,
  moneyPool,
  name = '',
  symbol = '',
}: {
  deployer: Wallet;
  connector: Connector | Contract;
  moneyPool: MoneyPoolTest | Contract;
  name?: string;
  symbol?: string;
}): Promise<TokenizerTest> {
  let tokenizerTest: TokenizerTest;

  const tokenizerFactory = (await ethers.getContractFactory(
    'TokenizerTest',
    deployer
  )) as TokenizerTest__factory;

  tokenizerTest = await tokenizerFactory.deploy(connector.address, moneyPool.address, name, symbol);

  return tokenizerTest;
}

export async function makeDataPipeline({
  deployer,
  moneyPool,
}: {
  deployer: Wallet;
  moneyPool: MoneyPoolTest | Contract;
}): Promise<DataPipeline> {
  let dataPipeline: DataPipeline;

  const dataPipelineFactory = (await ethers.getContractFactory(
    'DataPipeline',
    deployer
  )) as DataPipeline__factory;

  dataPipeline = await dataPipelineFactory.deploy(moneyPool.address);

  return dataPipeline;
}

export async function makeAllContracts(deployer: Wallet): Promise<ElyfiContracts> {
  const underlyingAsset = await makeUnderlyingAsset({
    deployer,
  });

  const connector = await makeConnector({
    deployer,
  });

  const moneyPool = await makeMoneyPool({
    deployer,
    connector,
  });

  const interestRateModel = await makeInterestRateModel({
    deployer,
  });

  const lToken = await makeLToken({
    deployer,
    moneyPool,
    underlyingAsset,
  });

  const dToken = await makeDToken({
    deployer,
    moneyPool,
    underlyingAsset,
  });

  const tokenizer = await makeTokenizer({
    deployer,
    connector,
    moneyPool,
  });

  const dataPipeline = await makeDataPipeline({
    deployer,
    moneyPool,
  });

  await moneyPool.addNewReserve(
    underlyingAsset.address,
    lToken.address,
    dToken.address,
    interestRateModel.address,
    tokenizer.address,
    defaultReserveData.moneyPoolFactor.toFixed()
  );

  return {
    underlyingAsset,
    connector,
    moneyPool,
    interestRateModel,
    lToken,
    dToken,
    tokenizer,
    dataPipeline,
  }
}
