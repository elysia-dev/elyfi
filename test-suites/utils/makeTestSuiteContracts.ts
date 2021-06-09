import {
  makeInterestRateModel,
  makeMoneyPool,
  makeLToken,
  makeUnderlyingAsset,
  makeConnector,
  makeTokenizer,
  makeDataPipeline,
  makeDToken,
} from '../../test/utils/makeContract';
import { defaultReserveData } from '../../test/utils/Interfaces';
import { MockProvider } from '@ethereum-waffle/provider';
import UserType from '../enums/UserType';
import { ethers } from 'hardhat';
import ElyfiContracts from '../types/ElyfiContracts';

const makeTestSuiteContracts = async (provider: MockProvider): Promise<ElyfiContracts> => {
  const wallets = provider.getWallets();
  const deployer = wallets[UserType.Deployer];

  const underlyingAsset = await makeUnderlyingAsset({
    deployer,
  });

  const connector = await makeConnector({
    deployer,
  });

  const moneyPool = await makeMoneyPool({
    deployer,
    connector,
  });

  const interestModel = await makeInterestRateModel({
    deployer,
  });

  const lToken = await makeLToken({
    deployer,
    moneyPool,
    underlyingAsset,
  });

  const dToken = await makeDToken({
    deployer,
    moneyPool,
    underlyingAsset,
  });

  const tokenizer = await makeTokenizer({
    deployer: deployer,
    connector: connector,
    moneyPool: moneyPool,
  });

  const dataPipeline = await makeDataPipeline({
    deployer,
    moneyPool,
  });

  await moneyPool.addNewReserve(
    underlyingAsset.address,
    lToken.address,
    dToken.address,
    interestModel.address,
    tokenizer.address,
    defaultReserveData.moneyPoolFactor.toFixed()
  );

  [UserType.Account0, UserType.Account1, UserType.Account2, UserType.Account3].forEach(
    async (user) => {
      await underlyingAsset
        .connect(deployer)
        .transfer(wallets[user].address, ethers.utils.formatEther(1000));
    }
  );

  return {
    underlyingAsset,
    connector,
    moneyPool,
    interestModel,
    lToken,
    dToken,
    tokenizer,
    dataPipeline,
  };
};

export default makeTestSuiteContracts;
