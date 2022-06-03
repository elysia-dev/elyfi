import { BigNumber } from 'ethers';
import InterestModelParams from '../../test/types/InterestRateModelParams';
import { SECONDSPERDAY, WAD } from '../../test/utils/constants';
import { toRate } from '../../test/utils/wadRayMath';

export const daiReserveData = {
  lToken: {
    name: 'Elyfi_Dai_LToken',
    symbol: 'ELFI_DAI_LToken',
  },
  dToken: {
    name: 'Elyfi_Dai_DToken',
    symbol: 'ELFI_DAI_DToken',
  },
  interestRateModel: {
    name: 'Elyfi_Dai_InterestRateModel',
    params: <InterestModelParams>{
      optimalUtilizationRate: toRate(0.75),
      borrowRateBase: toRate(0.05),
      borrowRateOptimal: toRate(0.06),
      borrowRateMax: toRate(1),
    },
  },
  tokenizer: {
    name: 'Elyfi_Dai_Tokenzier',
    symbol: 'ELFI_DAI_Tokenizer',
  },
  incentivePool: {
    name: 'Elyfi_Dai_IncentivePool',
    incentiveAmountPerSecond: BigNumber.from(WAD).mul(3000000).div(180).div(SECONDSPERDAY),
  },
  moneyPoolFactor: BigNumber.from(0),
};

export const usdtReserveData = {
  lToken: {
    name: 'Elyfi_USDT_LToken',
    symbol: 'ELFI_USDT_LToken',
  },
  dToken: {
    name: 'Elyfi_USDT_DToken',
    symbol: 'ELFI_USDT_DToken',
  },
  interestRateModel: {
    name: 'Elyfi_USDT_InterestRateModel',
    params: <InterestModelParams>{
      optimalUtilizationRate: toRate(0.75),
      borrowRateBase: toRate(0.05),
      borrowRateOptimal: toRate(0.06),
      borrowRateMax: toRate(1),
    },
  },
  tokenizer: {
    name: 'Elyfi_USDT_Tokenzier',
    symbol: 'ELFI_USDT_Tokenizer',
  },
  incentivePool: {
    name: 'Elyfi_USDT_IncentivePool',
    incentiveAmountPerSecond: BigNumber.from(WAD).mul(3000000).div(180).div(SECONDSPERDAY),
  },
  moneyPoolFactor: BigNumber.from(0),
};

export const busdReserveData = {
  lToken: {
    name: 'Elyfi_BUSD_LToken',
    symbol: 'ELFI_BUSD_LToken',
  },
  dToken: {
    name: 'Elyfi_BUSD_DToken',
    symbol: 'ELFI_BUSD_DToken',
  },
  interestRateModel: {
    name: 'Elyfi_BUSD_InterestRateModel',
    params: <InterestModelParams>{
      optimalUtilizationRate: toRate(0.75),
      borrowRateBase: toRate(0.05),
      borrowRateOptimal: toRate(0.06),
      borrowRateMax: toRate(1),
    },
  },
  tokenizer: {
    name: 'Elyfi_BUSD_Tokenzier',
    symbol: 'ELFI_BUSD_Tokenizer',
  },
  incentivePool: {
    name: 'Elyfi_BUSD_IncentivePool',
    incentiveAmountPerSecond: BigNumber.from(WAD).mul(3000000).div(180).div(SECONDSPERDAY),
  },
  moneyPoolFactor: BigNumber.from(0),
};

export const usdcReserveData = {
  lToken: {
    name: 'Elyfi_USDC_LToken',
    symbol: 'ELFI_USDC_LToken',
  },
  dToken: {
    name: 'Elyfi_USDC_DToken',
    symbol: 'ELFI_USDC_DToken',
  },
  interestRateModel: {
    name: 'Elyfi_USDC_InterestRateModel',
    params: <InterestModelParams>{
      optimalUtilizationRate: toRate(0.75),
      borrowRateBase: toRate(0.05),
      borrowRateOptimal: toRate(0.06),
      borrowRateMax: toRate(1),
    },
  },
  tokenizer: {
    name: 'Elyfi_USDC_Tokenzier',
    symbol: 'ELFI_USDC_Tokenizer',
  },
  incentivePool: {
    name: 'Elyfi_USDC_IncentivePool',
    incentiveAmountPerSecond: BigNumber.from(WAD).mul(3000000).div(180).div(SECONDSPERDAY),
  },
  moneyPoolFactor: BigNumber.from(0),
};
