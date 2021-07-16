import { task } from 'hardhat/config';
import ElyfiContracts from '../../test/types/ElyfiContracts';
import getDeployedContracts from '../../utils/getContracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import AssetBondSettleData from '../../test/types/AssetBondSettleData';

interface Args {
  bond: string;
  data: string;
  amount: string;
  txSender: string;
}

task('testnet:deposit', 'Create deposit, default amount : 100, default txSender : depositor')
  .addOptionalParam('txSender', 'The depositor txSender, default: depositor')
  .addOptionalParam('amount', 'The approve amount')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    let txSender: SignerWithAddress;
    let amount: string;
    const [deployer, depositor, borrower, collateralServiceProvider, signer] =
      await hre.ethers.getSigners();

    const deployedElyfiContracts = (await getDeployedContracts(hre, deployer)) as ElyfiContracts;
    const moneyPool = deployedElyfiContracts.moneyPool;
    const underlyingAsset = deployedElyfiContracts.underlyingAsset;

    txSender = depositor;
    amount = '';

    if (args.txSender != undefined) {
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
        case `${collateralServiceProvider.address}`:
          txSender = collateralServiceProvider;
          break;
        case `${signer.address}`:
          txSender = signer;
          break;
      }
    }

    amount =
      args.amount != undefined
        ? hre.ethers.utils.parseEther(args.amount).toString()
        : hre.ethers.utils.parseEther('100').toString();

    const balance = await underlyingAsset.balanceOf(txSender.address);
    if (balance.lt(amount)) {
      await hre.run('testnet:transfer', {
        from: deployer.address,
        to: txSender.address,
        amount: amount,
      });
    }

    const allowance = await underlyingAsset.allowance(txSender.address, moneyPool.address);
    if (allowance.lt(amount)) {
      await hre.run('testnet:approve', {
        from: txSender.address,
        to: moneyPool.address,
        amount: amount,
      });
    }

    await moneyPool.connect(txSender).deposit(underlyingAsset.address, txSender.address, amount);
    console.log(`${txSender.address.substr(0, 10)} deposits ${amount}`);
  });

task('testnet:withdraw', 'Create withdraw, default amount : 100, default txSender : depositor')
  .addOptionalParam('txSender', 'The txSender, default: depositor')
  .addOptionalParam('amount', 'The approve amount, default amount: 100')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    let txSender: SignerWithAddress;
    let amount: string;
    const [deployer, depositor, borrower, collateralServiceProvider, signer] =
      await hre.ethers.getSigners();

    const deployedElyfiContracts = (await getDeployedContracts(hre, deployer)) as ElyfiContracts;
    const moneyPool = deployedElyfiContracts.moneyPool;
    const underlyingAsset = deployedElyfiContracts.underlyingAsset;

    txSender = depositor;

    switch (args.txSender) {
      case `${deployer.address}`:
        txSender = deployer;
        break;
      case `${borrower.address}`:
        txSender = borrower;
        break;
      case `${collateralServiceProvider.address}`:
        txSender = collateralServiceProvider;
        break;
      case `${signer.address}`:
        txSender = signer;
        break;
    }

    amount = args.amount != undefined ? args.amount : hre.ethers.utils.parseEther('100').toString();

    await moneyPool.connect(txSender).withdraw(underlyingAsset.address, txSender.address, amount);
    console.log(`${txSender.address.substr(0, 10)} withdraws ${amount}`);
  });

task('testnet:borrow', 'Create a loan on the token id')
  .addParam('data', 'The nonce of asset bond token')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    let assetBondSettleData: AssetBondSettleData;
    const [deployer, depositor, borrower, collateralServiceProvider, signer] =
      await hre.ethers.getSigners();

    const deployedElyfiContracts = (await getDeployedContracts(hre, deployer)) as ElyfiContracts;
    const moneyPool = deployedElyfiContracts.moneyPool;
    const tokenizer = deployedElyfiContracts.tokenizer;
    const underlyingAsset = deployedElyfiContracts.underlyingAsset;
    console.log(underlyingAsset.address);

    const file = require(`../../data/assetBond/testnet/assetBond_test_${args.data}`);
    assetBondSettleData = file.data;
    if (!assetBondSettleData.principal) {
      console.log('No data');
      return;
    }

    const tokenId = assetBondSettleData.tokenId;

    const assetBondData = await tokenizer.getAssetBondData(tokenId);
    const borrowprincipal = assetBondData.principal;
    const loanStartTimestamp = assetBondData.loanStartTimestamp.toNumber();

    const currentTimestamp = (await hre.ethers.provider.getBlock('latest')).timestamp;

    if (currentTimestamp < loanStartTimestamp) {
      console.log(
        `Borrow not worked since current timestamp(${currentTimestamp}) is less than loanStartTimestamp(${loanStartTimestamp})`
      );
      return;
    } else if (currentTimestamp > loanStartTimestamp + 64800) {
      console.log(`Borrow not worked since current timestamp(${currentTimestamp}) is expired`);
      return;
    } else {
      console.log(tokenId);
      await moneyPool.connect(collateralServiceProvider).borrow(underlyingAsset.address, tokenId);
      console.log(
        `The collateral service provider borrows against ${args.data} which principal amount is ${borrowprincipal}`
      );
    }
  });

task('testnet:repay', 'Create repay on an asset bond')
  .addOptionalParam('txSender', 'The tx txSender, default : borrower')
  .addParam('data', 'The nonce of asset bond token')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    let assetBondSettleData: AssetBondSettleData;
    let txSender: SignerWithAddress;
    const [deployer, depositor, borrower, collateralServiceProvider, signer] =
      await hre.ethers.getSigners();

    const deployedElyfiContracts = (await getDeployedContracts(hre, deployer)) as ElyfiContracts;
    const moneyPool = deployedElyfiContracts.moneyPool;
    const underlyingAsset = deployedElyfiContracts.underlyingAsset;
    const tokenizer = deployedElyfiContracts.tokenizer;

    txSender = borrower;

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
      case `${collateralServiceProvider.address}`:
        txSender = collateralServiceProvider;
        break;
      case `${signer.address}`:
        txSender = signer;
        break;
    }

    const file = require(`../../data/assetBond/testnet/assetBond_test_${args.data}`);
    assetBondSettleData = file.data;
    if (!assetBondSettleData.principal) {
      console.log('No data');
      return;
    }
    const tokenId = assetBondSettleData.tokenId;

    const assetBondData = await tokenizer.getAssetBondDebtData(tokenId);
    const totalRetrieveAmount = assetBondData[0].add(assetBondData[1]).toString();
    console.log(totalRetrieveAmount);

    const balance = await underlyingAsset.balanceOf(txSender.address);
    if (balance.lt(totalRetrieveAmount)) {
      await hre.run('testnet:transfer', {
        from: deployer.address,
        to: txSender.address,
        amount: totalRetrieveAmount,
      });
    }

    const allowance = await underlyingAsset.allowance(txSender.address, moneyPool.address);
    if (allowance.lt(totalRetrieveAmount)) {
      await hre.run('testnet:approve', {
        from: txSender.address,
        to: moneyPool.address,
        amount: totalRetrieveAmount,
      });
    }

    await moneyPool.connect(txSender).repay(underlyingAsset.address, tokenId);

    console.log(
      `The borrower repays a loan on ${args.data} which total retrieve amount is ${totalRetrieveAmount}`
    );
  });
