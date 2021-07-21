import { task } from 'hardhat/config';
import { getConnector, getMoneyPool, getTokenizer } from '../../utils/getDeployedContracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Connector, MoneyPool, Tokenizer } from '../../typechain';
import { getBorrower, getCouncil, getCSP } from '../../utils/getWallets';
import AssetBondSettleData from '../../test/types/AssetBondSettleData';
import { ethers, Wallet } from 'ethers';

interface Args {
  asset: string;
  bond: string;
  nonce: string;
  amount: string;
  txSender: string;
  loanStart: string;
  data: string;
}

const checkAssetBondFileData = (assetBondData: AssetBondSettleData) => {
  if (assetBondData.tokenId.toString().length != ethers.constants.MaxUint256.toString().length) {
    throw new Error('Invalid file data');
  }
};

const checkCollateralServiceProvider = async ({
  connector,
  txSender,
}: {
  connector: Connector;
  txSender: Wallet;
}) => {
  const isCollateralServiceProvider = await connector.isCollateralServiceProvider(txSender.address);
  if (!isCollateralServiceProvider) {
    throw new Error(`${txSender.address} has not collateral service provider role`);
  }
};

const checkCouncil = async ({
  connector,
  txSender,
}: {
  connector: Connector;
  txSender: Wallet;
}) => {
  const isCouncil = await connector.isCouncil(txSender.address);
  if (!isCouncil) {
    throw new Error(`${txSender.address} has not council role`);
  }
};

task('mainnet:mintAssetBond', 'Mint asset bond token from production data')
  .addParam('data', 'The asset bond from saved production data')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const collateralServiceProvider = await getCSP(hre);

    const tokenizer = (await getTokenizer(hre)) as Tokenizer;
    const connector = (await getConnector(hre)) as Connector;

    const assetBondData = require(`../../data/assetBond/mainnet/${args.data}`)
      .data as AssetBondSettleData;

    checkAssetBondFileData(assetBondData);

    await checkCollateralServiceProvider({
      connector: connector,
      txSender: collateralServiceProvider,
    });

    const mintTx = await tokenizer
      .connect(collateralServiceProvider)
      .mintAssetBond(collateralServiceProvider.address, assetBondData.tokenId);
    await mintTx.wait();
    console.log(`The collateral service provider mints asset token which data is "${args.data}"`);
  });

task('mainnet:settleAssetBond', 'settle empty asset bond')
  .addParam('data', 'The asset bond from saved production data')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const collateralServiceProvider = await getCSP(hre);
    const borrower = await getBorrower(hre);
    const signer = await getCouncil(hre);

    const tokenizer = (await getTokenizer(hre)) as Tokenizer;
    const connector = (await getConnector(hre)) as Connector;

    const assetBondData = require(`../../data/assetBond/mainnet/${args.data}`)
      .data as AssetBondSettleData;

    checkAssetBondFileData(assetBondData);

    await checkCollateralServiceProvider({
      connector: connector,
      txSender: collateralServiceProvider,
    });

    const settleTx = await tokenizer
      .connect(collateralServiceProvider)
      .settleAssetBond(
        assetBondData.borrower,
        assetBondData.signer,
        assetBondData.tokenId,
        assetBondData.principal,
        assetBondData.couponRate,
        assetBondData.delinquencyRate,
        assetBondData.debtCeiling,
        assetBondData.loanDuration,
        assetBondData.loanStartTimeYear,
        assetBondData.loanStartTimeMonth,
        assetBondData.loanStartTimeDay,
        assetBondData.ipfsHash
      );

    await settleTx.wait();

    console.log(`The collateral service provider settles asset token which data is "${args.data}"`);
  });

task('mainnet:signAssetBond', 'sign settled asset bond')
  .addParam('data', 'The asset bond from saved production data')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const signer = await getCouncil(hre);

    const tokenizer = (await getTokenizer(hre)) as Tokenizer;
    const connector = (await getConnector(hre)) as Connector;

    const assetBondData = require(`../../data/assetBond/mainnet/${args.data}`)
      .data as AssetBondSettleData;

    checkAssetBondFileData(assetBondData);

    await checkCouncil({
      connector: connector,
      txSender: signer,
    });

    await tokenizer
      .connect(signer)
      .signAssetBond(assetBondData.tokenId, assetBondData.signerOpinionHash);

    console.log(`The signer signs on asset token which da is "${args.data}"`);
  });

task('mainnet:approveAssetBond', 'approve asset bond to the tokenizer')
  .addParam('data', 'The asset bond from saved production data')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const collateralServiceProvider = await getCSP(hre);

    const tokenizer = (await getTokenizer(hre)) as Tokenizer;
    const moneyPool = (await getMoneyPool(hre)) as MoneyPool;

    const assetBondData = require(`../../data/assetBond/mainnet/${args.data}`)
      .data as AssetBondSettleData;

    checkAssetBondFileData(assetBondData);

    const isApproved = (await tokenizer.getApproved(assetBondData.tokenId)) == moneyPool.address;

    if (!isApproved) {
      if ((await tokenizer.ownerOf(assetBondData.tokenId)) != collateralServiceProvider.address) {
        throw new Error(`${collateralServiceProvider.address} is not the token owner`);
      }
      const approveTx = await tokenizer
        .connect(collateralServiceProvider)
        .approve(moneyPool.address, assetBondData.tokenId);
      await approveTx.wait();
      console.log('Token approve success');
      return;
    }
    console.log('Token already approved to the moneyPool');
  });
