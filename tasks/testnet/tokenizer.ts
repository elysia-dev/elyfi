import { task } from 'hardhat/config';
import { getConnector, getMoneyPool, getTokenizer } from '../../utils/getDeployedContracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { testAssetBond } from '../../test/utils/testData';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import assetBondIdData from '../../misc/assetBond/assetBondIdDataExample.json';
import { tokenIdGenerator } from '../../misc/assetBond/generator';
import AssetBondSettleData from '../../test/types/AssetBondSettleData';
import { AssetBondIdData } from '../../misc/assetBond/types';
import { Connector, MoneyPool, Tokenizer } from '../../typechain';
import { Z_ASCII } from 'zlib';

interface Args {
  asset: string;
  bond: string;
  nonce: string;
  data: string;
  amount: string;
  txSender: string;
  loanStart: string;
  address: string;
}

const checkCollateralServiceProvider = async ({
  connector,
  txSender,
  deployer,
}: {
  connector: Connector;
  txSender: SignerWithAddress;
  deployer: SignerWithAddress;
}) => {
  const isCollateralServiceProvider = await connector.isCollateralServiceProvider(txSender.address);
  if (!isCollateralServiceProvider) {
    const addCollateralServiceProviderTx = await connector
      .connect(deployer)
      .addCollateralServiceProvider(txSender.address);
    await addCollateralServiceProviderTx.wait();
    console.log(
      `Deployer add a collateral service provider role to ${txSender.address.substr(0, 10)}`
    );
  }
};

const checkCouncil = async ({
  connector,
  txSender,
  deployer,
}: {
  connector: Connector;
  txSender: SignerWithAddress;
  deployer: SignerWithAddress;
}) => {
  const isCouncil = await connector.isCouncil(txSender.address);
  if (!isCouncil) {
    const addCouncilTx = await connector.connect(deployer).addCouncil(txSender.address);
    await addCouncilTx.wait();
    console.log(`Deployer add a council role to ${txSender.address.substr(0, 10)}`);
  }
};

task('testnet:createSignedAssetBond', 'Create signed asset bond from production data')
  .addOptionalParam('txSender', 'The tx txSender, default: collateral service provider')
  .addParam('data', 'The asset bond from saved data')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    let txSender: SignerWithAddress;
    let assetBondSettleData: AssetBondSettleData;
    const [deployer, depositor, borrower, collateralServiceProvider, signer] =
      await hre.ethers.getSigners();

    const moneyPool = (await getMoneyPool(hre)) as MoneyPool;
    const tokenizer = (await getTokenizer(hre)) as Tokenizer;
    const connector = (await getConnector(hre)) as Connector;

    txSender = collateralServiceProvider;

    const file = require(`../../data/assetBond/testnet/assetBond_test_${args.data}`);
    assetBondSettleData = file.data;
    if (!assetBondSettleData.principal) {
      console.log('No data');
      return;
    }

    const tokenId = assetBondSettleData.tokenId;

    await checkCollateralServiceProvider({
      connector: connector,
      txSender: txSender,
      deployer: deployer,
    });
    await checkCouncil({ connector: connector, txSender: txSender, deployer: deployer });

    const mintTx = await tokenizer.connect(txSender).mintAssetBond(txSender.address, tokenId);
    await mintTx.wait();
    console.log(`The collateral service provider mints asset token which data is "${args.data}"`);

    const settleTx = await tokenizer
      .connect(txSender)
      .settleAssetBond(
        borrower.address,
        signer.address,
        tokenId,
        assetBondSettleData.principal,
        assetBondSettleData.couponRate,
        assetBondSettleData.delinquencyRate,
        assetBondSettleData.debtCeiling,
        assetBondSettleData.loanDuration,
        assetBondSettleData.loanStartTimeYear,
        assetBondSettleData.loanStartTimeMonth,
        assetBondSettleData.loanStartTimeDay,
        assetBondSettleData.ipfsHash
      );
    await settleTx.wait();
    console.log(
      `The collateral service provider settled asset bond which number is ${args.data},
      loan start day is ${assetBondSettleData.loanStartTimeMonth}/${assetBondSettleData.loanStartTimeDay}`
    );

    await tokenizer.connect(signer).signAssetBond(tokenId, 'test opinion');
    console.log(`The signer signs on asset token which id is "${args.data}"`);

    await tokenizer.connect(txSender).approve(moneyPool.address, tokenId);

    const assetBondData = await tokenizer.getAssetBondData(tokenId);
    const borrowprincipal = assetBondData.principal;

    console.log(
      `${txSender.address.substr(0, 10)} is ready for collateralizing ${args.data
      }!. The borrow principal is ${borrowprincipal.toString()} and token id is ${tokenId}`
    );
  });

