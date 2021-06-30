import {
  LTokenTest,
  MoneyPoolTest,
  ERC20Test,
  InterestRateModel,
  TokenizerTest,
  Connector,
  DataPipeline,
  DTokenTest,
  IncentivePool,
} from '../../typechain';

interface ElyfiContracts {
  underlyingAsset: ERC20Test;
  connector: Connector;
  moneyPool: MoneyPoolTest;
  incentivePool: IncentivePool;
  interestRateModel: InterestRateModel;
  lToken: LTokenTest;
  dToken: DTokenTest;
  tokenizer: TokenizerTest;
  dataPipeline: DataPipeline;
}

export default ElyfiContracts;
