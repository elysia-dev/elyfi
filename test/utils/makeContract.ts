import {
  LTokenTest,
  LTokenTest__factory,
  DTokenTest,
  DTokenTest__factory,
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
} from '../../typechain';
import { BigNumber, Contract, Wallet } from 'ethers';
import { ethers } from 'hardhat';
import { expandToDecimals, toRate } from './Ethereum';
import { defaultInterestModelParams, defaultReserveData, InterestModelParams } from './Interfaces';

export async function makeUnderlyingAsset({
  deployer,
  totalSupply = expandToDecimals(1, 36),
  name = defaultReserveData.underlyingAssetName,
  symbol = defaultReserveData.underlyingAssetSymbol,
}: {
  deployer: Wallet;
  totalSupply?: BigNumber;
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
  maxReserveCount_ = BigNumber.from(16),
  connector,
}: {
  deployer: Wallet;
  maxReserveCount_?: BigNumber;
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
    interestRateModelParam.optimalUtilizationRate,
    interestRateModelParam.borrowRateBase,
    interestRateModelParam.borrowRateOptimal,
    interestRateModelParam.borrowRateMax
  );

  return interestRateModel;
}

export async function makeTokenizer({
  deployer,
  moneyPool,
  uri = '',
}: {
  deployer: Wallet;
  moneyPool: MoneyPoolTest | Contract;
  uri?: string;
}): Promise<TokenizerTest> {
  let tokenizerTest: TokenizerTest;

  const tokenizerFactory = (await ethers.getContractFactory(
    'TokenizerTest',
    deployer
  )) as TokenizerTest__factory;

  tokenizerTest = await tokenizerFactory.deploy(moneyPool.address, uri);

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
