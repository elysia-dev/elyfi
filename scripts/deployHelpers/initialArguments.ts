import { defaultInterestModelParams } from '../../test/utils/Interfaces';

export const moneyPoolDeployArguments = {
  maxReserveCount_: '16',
  connector: '',
};

export const connectorDeployArguments = {};

export const lTokenDeployArguments = {
  moneyPool: '',
};

export const dTokenDeployArguments = {
  moneyPool: '',
};

export const interestRateModelDeployArguments = {
  optimalUtilizationRate: defaultInterestModelParams.optimalUtilizationRate,
  borrowRateBase: defaultInterestModelParams.borrowRateBase,
  borrowRateOptimal: defaultInterestModelParams.borrowRateOptimal,
  borrowRateMax: defaultInterestModelParams.borrowRateMax,
};

export const tokenizerDeployArguments = {
  moneyPool: '',
  name: 'ELYFI AssetBond',
  symbol: 'AB',
};

export const dataPipelineDeployArguments = {
  moneyPool: '',
};
