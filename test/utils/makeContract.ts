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
  IncentivePool,
  IncentivePool__factory,
  Validation__factory,
  Validation,
  AssetBond__factory,
  AssetBond,
} from '../../typechain';
import { Contract, BigNumber, utils } from 'ethers';
import { ethers } from 'hardhat';
import { testIncentiveAmountPerSecond, testInterestModelParams, testReserveData } from './testData';
import ElyfiContracts from '../types/ElyfiContracts';
import InterestModelParams from '../types/InterestRateModelParams';

export const makeValidation = async (): Promise<Validation> => {
  let validation: Validation;
  const validationFactory = (await ethers.getContractFactory('Validation')) as Validation__factory;

  validation = await validationFactory.deploy();

  return validation;
};

export const makeAssetBond = async (): Promise<AssetBond> => {
  let assetBond: AssetBond;
  const assetBondFactory = (await ethers.getContractFactory('AssetBond')) as AssetBond__factory;

  assetBond = await assetBondFactory.deploy();

  return assetBond;
};

export async function makeUnderlyingAsset({
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

export async function makeConnector(): Promise<Connector> {
  let connector: Connector;

  const connectorFactory = (await ethers.getContractFactory('Connector')) as Connector__factory;

  connector = await connectorFactory.deploy();

  return connector;
}

export async function makeMoneyPool({
  maxReserveCount_ = BigNumber.from(16).toString(),
  connector,
  validation,
  assetBond,
}: {
  maxReserveCount_?: string;
  connector: Connector | Contract;
  validation: Validation | Contract;
  assetBond: AssetBond | Contract;
}): Promise<MoneyPoolTest> {
  let moneyPoolTest: MoneyPoolTest;

  const moneyPoolFactory = (await ethers.getContractFactory('MoneyPoolTest', {
    libraries: {
      AssetBond: assetBond.address,
      Validation: validation.address,
    },
  })) as MoneyPoolTest__factory;

  moneyPoolTest = await moneyPoolFactory.deploy(maxReserveCount_, connector.address);

  return moneyPoolTest;
}

export async function makeIncentivePool({
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

export async function makeLToken({
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

  const dTokenFactory = (await ethers.getContractFactory('DTokenTest')) as DTokenTest__factory;

  dTokenTest = await dTokenFactory.deploy(
    moneyPool.address,
    underlyingAsset.address,
    dTokenName,
    dTokenSymbol
  );

  return dTokenTest;
}

export async function makeInterestRateModel({
  interestRateModelParam = testInterestModelParams,
}: {
  interestRateModelParam?: InterestModelParams;
}): Promise<InterestRateModel> {
  let interestRateModel: InterestRateModel;

  const interestRateModelFactory = (await ethers.getContractFactory(
    'InterestRateModel'
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
  validation,
  assetBond,
  name = '',
  symbol = '',
}: {
  connector: Connector | Contract;
  moneyPool: MoneyPoolTest | Contract;
  validation: Validation | Contract;
  assetBond: AssetBond | Contract;
  name?: string;
  symbol?: string;
}): Promise<TokenizerTest> {
  let tokenizerTest: TokenizerTest;

  const tokenizerFactory = (await ethers.getContractFactory('TokenizerTest', {
    libraries: {
      AssetBond: assetBond.address,
      Validation: validation.address,
    },
  })) as TokenizerTest__factory;

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
    'DataPipeline'
  )) as DataPipeline__factory;

  dataPipeline = await dataPipelineFactory.deploy(moneyPool.address);

  return dataPipeline;
}

export async function makeAllContracts(): Promise<ElyfiContracts> {
  const validation = await makeValidation();

  const assetBond = await makeAssetBond();

  const underlyingAsset = await makeUnderlyingAsset({});

  const incentiveAsset = await makeUnderlyingAsset({});

  const connector = await makeConnector();

  const moneyPool = await makeMoneyPool({
    connector,
    validation,
    assetBond,
  });

  const incentivePool = await makeIncentivePool({
    moneyPool,
    incentiveAsset,
  });

  const interestRateModel = await makeInterestRateModel({});

  const lToken = await makeLToken({
    moneyPool,
    underlyingAsset,
    incentivePool,
  });

  const dToken = await makeDToken({
    moneyPool,
    underlyingAsset,
  });

  const tokenizer = await makeTokenizer({
    connector,
    moneyPool,
    validation,
    assetBond,
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
