import {
  LTokenTest,
  MoneyPoolTest,
  ERC20Test,
  InterestRateModel,
  Tokenizer,
  Connector,
  DataPipeline,
  DTokenTest,
  IncentivePool,
} from '../../typechain';

interface ElyfiContracts {
  underlyingAsset: ERC20Test;
  incentiveAsset: ERC20Test;
  connector: Connector;
  moneyPool: MoneyPoolTest;
  incentivePool: IncentivePool;
  interestRateModel: InterestRateModel;
  lToken: LTokenTest;
  dToken: DTokenTest;
  tokenizer: Tokenizer;
  dataPipeline: DataPipeline;
}

export default ElyfiContracts;
