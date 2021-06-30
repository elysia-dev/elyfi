import { task } from 'hardhat/config';
import ElyfiContracts from '../../test/types/ElyfiContracts';
import getDeployedContracts from '../../test/utils/getDeployedContracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { testAssetBondData } from '../../test/utils/testData';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import assetBondIdData from '../../misc/assetBond/assetBondIdDataExample.json';
import { tokenIdGenerator } from '../../misc/assetBond/generator';

interface Args {
  asset: string;
  bond: string;
  amount: string;
  txSender: string;
  loanStart: string;
}

task('testnet:createSignedAssetBond', 'Create signed asset bond')
  .addOptionalParam('txSender', 'The tx txSender, default: collateral service provider')
  .addParam('bond', 'The nonce of the asset bond')
  .addOptionalParam('loanStart', 'The loan start day, default: tomorrow, example: 2020-01-02')
  .addOptionalParam('amount', 'The principal of the bond, default: 50')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    let txSender: SignerWithAddress;
    let amount: string;
    let loanStart: string;
    const [deployer, depositor, borrower, collateralServiceProvider, signer] =
      await hre.ethers.getSigners();

    const deployedElyfiContracts = (await getDeployedContracts(hre, deployer)) as ElyfiContracts;
    const moneyPool = deployedElyfiContracts.moneyPool;
    const tokenizer = deployedElyfiContracts.tokenizer;
    const connector = deployedElyfiContracts.connector;

    txSender = collateralServiceProvider;
    amount = '';
    loanStart = '';

    switch (args.txSender) {
      case `${deployer.address}`:
        txSender = deployer;
        break;
      case `${depositor.address}`:
        txSender = depositor;
        break;
      case `${borrower.address}`:
        txSender = borrower;
        break;
      case `${signer.address}`:
        txSender = signer;
        break;
    }

    assetBondIdData.nonce = +args.bond;
    if (args.bond.length > 5) {
      console.log('The nonce of bond is too big. --bond should be less than 10000');
      assetBondIdData.nonce = 0;
    }
    const tokenId = tokenIdGenerator(assetBondIdData);

    amount =
      args.amount != undefined
        ? hre.ethers.utils.parseEther(args.amount).toString()
        : hre.ethers.utils.parseEther('100').toString();

    const isCollateralServiceProvider = await connector.isCollateralServiceProvider(
      txSender.address
    );
    if (!isCollateralServiceProvider) {
      await connector.connect(deployer).addCollateralServiceProvider(txSender.address);
      console.log(
        `Deployer add a collateral service provider role to ${txSender.address.substr(0, 10)}`
      );
    }
    const isCouncil = await connector.isCouncil(signer.address);
    if (!isCouncil) {
      await connector.connect(deployer).addCouncil(signer.address);
      `Deployer add a council role to ${signer.address.substr(0, 10)}`;
    }

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
    await tokenizer.connect(txSender).settleAssetBond(
      borrower.address,
      signer.address,
      tokenId,
      testAssetBondData.principal,
      testAssetBondData.couponRate,
      testAssetBondData.overdueInterestRate,
      testAssetBondData.debtCeiling,
      testAssetBondData.loanDuration,
      loanStartDate.getUTCFullYear(),
      loanStartDate.getUTCMonth() + 1, //javascript UTC should be +1
      loanStartDate.getUTCDate(),
      testAssetBondData.ipfsHash
    );
    console.log(`The collateral service provider settled asset bond which id is ${args.bond}`);

    await tokenizer.connect(signer).signAssetBond(tokenId, 'test opinion');
    console.log(`The signer signs on asset token which id is "${args.bond}"`);

    await tokenizer.connect(txSender).approve(moneyPool.address, tokenId);

    const assetBondData = await tokenizer.getAssetBondData(tokenId);
    const borrowPrincipal = assetBondData.principal;

    console.log(
      `${txSender.address.substr(0, 10)} is ready for collateralizing ${
        args.bond
      }!. The borrow principal is ${borrowPrincipal.toString()}`
    );
  });

task('testnet:settleAssetBond', 'settle empty asset bond')
  .addOptionalParam('bond', 'The id of asset bond token')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const [deployer, depositor, borrower, collateralServiceProvider, signer] =
      await hre.ethers.getSigners();

    const deployedElyfiContracts = (await getDeployedContracts(hre, deployer)) as ElyfiContracts;
    const tokenizer = deployedElyfiContracts.tokenizer;

    if (args.bond == undefined) {
      args.bond = testAssetBondData.tokenId.toString();
    }

    await tokenizer
      .connect(collateralServiceProvider)
      .settleAssetBond(
        borrower.address,
        signer.address,
        testAssetBondData.tokenId,
        testAssetBondData.principal,
        testAssetBondData.couponRate,
        testAssetBondData.overdueInterestRate,
        testAssetBondData.debtCeiling,
        testAssetBondData.loanDuration,
        testAssetBondData.loanStartTimeYear,
        testAssetBondData.loanStartTimeMonth,
        testAssetBondData.loanStartTimeDay,
        testAssetBondData.ipfsHash
      );

    console.log(`The collateral service provider settles asset token which id is "${args.bond}"`);
  });

task('testnet:signAssetBond', 'sign settled asset bond')
  .addOptionalParam('bond', 'The id of asset bond token')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const [deployer, depositor, borrower, collateralServiceProvider, signer] =
      await hre.ethers.getSigners();

    const deployedElyfiContracts = (await getDeployedContracts(hre, deployer)) as ElyfiContracts;
    const connector = deployedElyfiContracts.connector;
    const tokenizer = deployedElyfiContracts.tokenizer;

    if (args.bond == undefined) {
      args.bond = testAssetBondData.tokenId.toString();
    }

    const isCouncil = await connector.isCouncil(signer.address);
    if (!isCouncil) {
      connector.connect(deployer).addCouncil(signer.address);
    }

    await tokenizer.connect(signer).signAssetBond(args.bond, 'test opinion');

    console.log(`The signer signs on asset token which id is "${args.bond}"`);
  });
