import {
  LTokenTest,
  MoneyPoolTest,
  ERC20Test,
  InterestRateModel,
  TokenizerTest,
  Connector,
  DataPipeline,
  DTokenTest,
} from '../../typechain';

interface ElyfiContracts {
  underlyingAsset: ERC20Test,
  connector: Connector,
  moneyPool: MoneyPoolTest,
  interestModel: InterestRateModel,
  lToken: LTokenTest,
  dToken: DTokenTest,
  tokenizer: TokenizerTest,
  dataPipeline: DataPipeline,
}

export default ElyfiContracts