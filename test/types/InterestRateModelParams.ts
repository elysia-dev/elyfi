import { BigNumber } from 'ethers';

interface InterestModelParams {
  optimalUtilizationRate: BigNumber;
  borrowRateBase: BigNumber;
  borrowRateOptimal: BigNumber;
  borrowRateMax: BigNumber;
}

export default InterestModelParams;