task('testnet:createSignedAssetBondForTest', 'Create signed asset bond for only test, example data')
  .addOptionalParam('txSender', 'The tx txSender, default: collateral service provider')
  .addParam('nonce', 'The nonce of the asset bond')
  .addOptionalParam('loanStart', 'The loan start day, default: tomorrow, example: 2020-01-02')
  .addOptionalParam('amount', 'The principal of the bond, default: 50')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    let txSender: SignerWithAddress;
    let amount: string;
    let assetBondSettleData: AssetBondSettleData;
    let assetBondIdData: AssetBondIdData;
    let loanStart: string;
    const [deployer, depositor, borrower, collateralServiceProvider, signer] =
      await hre.ethers.getSigners();

    const moneyPool = (await getMoneyPool(hre)) as MoneyPool;
    const tokenizer = (await getTokenizer(hre)) as Tokenizer;
    const connector = (await getConnector(hre)) as Connector;

    txSender = collateralServiceProvider;
    amount = '';
    loanStart = '';

    const file = require(`../../data/assetBond/testnet/example`);

    assetBondIdData = file.id;
    assetBondIdData.nonce = +args.bond;
    if (args.bond.length > 5) {
      console.log('The nonce of bond is too big. --bond should be less than 10000');
      assetBondIdData.nonce = 0;
    }
    const tokenId = tokenIdGenerator(assetBondIdData);
    assetBondSettleData = file.data;
    assetBondSettleData.tokenId = hre.ethers.BigNumber.from(tokenId);

    amount =
      args.amount != undefined
        ? hre.ethers.utils.parseEther(args.amount).toString()
        : assetBondSettleData.principal.toString();

    await checkCollateralServiceProvider({
      connector: connector,
      txSender: txSender,
      deployer: deployer,
    });
    await checkCouncil({ connector: connector, txSender: txSender, deployer: deployer });

    await tokenizer.connect(txSender).mintAssetBond(txSender.address, tokenId);
    console.log(`The collateral service provider mints asset token which nonce is "${args.bond}"`);

    loanStart =
      args.loanStart != undefined
        ? hre.ethers.utils.parseEther(args.amount).toString()
        : hre.ethers.utils.parseEther('100').toString();

    const regex = /\d{4}-\d{2}-\d{2}/;

    if (regex.test(args.loanStart)) {
      const dates = args.loanStart.split('-');
      // +dates[1] -1' is for javascript UTC Month!
      loanStart = (Date.UTC(+dates[0], +dates[1] - 1, +dates[2]) / 1000).toString();
    } else {
      const today = new Date();
      loanStart = (
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1) / 1000
      ).toString();
      console.log(
        `Loan start time is tomorrow(today is ${today}) since date params or undefined date params`
      );
    }

    const loanStartDate = new Date(+loanStart * 1000);
    console.log(loanStartDate);
    const settleTx = await tokenizer.connect(txSender).settleAssetBond(
      borrower.address,
      signer.address,
      tokenId,
      testAssetBond.principal,
      testAssetBond.couponRate,
      testAssetBond.delinquencyRate,
      testAssetBond.debtCeiling,
      testAssetBond.loanDuration,
      loanStartDate.getUTCFullYear(),
      loanStartDate.getUTCMonth() + 1, //javascript UTC should be +1
      loanStartDate.getUTCDate(),
      testAssetBond.ipfsHash
    );
    await settleTx.wait();
    console.log(`The collateral service provider settled asset bond which id is ${args.bond}`);

    const signTx = await tokenizer.connect(signer).signAssetBond(tokenId, 'test opinion');
    console.log(`The signer signs on asset token which id is "${args.bond}"`);

    await tokenizer.connect(txSender).approve(moneyPool.address, tokenId);

    const assetBondData = await tokenizer.getAssetBondData(tokenId);
    const borrowprincipal = assetBondData.principal;

    console.log(
      `${txSender.address.substr(0, 10)} is ready for collateralizing ${args.bond
      }!. The borrow principal is ${borrowprincipal.toString()}`
    );
  });

