import {
  LTokenTest,
  LTokenTest__factory,
  MoneyPoolTest,
  MoneyPoolTest__factory,
  ERC20Test,
  ERC20Test__factory,
  InterestRateModel,
  InterestRateModel__factory,
  Tokenizer,
  Tokenizer__factory,
  Connector,
  Connector__factory,
  DataPipeline,
  DataPipeline__factory,
  DTokenTest,
  DTokenTest__factory,
  IncentivePool,
  IncentivePool__factory,
  Validation__factory,
  Validation,
  AssetBond__factory,
  AssetBond,
  Index,
  Index__factory,
  Rate,
  Rate__factory,
  TimeConverter,
  TimeConverter__factory,
} from '../../typechain';
import { Contract, BigNumber, utils } from 'ethers';
import { ethers } from 'hardhat';
import { testIncentiveAmountPerSecond, testInterestModelParams, testReserveData } from './testData';
import ElyfiContracts from '../types/ElyfiContracts';
import InterestModelParams from '../types/InterestRateModelParams';

export const setupValidation = async (): Promise<Validation> => {
  let validation: Validation;
  const validationFactory = (await ethers.getContractFactory('Validation')) as Validation__factory;
  validation = await validationFactory.deploy();
  return validation;
};

//Tokenizer
export const setupTimeConverter = async (): Promise<TimeConverter> => {
  let timeConverter: TimeConverter;
  const timeConverterFactory = (await ethers.getContractFactory(
    'TimeConverter'
  )) as TimeConverter__factory;
  timeConverter = await timeConverterFactory.deploy();
  return timeConverter;
};

export const setupAssetBond = async (timeConverter: TimeConverter): Promise<AssetBond> => {
  let assetBond: AssetBond;
  const assetBondFactory = (await ethers.getContractFactory('AssetBond', {
    libraries: {
      TimeConverter: timeConverter.address,
    },
  })) as AssetBond__factory;
  assetBond = await assetBondFactory.deploy();
  return assetBond;
};
//tokenizer, moneypool
export const setupIndex = async (): Promise<Index> => {
  let index: Index;
  const indexFactory = (await ethers.getContractFactory('Index')) as Index__factory;
  index = await indexFactory.deploy();
  return index;
};

//Moneypool
export const setupRate = async (): Promise<Rate> => {
  let rate: Rate;
  const rateFactory = (await ethers.getContractFactory('Rate')) as Rate__factory;
  rate = await rateFactory.deploy();
  return rate;
};

export async function setupUnderlyingAsset({
  totalSupply = utils.parseUnits('1', 36),
  name = testReserveData.underlyingAssetName,
  symbol = testReserveData.underlyingAssetSymbol,
}: {
  totalSupply?: BigNumber;
  name?: string;
  symbol?: string;
}): Promise<ERC20Test> {
  let underlyingAsset: ERC20Test;

  const underlyingAssetFactory = (await ethers.getContractFactory(
    'ERC20Test'
  )) as ERC20Test__factory;

  underlyingAsset = await underlyingAssetFactory.deploy(totalSupply, name, symbol);

  return underlyingAsset;
}

export async function setupConnector(): Promise<Connector> {
  let connector: Connector;

  const connectorFactory = (await ethers.getContractFactory('Connector')) as Connector__factory;

  connector = await connectorFactory.deploy();

  return connector;
}

export async function setupMoneyPool({
  maxReserveCount_ = BigNumber.from(16).toString(),
  connector,
  validation,
  assetBond,
  timeConverter,
  index,
  rate,
}: {
  maxReserveCount_?: string;
  connector: Connector | Contract;
  validation: Validation | Contract;
  assetBond: AssetBond | Contract;
  timeConverter: TimeConverter | Contract;
  index: Index | Contract;
  rate: Rate | Contract;
}): Promise<MoneyPoolTest> {
  let moneyPoolTest: MoneyPoolTest;

  const moneyPoolFactory = (await ethers.getContractFactory('MoneyPoolTest', {
    libraries: {
      AssetBond: assetBond.address,
      Validation: validation.address,
      TimeConverter: timeConverter.address,
      Index: index.address,
      Rate: rate.address,
    },
  })) as MoneyPoolTest__factory;

  moneyPoolTest = await moneyPoolFactory.deploy(maxReserveCount_, connector.address);

  return moneyPoolTest;
}

export async function setupIncentivePool({
  moneyPool,
  incentiveAsset,
  amountPerSecond = testIncentiveAmountPerSecond,
}: {
  moneyPool: MoneyPoolTest | Contract;
  incentiveAsset: ERC20Test | Contract;
  amountPerSecond?: BigNumber;
}): Promise<IncentivePool> {
  let incentivePool: IncentivePool;

  const incentivePoolFactory = (await ethers.getContractFactory(
    'IncentivePool'
  )) as IncentivePool__factory;

  incentivePool = await incentivePoolFactory.deploy(
    moneyPool.address,
    incentiveAsset.address,
    amountPerSecond
  );

  return incentivePool;
}

