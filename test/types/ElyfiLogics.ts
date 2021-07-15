import { AssetBond, Index, Rate, TimeConverter, Validation } from '../../typechain';

interface ElyfiLibraries {
  validation: Validation;
  assetBond: AssetBond;
  timeConverter: TimeConverter;
  rate: Rate;
  index: Index;
}

export default ElyfiLibraries;
