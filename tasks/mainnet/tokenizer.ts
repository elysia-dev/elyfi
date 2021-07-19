import { task } from 'hardhat/config';
import { getConnector, getTokenizer } from '../../utils/getDeployedContracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Connector, Tokenizer } from '../../typechain';
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
  txSender: SignerWithAddress;
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
        borrower.address,
        signer.address,
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
    const collateralServiceProvider = await getCSP(hre);
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

    await tokenizer
      .connect(signer)
      .signAssetBond(assetBondData.tokenId, assetBondData.signerOpinionHash);

    console.log(`The signer signs on asset token which data is "${args.data}"`);
  });