export async function setupLToken({
  moneyPool,
  underlyingAsset,
  incentivePool,
  lTokenName = 'LToken',
  lTokenSymbol = 'LT',
}: {
  moneyPool: MoneyPoolTest | Contract;
  underlyingAsset: Contract;
  incentivePool: Contract;
  lTokenName?: string;
  lTokenSymbol?: string;
}): Promise<LTokenTest> {
  let lTokenTest: LTokenTest;

  const lTokenFactory = (await ethers.getContractFactory('LTokenTest')) as LTokenTest__factory;

  lTokenTest = await lTokenFactory.deploy(
    moneyPool.address,
    underlyingAsset.address,
    incentivePool.address,
    lTokenName,
    lTokenSymbol
  );

  return lTokenTest;
}

export async function setupDToken({
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

  const dTokenFactory = (await ethers.getContractFactory('DTokenTest')) as DTokenTest__factory;

  dTokenTest = await dTokenFactory.deploy(
    moneyPool.address,
    underlyingAsset.address,
    dTokenName,
    dTokenSymbol
  );

  return dTokenTest;
}

export async function setupInterestRateModel({
  interestRateModelParam = testInterestModelParams,
  connector,
}: {
  interestRateModelParam?: InterestModelParams;
  connector: Connector;
}): Promise<InterestRateModel> {
  let interestRateModel: InterestRateModel;

  const interestRateModelFactory = (await ethers.getContractFactory(
    'InterestRateModel'
  )) as InterestRateModel__factory;

  interestRateModel = await interestRateModelFactory.deploy(
    interestRateModelParam.optimalUtilizationRate,
    interestRateModelParam.borrowRateBase,
    interestRateModelParam.borrowRateOptimal,
    interestRateModelParam.borrowRateMax,
    connector.address,
  );

  return interestRateModel;
}

export async function setupTokenizer({
  connector,
  moneyPool,
  validation,
  assetBond,
  index,
  timeConverter,
  name = '',
  symbol = '',
}: {
  connector: Connector | Contract;
  moneyPool: MoneyPoolTest | Contract;
  validation: Validation | Contract;
  assetBond: AssetBond | Contract;
  index: Index | Contract;
  timeConverter: TimeConverter | Contract;
  name?: string;
  symbol?: string;
}): Promise<Tokenizer> {
  let Tokenizer: Tokenizer;

  const tokenizerFactory = (await ethers.getContractFactory('Tokenizer', {
    libraries: {
      AssetBond: assetBond.address,
      Validation: validation.address,
      TimeConverter: timeConverter.address,
    },
  })) as Tokenizer__factory;

  Tokenizer = await tokenizerFactory.deploy(connector.address, moneyPool.address, name, symbol);

  return Tokenizer;
}

export async function setupDataPipeline({
  moneyPool,
}: {
  moneyPool: MoneyPoolTest | Contract;
}): Promise<DataPipeline> {
  let dataPipeline: DataPipeline;

  const dataPipelineFactory = (await ethers.getContractFactory(
    'DataPipeline'
  )) as DataPipeline__factory;

  dataPipeline = await dataPipelineFactory.deploy(moneyPool.address);

  return dataPipeline;
}

export async function setupAllContracts(): Promise<ElyfiContracts> {
  const validation = await setupValidation();

  const timeConverter = await setupTimeConverter();

  const assetBond = await setupAssetBond(timeConverter);

  const rate = await setupRate();

  const index = await setupIndex();

  const underlyingAsset = await setupUnderlyingAsset({});

  const incentiveAsset = await setupUnderlyingAsset({});

  const connector = await setupConnector();

  const moneyPool = await setupMoneyPool({
    connector,
    validation,
    assetBond,
    timeConverter,
    index,
    rate,
  });

  const incentivePool = await setupIncentivePool({
    moneyPool,
    incentiveAsset,
  });

  const interestRateModel = await setupInterestRateModel({ connector });

  const lToken = await setupLToken({
    moneyPool,
    underlyingAsset,
    incentivePool,
  });

  const dToken = await setupDToken({
    moneyPool,
    underlyingAsset,
  });

  const tokenizer = await setupTokenizer({
    connector,
    moneyPool,
    validation,
    assetBond,
    index,
    timeConverter,
  });

  const dataPipeline = await setupDataPipeline({
    moneyPool,
  });

  await moneyPool.addNewReserve(
    underlyingAsset.address,
    lToken.address,
    dToken.address,
    interestRateModel.address,
    tokenizer.address,
    incentivePool.address,
    testReserveData.moneyPoolFactor
  );

  return {
    underlyingAsset,
    incentiveAsset,
    connector,
    moneyPool,
    incentivePool,
    interestRateModel,
    lToken,
    dToken,
    tokenizer,
    dataPipeline,
  };
}