task('testnet:settleAssetBond', 'settle empty asset bond')
  .addParam('bond', 'The id of asset bond token')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const [deployer, depositor, borrower, collateralServiceProvider, signer] =
      await hre.ethers.getSigners();

    const tokenizer = (await getTokenizer(hre)) as Tokenizer;

    assetBondIdData.nonce = +args.bond;
    if (args.bond.length > 5) {
      console.log('The nonce of bond is too big. --bond should be less than 10000');
      assetBondIdData.nonce = 0;
    }
    const tokenId = tokenIdGenerator(assetBondIdData);

    await tokenizer
      .connect(collateralServiceProvider)
      .settleAssetBond(
        borrower.address,
        signer.address,
        tokenId,
        testAssetBond.principal,
        testAssetBond.couponRate,
        testAssetBond.delinquencyRate,
        testAssetBond.debtCeiling,
        testAssetBond.loanDuration,
        testAssetBond.loanStartTimeYear,
        testAssetBond.loanStartTimeMonth,
        testAssetBond.loanStartTimeDay,
        testAssetBond.ipfsHash
      );

    console.log(`The collateral service provider settles asset token which id is "${args.bond}"`);
  });

task('testnet:addCouncil', 'sign settled asset bond')
  .addParam('address', 'address of new conucil')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const [deployer] =
      await hre.ethers.getSigners();

    const connector = (await getConnector(hre)) as Connector;
    const tx = await connector.connect(deployer).addCouncil(args.address);

    console.log(tx.hash);
    tx.wait();
  });

task('testnet:addCSP', 'sign settled asset bond')
  .addParam('address', 'address of new conucil')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const [deployer] =
      await hre.ethers.getSigners();

    const connector = (await getConnector(hre)) as Connector;
    const tx = await connector.connect(deployer).addCollateralServiceProvider(args.address);

    console.log(tx.hash);
    tx.wait();
  });

task('testnet:signAssetBond', 'sign settled asset bond')
  .addParam('bond', 'The id of asset bond token')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const [deployer, depositor, borrower, collateralServiceProvider, signer] =
      await hre.ethers.getSigners();

    const connector = (await getConnector(hre)) as Connector;
    const tokenizer = (await getTokenizer(hre)) as Tokenizer;

    assetBondIdData.nonce = +args.bond;
    if (args.bond.length > 5) {
      console.log('The nonce of bond is too big. --bond should be less than 10000');
      assetBondIdData.nonce = 0;
    }
    const tokenId = tokenIdGenerator(assetBondIdData);

    const isCouncil = await connector.isCouncil(signer.address);
    if (!isCouncil) {
      connector.connect(deployer).addCouncil(signer.address);
    }

    await tokenizer.connect(signer).signAssetBond(tokenId, 'test opinion');

    console.log(`The signer signs on asset token which id is "${args.bond}"`);
  });
