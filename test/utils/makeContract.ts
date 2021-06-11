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
import { Contract, Wallet, BigNumber, utils } from 'ethers';
import { ethers } from 'hardhat';
import { defaultInterestModelParams, defaultReserveData, InterestModelParams } from './Interfaces';
import ElyfiContracts from '../types/ElyfiContracts';

export async function makeUnderlyingAsset({
  totalSupply = utils.parseUnits('1', 36),
  name = defaultReserveData.underlyingAssetName,
  symbol = defaultReserveData.underlyingAssetSymbol,
}: {
  totalSupply?: BigNumber;
  name?: string;
  symbol?: string;
}): Promise<ERC20Test> {
  let underlyingAsset: ERC20Test;

  const underlyingAssetFactory = (await ethers.getContractFactory(
    'ERC20Test',
  )) as ERC20Test__factory;

  underlyingAsset = await underlyingAssetFactory.deploy(totalSupply, name, symbol);

  return underlyingAsset;
}

export async function makeConnector(): Promise<Connector> {
  let connector: Connector;

  const connectorFactory = (await ethers.getContractFactory(
    'Connector',
  )) as Connector__factory;

  connector = await connectorFactory.deploy();

  return connector;
}

export async function makeMoneyPool({
  maxReserveCount_ = BigNumber.from(16).toString(),
  connector,
}: {
  maxReserveCount_?: string;
  connector: Connector | Contract;
}): Promise<MoneyPoolTest> {
  let moneyPoolTest: MoneyPoolTest;

  const moneyPoolFactory = (await ethers.getContractFactory(
    'MoneyPoolTest',
  )) as MoneyPoolTest__factory;

  moneyPoolTest = await moneyPoolFactory.deploy(maxReserveCount_, connector.address);

  return moneyPoolTest;
}

export async function makeLToken({
  moneyPool,
  underlyingAsset,
  lTokenName = 'LToken',
  lTokenSymbol = 'LT',
}: {
  moneyPool: MoneyPoolTest | Contract;
  underlyingAsset: Contract;
  lTokenName?: string;
  lTokenSymbol?: string;
}): Promise<LTokenTest> {
  let lTokenTest: LTokenTest;

  const lTokenFactory = (await ethers.getContractFactory(
    'LTokenTest',
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
  moneyPool,
  underlyingAsset,
  dTokenName = 'DToken',
  dTokenSymbol = 'DT',
}: {
  moneyPool: MoneyPoolTest | Contract;
  underlyingAsset: Contract;
  dTokenName?: string;
  dTokenSymbol?: string;
}): Promise<DTokenTest> {
  let dTokenTest: DTokenTest;

  const dTokenFactory = (await ethers.getContractFactory(
    'DTokenTest',
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
  interestRateModelParam = defaultInterestModelParams,
}: {
  interestRateModelParam?: InterestModelParams;
}): Promise<InterestRateModel> {
  let interestRateModel: InterestRateModel;

  const interestRateModelFactory = (await ethers.getContractFactory(
    'InterestRateModel',
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
  connector,
  moneyPool,
  name = '',
  symbol = '',
}: {
  connector: Connector | Contract;
  moneyPool: MoneyPoolTest | Contract;
  name?: string;
  symbol?: string;
}): Promise<TokenizerTest> {
  let tokenizerTest: TokenizerTest;

  const tokenizerFactory = (await ethers.getContractFactory(
    'TokenizerTest',
  )) as TokenizerTest__factory;

  tokenizerTest = await tokenizerFactory.deploy(connector.address, moneyPool.address, name, symbol);

  return tokenizerTest;
}

export async function makeDataPipeline({
  moneyPool,
}: {
  moneyPool: MoneyPoolTest | Contract;
}): Promise<DataPipeline> {
  let dataPipeline: DataPipeline;

  const dataPipelineFactory = (await ethers.getContractFactory(
    'DataPipeline',
  )) as DataPipeline__factory;

  dataPipeline = await dataPipelineFactory.deploy(moneyPool.address);

  return dataPipeline;
}

export async function makeAllContracts(): Promise<ElyfiContracts> {
  const underlyingAsset = await makeUnderlyingAsset({});

  const connector = await makeConnector();

  const moneyPool = await makeMoneyPool({
    connector,
  });

  const interestRateModel = await makeInterestRateModel({});

  const lToken = await makeLToken({
    moneyPool,
    underlyingAsset,
  });

  const dToken = await makeDToken({
    moneyPool,
    underlyingAsset,
  });

  const tokenizer = await makeTokenizer({
    connector,
    moneyPool,
  });

  const dataPipeline = await makeDataPipeline({
    moneyPool,
  });

  await moneyPool.addNewReserve(
    underlyingAsset.address,
    lToken.address,
    dToken.address,
    interestRateModel.address,
    tokenizer.address,
    defaultReserveData.moneyPoolFactor
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
  };
}
