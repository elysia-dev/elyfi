import { BigNumber } from 'ethers';
import { ethers, waffle } from 'hardhat';
import {
  ModifiableContract,
  ModifiableContractFactory,
  smockit,
  smoddit,
} from '@eth-optimism/smock';
import {
  address,
  advanceBlock,
  ETH,
  expandToDecimals,
  getTimestamp,
  RAY,
  toIndex,
  toRate,
} from './utils/Ethereum';
import {
  Connector,
  DataPipeline,
  DTokenTest,
  ERC20Test,
  InterestRateModel,
  LTokenTest,
  MoneyPoolTest,
  Tokenizer,
  TokenizerTest,
} from '../typechain';
import {
  makeInterestRateModel,
  makeMoneyPool,
  makeLToken,
  makeUnderlyingAsset,
  makeConnector,
  makeTokenizer,
  makeDataPipeline,
} from './utils/makeContract';
import { defaultReserveData } from './utils/Interfaces';
import { expect } from 'chai';

describe('Tokenizer', () => {
  let underlyingAsset: ERC20Test;
  let connector: Connector;
  let moneyPool: MoneyPoolTest;
  let interestModel: InterestRateModel;
  let lToken: LTokenTest;
  let dToken: DTokenTest;
  let tokenizer: TokenizerTest;
  let dataPipeline: DataPipeline;

  const provider = waffle.provider;
  const [deployer, account1, CSP] = provider.getWallets();

  const exampleTokenId_1 = BigNumber.from(1001002003004005);
  const exampleTokenId_2 = BigNumber.from(1001002003004006);

  beforeEach(async () => {
    underlyingAsset = await makeUnderlyingAsset({
      deployer: deployer,
    });

    connector = await makeConnector({
      deployer,
    });

    moneyPool = await makeMoneyPool({
      deployer: deployer,
      connector: connector,
    });

    interestModel = await makeInterestRateModel({
      deployer: deployer,
    });

    lToken = await makeLToken({
      deployer: deployer,
      moneyPool: moneyPool,
      underlyingAsset: underlyingAsset,
    });

    tokenizer = await makeTokenizer({
      deployer: deployer,
      moneyPool: moneyPool,
    });

    dataPipeline = await makeDataPipeline({
      deployer: deployer,
      moneyPool: moneyPool,
    });

    await moneyPool.addNewReserve(
      underlyingAsset.address,
      lToken.address,
      interestModel.address,
      tokenizer.address,
      defaultReserveData.moneyPoolFactor
    );

    await underlyingAsset.connect(deployer).transfer(account1.address, RAY);
    await underlyingAsset.connect(deployer).transfer(CSP.address, RAY);
  });

  // describe("View Functions", async () => {

  //     it("Mints AToken and updates states", async () => {

  //     })
  // })

  describe('Mint ABToken', async () => {
    it('Mints ABToken and set token states', async () => {
      await tokenizer.connect(CSP).mintABToken(CSP.address, exampleTokenId_1);
      expect(await tokenizer.getMinter(exampleTokenId_1)).to.be.equal(CSP.address);
    });

    it('Reverts if mint already exist id', async () => {
      await tokenizer.connect(CSP).mintABToken(CSP.address, exampleTokenId_1);
      await expect(tokenizer.connect(CSP).mintABToken(CSP.address, exampleTokenId_1)).to.be
        .reverted;
    });

    it('Settles ABToken informations', async () => {});
  });
});
