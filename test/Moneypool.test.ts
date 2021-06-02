import { BigNumber } from 'bignumber.js';
import { ethers, waffle } from 'hardhat';
import { smoddit } from '@eth-optimism/smock';
import {
  address,
  advanceTime,
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
  makeDToken,
} from './utils/makeContract';
import { defaultReserveData } from './utils/Interfaces';
import { expect } from 'chai';
import {
  expectedReserveDataAfterBorrowAgainstABToken,
  expectedReserveDataAfterInvestMoneyPool,
  expectedUserDataAfterBorrowAgainstABToken,
  expectedUserDataAfterInvestMoneyPool,
} from './utils/Expect';
import { getReserveData, getUserData } from './utils/Helpers';
require('./assertions/equals');

describe('MoneyPool', () => {
  let underlyingAsset: ERC20Test;
  let connector: Connector;
  let moneyPool: MoneyPoolTest;
  let interestModel: InterestRateModel;
  let lToken: LTokenTest;
  let dToken: DTokenTest;
  let tokenizer: TokenizerTest;
  let dataPipeline: DataPipeline;

  const provider = waffle.provider;
  const [deployer, account1, account2, CSP, receiver] = provider.getWallets();

  const exampleTokenId_1 = new BigNumber(1001002003004005);
  const exampleTokenId_2 = new BigNumber(1001002003004006);

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

    dToken = await makeDToken({
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
      dToken.address,
      interestModel.address,
      tokenizer.address,
      defaultReserveData.moneyPoolFactor.toString()
    );

    await underlyingAsset.connect(deployer).transfer(account1.address, RAY.toString());
    await underlyingAsset.connect(deployer).transfer(account2.address, RAY.toString());
  });

  describe('AddReserve', async () => {
    it('Sets reserveData properly', async () => {
      const initialContractReserveData = await getReserveData({
        underlyingAsset: underlyingAsset,
        dataPipeline: dataPipeline,
        lToken: lToken,
      });

      expect(initialContractReserveData.underlyingAssetName).to.be.equal(
        defaultReserveData.underlyingAssetName
      );
      expect(initialContractReserveData.underlyingAssetSymbol).to.be.equal(
        defaultReserveData.underlyingAssetSymbol
      );
      expect(initialContractReserveData.lTokenInterestIndex).to.be.equal(
        defaultReserveData.lTokenInterestIndex
      );
    });
  });

  describe('Invest', async () => {
    it('Invest moneypool for the first time', async () => {
      const amountInvest = expandToDecimals(10000, 18);
      await underlyingAsset.connect(account1).approve(moneyPool.address, RAY.toString());

      const contractReserveDataBeforeInvest = await getReserveData({
        underlyingAsset: underlyingAsset,
        dataPipeline: dataPipeline,
        lToken: lToken,
      });
      const contractUserDataBeforeInvest = await getUserData({
        underlyingAsset: underlyingAsset,
        dataPipeline: dataPipeline,
        user: account1,
      });

      const investTx = await moneyPool
        .connect(account1)
        .investMoneyPool(underlyingAsset.address, account1.address, amountInvest.toString());

      const contractReserveDataAfterInvest = await getReserveData({
        underlyingAsset: underlyingAsset,
        dataPipeline: dataPipeline,
        lToken: lToken,
      });
      const contractUserDataAfterInvest = await getUserData({
        underlyingAsset: underlyingAsset,
        dataPipeline: dataPipeline,
        user: account1,
      });

      const expectedReserveDataAfterInvest = expectedReserveDataAfterInvestMoneyPool({
        amountInvest: amountInvest,
        reserveDataBefore: contractReserveDataBeforeInvest,
        txTimestamp: await getTimestamp(investTx),
      });
      const expectedUserDataAfterInvest = expectedUserDataAfterInvestMoneyPool({
        amountInvest: amountInvest,
        userDataBefore: contractUserDataBeforeInvest,
        reserveDataBefore: contractReserveDataBeforeInvest,
        reserveDataAfter: contractReserveDataAfterInvest,
        txTimestamp: await getTimestamp(investTx),
      });

      expect(contractReserveDataAfterInvest).to.be.equalReserveData(expectedReserveDataAfterInvest);
      expect(contractUserDataAfterInvest).to.be.equalUserData(expectedUserDataAfterInvest);
    });

    it('Invests moneypool for the second time', async () => {
      const amountInvest = expandToDecimals(10000, 18);
      await underlyingAsset.connect(account1).approve(moneyPool.address, RAY.toString());

      const investTx = await moneyPool
        .connect(account1)
        .investMoneyPool(underlyingAsset.address, account1.address, amountInvest.toString());

      const contractReserveDataBeforeInvest = await getReserveData({
        underlyingAsset: underlyingAsset,
        dataPipeline: dataPipeline,
        lToken: lToken,
      });
      const contractUserDataBeforeInvest = await getUserData({
        underlyingAsset: underlyingAsset,
        dataPipeline: dataPipeline,
        user: account1,
      });

      const secondInvestTx = await moneyPool
        .connect(account1)
        .investMoneyPool(underlyingAsset.address, account1.address, amountInvest.toString());

      const contractReserveDataAfterInvest = await getReserveData({
        underlyingAsset: underlyingAsset,
        dataPipeline: dataPipeline,
        lToken: lToken,
      });
      const contractUserDataAfterInvest = await getUserData({
        underlyingAsset: underlyingAsset,
        dataPipeline: dataPipeline,
        user: account1,
      });

      const expectedReserveDataAfterInvest = expectedReserveDataAfterInvestMoneyPool({
        amountInvest: amountInvest,
        reserveDataBefore: contractReserveDataBeforeInvest,
        txTimestamp: await getTimestamp(secondInvestTx),
      });
      const expectedUserDataAfterInvest = expectedUserDataAfterInvestMoneyPool({
        amountInvest: amountInvest,
        userDataBefore: contractUserDataBeforeInvest,
        reserveDataBefore: contractReserveDataBeforeInvest,
        reserveDataAfter: contractReserveDataAfterInvest,
        txTimestamp: await getTimestamp(secondInvestTx),
      });

      expect(contractReserveDataAfterInvest).to.be.equalReserveData(expectedReserveDataAfterInvest);
      expect(contractUserDataAfterInvest).to.be.equalUserData(expectedUserDataAfterInvest);
    });
  });

  describe('Withdraw', async () => {
    it('Withdraw without');
  });

  describe('Borrow against asset bond', async () => {
    const amountInvest = expandToDecimals(5000, 18);
    const amountBorrow = expandToDecimals(1000, 18);

    beforeEach(async () => {
      await tokenizer.connect(CSP).mintABToken(CSP.address, exampleTokenId_1.toString());
      await underlyingAsset.connect(account1).approve(moneyPool.address, RAY.toString());
      const firstInvestTx = await moneyPool
        .connect(account1)
        .investMoneyPool(underlyingAsset.address, account1.address, amountInvest.toString());
    });

    it('Borrow against AB token', async () => {
      const contractReserveDataBeforBorrow = await getReserveData({
        underlyingAsset: underlyingAsset,
        dataPipeline: dataPipeline,
        lToken: lToken,
      });
      const contractUserDataBeforeBorrow = await getUserData({
        underlyingAsset: underlyingAsset,
        dataPipeline: dataPipeline,
        user: account1,
      });

      const borrowTx = await moneyPool
        .connect(CSP)
        .borrowAgainstABToken(
          underlyingAsset.address,
          receiver.address,
          amountBorrow.toString(),
          exampleTokenId_1.toString()
        );

      const contractReserveDataAfterBorrow = await getReserveData({
        underlyingAsset: underlyingAsset,
        dataPipeline: dataPipeline,
        lToken: lToken,
      });
      const contractUserDataAfterBorrow = await getUserData({
        underlyingAsset: underlyingAsset,
        dataPipeline: dataPipeline,
        user: account1,
      });

      const expectedReserveDataAfterBorrow = expectedReserveDataAfterBorrowAgainstABToken({
        amountBorrow: amountBorrow,
        reserveDataBefore: contractReserveDataBeforBorrow,
        txTimestamp: await getTimestamp(borrowTx),
      });
      const expectedUserDataAfterBorrow = expectedUserDataAfterBorrowAgainstABToken({
        amountBorrow: amountBorrow,
        userDataBefore: contractUserDataBeforeBorrow,
        reserveDataBefore: contractReserveDataBeforBorrow,
        reserveDataAfter: contractReserveDataAfterBorrow,
        txTimestamp: await getTimestamp(borrowTx),
      });

      expect(expectedReserveDataAfterBorrow).to.be.equalReserveData(expectedReserveDataAfterBorrow);
      //=expect(contractUserDataAfterBorrow).to.be.equalUserData(expectedUserDataAfterBorrow);
    });

    it('Borrow against AB token and invest', async () => {
      await moneyPool
        .connect(CSP)
        .borrowAgainstABToken(
          underlyingAsset.address,
          receiver.address,
          amountBorrow.toString(),
          exampleTokenId_1.toString()
        );

      await getReserveData({
        underlyingAsset: underlyingAsset,
        dataPipeline: dataPipeline,
        lToken: lToken,
      });

      const investTx1 = await moneyPool
        .connect(account1)
        .investMoneyPool(underlyingAsset.address, account1.address, amountInvest.toString());

      const contractReserveDataBeforeInvest = await getReserveData({
        underlyingAsset: underlyingAsset,
        dataPipeline: dataPipeline,
        lToken: lToken,
      });
      const contractUserDataBeforeInvest = await getUserData({
        underlyingAsset: underlyingAsset,
        dataPipeline: dataPipeline,
        user: account1,
      });

      const investTx2 = await moneyPool
        .connect(account1)
        .investMoneyPool(underlyingAsset.address, account1.address, amountInvest.toString());

      const contractReserveDataAfterInvest = await getReserveData({
        underlyingAsset: underlyingAsset,
        dataPipeline: dataPipeline,
        lToken: lToken,
      });
      const contractUserDataAfterInvest = await getUserData({
        underlyingAsset: underlyingAsset,
        dataPipeline: dataPipeline,
        user: account1,
      });

      const expectedReserveDataAfterInvest = expectedReserveDataAfterInvestMoneyPool({
        amountInvest: amountInvest,
        reserveDataBefore: contractReserveDataBeforeInvest,
        txTimestamp: await getTimestamp(investTx2),
      });
      const expectedUserDataAfterInvest = expectedUserDataAfterInvestMoneyPool({
        amountInvest: amountInvest,
        userDataBefore: contractUserDataBeforeInvest,
        reserveDataBefore: contractReserveDataBeforeInvest,
        reserveDataAfter: contractReserveDataAfterInvest,
        txTimestamp: await getTimestamp(investTx2),
      });

      expect(contractReserveDataAfterInvest).to.be.equalReserveData(expectedReserveDataAfterInvest);
      //expect(contractUserDataAfterInvest).to.be.equalUserData(expectedUserDataAfterInvest);
    });
  });
});
