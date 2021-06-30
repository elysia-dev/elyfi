import { task } from 'hardhat/config';
import { BigNumber, ContractReceipt, ContractTransaction, utils } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import ElyfiContracts from '../test/types/ElyfiContracts';
import getDeployedContracts from '../test/utils/getDeployedContracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { testAssetBondData } from '../test/utils/testData';

interface Args {
  pool: string;
  asset: string;
  bond: string;
  amount: string;
  account: string;
  sender: string;
  loanStart: string;
}

//***************************Testnet:MoneyPool***************************

task('testnet:createDeposit', 'Create deposit, default amount : 100, default sender : depositor')
  .addOptionalParam('sender', 'The depositor sender, default: depositor')
  .addOptionalParam('amount', 'The approve amount')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    let sender: SignerWithAddress;
    let amount: string;
    const [deployer, depositor, borrower, collateralServiceProvider, signer] =
      await hre.ethers.getSigners();

    const deployedElyfiContracts = (await getDeployedContracts(hre, deployer)) as ElyfiContracts;
    const moneyPool = deployedElyfiContracts.moneyPool;
    const underlyingAsset = deployedElyfiContracts.underlyingAsset;

    sender = depositor;
    amount = '';

    if (args.sender != undefined) {
      switch (args.sender) {
        case `${deployer.address}`:
          sender = deployer;
          break;
        case `${depositor.address}`:
          sender = depositor;
          break;
        case `${borrower.address}`:
          sender = borrower;
          break;
        case `${collateralServiceProvider.address}`:
          sender = collateralServiceProvider;
          break;
        case `${signer.address}`:
          sender = signer;
          break;
      }
    }
    amount =
      args.amount != undefined
        ? utils.parseEther(args.amount).toString()
        : utils.parseEther('100').toString();

    const balance = await underlyingAsset.balanceOf(sender.address);
    if (balance.lte(amount)) {
      await hre.run('testnet:transfer', { amount: amount, sender: deployer.address });
    }

    const allowance = await underlyingAsset.allowance(sender.address, moneyPool.address);
    if (allowance.lte(amount)) {
      await hre.run('testnet:moneyPoolApprove', { amount: amount, sender: sender.address });
    }

    await moneyPool.connect(sender).deposit(underlyingAsset.address, sender.address, amount);
    console.log(`${sender.address.substr(0, 10)} deposits  ${amount}`);
  });

task('testnet:createWithdraw', 'Create withdraw, default amount : 100, default sender : depositor')
  .addOptionalParam('sender', 'The tx sender, default: depositor')
  .addOptionalParam('amount', 'The approve amount, default amount: 100')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    let sender: SignerWithAddress;
    let amount: string;
    const [deployer, depositor, borrower, collateralServiceProvider, signer] =
      await hre.ethers.getSigners();

    const deployedElyfiContracts = (await getDeployedContracts(hre, deployer)) as ElyfiContracts;
    const moneyPool = deployedElyfiContracts.moneyPool;
    const underlyingAsset = deployedElyfiContracts.underlyingAsset;

    sender = depositor;

    switch (args.sender) {
      case `${deployer.address}`:
        sender = deployer;
        break;
      case `${depositor.address}`:
        sender = depositor;
        break;
      case `${borrower.address}`:
        sender = borrower;
        break;
      case `${collateralServiceProvider.address}`:
        sender = collateralServiceProvider;
        break;
      case `${signer.address}`:
        sender = signer;
        break;
    }

    amount = args.amount != undefined ? args.amount : utils.parseEther('100').toString();

    await moneyPool.connect(sender).withdraw(underlyingAsset.address, sender.address, amount);
    console.log(`${sender.address.substr(0, 10)} withdraws ${amount}`);
  });

task('testnet:createSignedAssetBond', 'Create signed asset bond')
  .addOptionalParam('sender', 'The tx sender, default: collateral service provider')
  .addParam('bond', 'The id of the asset bond')
  .addOptionalParam('loanStart', 'The loan start day, default: tomorrow, example: 2020-01-02')
  .addOptionalParam('amount', 'The principal of the bond, default: 50')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    let sender: SignerWithAddress;
    let amount: string;
    let loanStart: string;
    const [deployer, depositor, borrower, collateralServiceProvider, signer] =
      await hre.ethers.getSigners();

    const deployedElyfiContracts = (await getDeployedContracts(hre, deployer)) as ElyfiContracts;
    const moneyPool = deployedElyfiContracts.moneyPool;
    const tokenizer = deployedElyfiContracts.tokenizer;
    const connector = deployedElyfiContracts.connector;

    sender = collateralServiceProvider;
    amount = '';
    loanStart = '';

    switch (args.sender) {
      case `${deployer.address}`:
        sender = deployer;
        break;
      case `${depositor.address}`:
        sender = depositor;
        break;
      case `${borrower.address}`:
        sender = borrower;
        break;
      case `${collateralServiceProvider.address}`:
        sender = collateralServiceProvider;
        break;
      case `${signer.address}`:
        sender = signer;
        break;
    }
    amount =
      args.amount != undefined
        ? utils.parseEther(args.amount).toString()
        : utils.parseEther('100').toString();

    const isCollateralServiceProvider = await connector.isCollateralServiceProvider(sender.address);
    const isCouncil = await connector.isCouncil(signer.address);
    if (!isCollateralServiceProvider) {
      await connector.connect(deployer).addCollateralServiceProvider(sender.address);
      console.log(
        `Deployer add a collateral service provider role to ${sender.address.substr(0, 10)}`
      );
    }
    if (!isCouncil) {
      await connector.connect(deployer).addCouncil(signer.address);
      `Deployer add a council role to ${signer.address.substr(0, 10)}`;
    }

    await tokenizer.connect(sender).mintAssetBond(sender.address, args.bond);
    console.log(`The collateral service provider mints asset token which id is "${args.bond}"`);

    loanStart =
      args.loanStart != undefined
        ? utils.parseEther(args.amount).toString()
        : utils.parseEther('100').toString();

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
    await tokenizer.connect(sender).settleAssetBond(
      borrower.address,
      signer.address,
      args.bond,
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

    await tokenizer.connect(signer).signAssetBond(args.bond, 'test opinion');
    console.log(`The signer signs on asset token which id is "${args.bond}"`);

    await tokenizer.connect(sender).approve(moneyPool.address, args.bond);

    const assetBondData = await tokenizer.getAssetBondData(args.bond);
    const borrowPrincipal = assetBondData.principal;

    console.log(
      `${sender.address.substr(0, 10)} is ready for collateralizing ${
        args.bond
      }!. The borrow principal is ${borrowPrincipal.toString()}`
    );
  });

task('testnet:createBorrow', 'Create a loan on the token id')
  .addParam('bond', 'The id of asset bond token')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const [deployer, depositor, borrower, collateralServiceProvider, signer] =
      await hre.ethers.getSigners();

    const deployedElyfiContracts = (await getDeployedContracts(hre, deployer)) as ElyfiContracts;
    const moneyPool = deployedElyfiContracts.moneyPool;
    const tokenizer = deployedElyfiContracts.tokenizer;
    const underlyingAsset = deployedElyfiContracts.underlyingAsset;

    const assetBondData = await tokenizer.getAssetBondData(args.bond);
    const borrowPrincipal = assetBondData.principal;
    const loanStartTimestamp = assetBondData.loanStartTimestamp.toNumber();

    const currentTimestamp = (await hre.ethers.provider.getBlock('latest')).timestamp;

    if (currentTimestamp < loanStartTimestamp) {
      console.log(
        `Borrow not worked since current timestamp(${currentTimestamp}) is less than loanStartTimestamp(${loanStartTimestamp})`
      );
    } else if (currentTimestamp > loanStartTimestamp + 64800) {
      console.log(`Borrow not worked since current timestamp(${currentTimestamp}) is expired`);
    } else {
      await moneyPool.connect(collateralServiceProvider).borrow(underlyingAsset.address, args.bond);
      console.log(
        `The collateral service provider borrows against ${args.bond} which principal amount is ${borrowPrincipal}`
      );
    }
  });

task('testnet:createRepay', 'Create repay on an asset bond')
  .addOptionalParam('sender', 'The tx sender, default : borrower')
  .addParam('bond', 'The id of asset bond token')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    let sender: SignerWithAddress;
    const [deployer, depositor, borrower, collateralServiceProvider, signer] =
      await hre.ethers.getSigners();

    const deployedElyfiContracts = (await getDeployedContracts(hre, deployer)) as ElyfiContracts;
    const moneyPool = deployedElyfiContracts.moneyPool;
    const underlyingAsset = deployedElyfiContracts.underlyingAsset;
    const tokenizer = deployedElyfiContracts.tokenizer;

    sender = borrower;

    switch (args.sender) {
      case `${deployer.address}`:
        sender = deployer;
        break;
      case `${depositor.address}`:
        sender = depositor;
        break;
      case `${borrower.address}`:
        sender = borrower;
        break;
      case `${collateralServiceProvider.address}`:
        sender = collateralServiceProvider;
        break;
      case `${signer.address}`:
        sender = signer;
        break;
    }

    const assetBondData = await tokenizer.getAssetBondDebtData(args.bond);
    const totalRetrieveAmount = assetBondData[0].add(assetBondData[1]).toString();
    console.log(totalRetrieveAmount);

    const balance = await underlyingAsset.balanceOf(sender.address);
    if (balance.lte(totalRetrieveAmount)) {
      await hre.run('testnet:transfer', {
        amount: totalRetrieveAmount,
        account: sender.address,
      });
    }

    const allowance = await underlyingAsset.allowance(sender.address, moneyPool.address);
    if (allowance.lte(totalRetrieveAmount)) {
      await hre.run('testnet:moneyPoolApprove', {
        sender: sender.address,
        amount: totalRetrieveAmount,
      });
    }

    await moneyPool.connect(sender).repay(underlyingAsset.address, args.bond);

    console.log(
      `The borrower repays a loan on ${args.bond} which total retrieve amount is ${totalRetrieveAmount}`
    );
  });

//************************Testnet:UnderlyingAsset************************

task('testnet:moneyPoolApprove', 'Approve to moneyPool, default: 100')
  .addParam('sender', 'The tx sender, default: deployer')
  .addOptionalParam('amount', 'The approve amount')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    let sender: SignerWithAddress;
    let amount: string;
    const [deployer, depositor, borrower, collateralServiceProvider, signer] =
      await hre.ethers.getSigners();

    const deployedElyfiContracts = (await getDeployedContracts(hre, deployer)) as ElyfiContracts;
    const underlyingAsset = deployedElyfiContracts.underlyingAsset;
    const moneyPool = deployedElyfiContracts.moneyPool;

    sender = deployer;
    amount = '';

    switch (args.sender) {
      case `${deployer.address}`:
        sender = deployer;
        break;
      case `${depositor.address}`:
        sender = depositor;
        break;
      case `${borrower.address}`:
        sender = borrower;
        break;
      case `${collateralServiceProvider.address}`:
        sender = collateralServiceProvider;
        break;
      case `${signer.address}`:
        sender = signer;
        break;
    }

    amount = args.amount != undefined ? args.amount : utils.parseEther('100').toString();

    await underlyingAsset.connect(sender).approve(moneyPool.address, amount);
    console.log(`${args.sender} approves moneyPool ${amount}`);
  });

task('testnet:transfer', 'Transfer underlyingAsset to account, default amount: 100')
  .addOptionalParam('sender', 'The tx sender, default: deployer')
  .addParam('account', 'The receiver, default: depositor')
  .addOptionalParam('amount', 'The approve amount, default amount: 100')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    let sender: SignerWithAddress;
    let amount: string;
    const [deployer, depositor, borrower, collateralServiceProvider, signer] =
      await hre.ethers.getSigners();

    const deployedElyfiContracts = (await getDeployedContracts(hre, deployer)) as ElyfiContracts;
    const underlyingAsset = deployedElyfiContracts.underlyingAsset;

    sender = deployer;

    switch (args.sender) {
      case `${deployer.address}`:
        sender = deployer;
        break;
      case `${depositor.address}`:
        sender = depositor;
        break;
      case `${borrower.address}`:
        sender = borrower;
        break;
      case `${collateralServiceProvider.address}`:
        sender = collateralServiceProvider;
        break;
      case `${signer.address}`:
        sender = signer;
        break;
    }

    amount = args.amount != undefined ? args.amount : utils.parseEther('100').toString();

    console.log('sender', sender.address);

    await underlyingAsset.connect(sender).transfer(args.account, amount);
    console.log(
      `${sender.address.substr(0, 10)} transfer ${amount} to ${args.account.substr(0, 10)}`
    );
  });

task('local:createSignedAssetBond', 'Create signed asset bond')
  .addOptionalParam('sender', 'The tx sender, default: collateral service provider')
  .addParam('bond', 'The id of the asset bond')
  .addOptionalParam('loanStart', 'The loan start day, default: tomorrow, example: 2020-01-02')
  .addOptionalParam('amount', 'The principal of the bond, default: 50')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    let sender: SignerWithAddress;
    let amount: string;
    let loanStart: string;
    const [deployer, depositor, borrower, collateralServiceProvider, signer] =
      await hre.ethers.getSigners();

    const deployedElyfiContracts = (await getDeployedContracts(hre, deployer)) as ElyfiContracts;
    const moneyPool = deployedElyfiContracts.moneyPool;
    const tokenizer = deployedElyfiContracts.tokenizer;
    const connector = deployedElyfiContracts.connector;
    const lToken = deployedElyfiContracts.lToken;
    const underlyingAsset = deployedElyfiContracts.underlyingAsset;

    const snapshot = await hre.ethers.provider.send('evm_snapshot', []);

    sender = collateralServiceProvider;
    amount = '';
    loanStart = '';

    switch (args.sender) {
      case `${deployer.address}`:
        sender = deployer;
        break;
      case `${depositor.address}`:
        sender = depositor;
        break;
      case `${borrower.address}`:
        sender = borrower;
        break;
      case `${collateralServiceProvider.address}`:
        sender = collateralServiceProvider;
        break;
      case `${signer.address}`:
        sender = signer;
        break;
    }
    amount =
      args.amount != undefined
        ? utils.parseEther(args.amount).toString()
        : utils.parseEther('100').toString();

    const isCollateralServiceProvider = await connector.isCollateralServiceProvider(sender.address);
    const isCouncil = await connector.isCouncil(signer.address);
    if (!isCollateralServiceProvider) {
      await connector.connect(deployer).addCollateralServiceProvider(sender.address);
    }
    if (!isCouncil) {
      await connector.connect(deployer).addCouncil(signer.address);
    }

    await tokenizer.connect(sender).mintAssetBond(sender.address, args.bond);
    console.log(`The collateral service provider mints asset token which id is "${args.bond}"`);

    loanStart =
      args.loanStart != undefined
        ? utils.parseEther(args.amount).toString()
        : utils.parseEther('100').toString();

    const regex = /\d{4}-\d{2}-\d{2}/;

    if (args.loanStart == undefined) {
    }

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

    await tokenizer
      .connect(sender)
      .settleAssetBond(
        borrower.address,
        signer.address,
        args.bond,
        testAssetBondData.principal,
        testAssetBondData.couponRate,
        testAssetBondData.overdueInterestRate,
        testAssetBondData.debtCeiling,
        testAssetBondData.loanDuration,
        loanStartDate.getUTCFullYear(),
        loanStartDate.getUTCMonth(),
        loanStartDate.getUTCDate(),
        testAssetBondData.ipfsHash
      );

    await tokenizer.connect(signer).signAssetBond(args.bond, 'test opinion');
    console.log(`The signer signs on asset token which id is "${args.bond}"`);

    const assetBondData = await tokenizer.getAssetBondData(args.bond);
    const borrowPrincipal = assetBondData.principal;
    const loanStartTimestamp = assetBondData.loanStartTimestamp.toNumber();
    const liquidityAvailable = await underlyingAsset.balanceOf(lToken.address);

    if (liquidityAvailable.lte(borrowPrincipal)) {
      await hre.run('testnet:createDeposit', { amount: amount, sender: depositor.address });
      console.log(`The depositor deposited 100 due to the lack of available liquidity`);
    }

    const currentTimestamp = (await hre.ethers.provider.getBlock('latest')).timestamp;

    if (currentTimestamp < loanStartTimestamp) {
      const secondsToIncrease = loanStartTimestamp - currentTimestamp + 1;
      const timestamp = await hre.network.provider.send('evm_increaseTime', [secondsToIncrease]);
      await tokenizer.connect(collateralServiceProvider).approve(moneyPool.address, args.bond);
      const borrowTx = await moneyPool
        .connect(collateralServiceProvider)
        .borrow(underlyingAsset.address, args.bond);
      console.log(
        `The collateral service provider borrows against token id '${args.bond}' which principal amount is '${borrowPrincipal}'`
      );
    } else {
      console.log(
        `Borrow failed since current timestamp(${currentTimestamp}) exceeds loanStartTimestamp(${loanStartTimestamp})`
      );
    }
    amount =
      args.amount != undefined
        ? utils.parseEther(args.amount).toString()
        : utils.parseEther('100').toString();

    await underlyingAsset.connect(sender).approve(moneyPool.address, amount);
    console.log(`${args.sender} approves moneyPool ${amount}`);

    await tokenizer.connect(sender).approve(moneyPool.address, args.bond);

    console.log(`${sender.address.substr(0, 10)} is ready for collateralizing ${args.bond}!`);
  });

//**********Testnet:Tokenizer */

// task('testnet:addCollateralServiceProvider', 'add collateral service provider role').setAction(
//   async (hre: HardhatRuntimeEnvironment) => {
//     const [deployer, depositor, borrower, collateralServiceProvider, signer] =
//       await hre.ethers.getSigners();

//     const deployedElyfiContracts = (await getDeployedContracts(hre, deployer)) as ElyfiContracts;
//     const connector = deployedElyfiContracts.connector;

//     connector.connect(deployer).addCollateralServiceProvider(collateralServiceProvider.address);
//   }
// );

// subtask('addCouncil', 'add council role').setAction(async () => {
//   const [deployer, depositor, borrower, collateralServiceProvider, signer] =
//     await hre.ethers.getSigners();

//   const deployedElyfiContracts = (await getDeployedContracts(hre, deployer)) as ElyfiContracts;
//   const connector = deployedElyfiContracts.connector;

//   connector.connect(deployer).addCouncil(signer.address);
// });

task('local:createWithdraw', 'Create withdraw, default sender: depositor, amount: 100').setAction(
  async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const [deployer, depositor] = await hre.ethers.getSigners();

    const deployedElyfiContracts = (await getDeployedContracts(hre, deployer)) as ElyfiContracts;
    const moneyPool = deployedElyfiContracts.moneyPool;
    const underlyingAsset = deployedElyfiContracts.underlyingAsset;

    await moneyPool
      .connect(depositor)
      .withdraw(underlyingAsset.address, depositor.address, utils.parseEther('100'));
    await moneyPool
      .connect(depositor)
      .withdraw(underlyingAsset.address, depositor.address, utils.parseEther('500'));

    console.log(`Depositor withdraws 100ETH and 500ETH`);
  }
);

task('local:mintAssetBond', 'Create empty asset bond')
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

    const isCollateralServiceProvider = await connector.isCollateralServiceProvider(
      collateralServiceProvider.address
    );
    if (!isCollateralServiceProvider) {
      await connector
        .connect(deployer)
        .addCollateralServiceProvider(collateralServiceProvider.address);
    }

    await tokenizer
      .connect(collateralServiceProvider)
      .mintAssetBond(collateralServiceProvider.address, args.bond);

    console.log(`The collateral service provider mints asset token which id is "${args.bond}"`);
  });

task('settleAssetBond', 'settle empty asset bond')
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

task('signAssetBond', 'sign settled asset bond')
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

task('createBorrowOnly', 'Create borrow : 1500ETH')
  .addOptionalParam('bond', 'The id of asset bond token')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const [deployer, depositor, borrower, collateralServiceProvider, signer] =
      await hre.ethers.getSigners();

    const deployedElyfiContracts = (await getDeployedContracts(hre, deployer)) as ElyfiContracts;
    const moneyPool = deployedElyfiContracts.moneyPool;
    const tokenizer = deployedElyfiContracts.tokenizer;
    const underlyingAsset = deployedElyfiContracts.underlyingAsset;

    if (args.bond == undefined) {
      args.bond = testAssetBondData.tokenId.toString();
    }

    const assetBondData = await tokenizer.getAssetBondData(args.bond);
    const borrowPrincipal = assetBondData.principal;
    const loanStartTimestamp = assetBondData.loanStartTimestamp.toNumber();

    const currentTimestamp = (await hre.ethers.provider.getBlock('latest')).timestamp;

    if (currentTimestamp < loanStartTimestamp) {
      const secondsToIncrease = loanStartTimestamp - currentTimestamp;
      await hre.network.provider.send('evm_increaseTime', [secondsToIncrease]);
      await moneyPool.connect(collateralServiceProvider).borrow(underlyingAsset.address, args.bond);
      console.log(
        `The collateral service provider borrows against ${args.bond} which principal amount is ${borrowPrincipal}`
      );
    } else {
      console.log(
        `Borrow failed since current timestamp(${currentTimestamp}) exceeds loanStartTimestamp(${loanStartTimestamp})`
      );
    }
  });

task('local:createBorrow', 'Create borrow : 1500ETH')
  .addOptionalParam('bond', 'The id of asset bond token')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const [deployer, depositor, borrower, collateralServiceProvider, signer] =
      await hre.ethers.getSigners();

    const deployedElyfiContracts = (await getDeployedContracts(hre, deployer)) as ElyfiContracts;
    const moneyPool = deployedElyfiContracts.moneyPool;
    const tokenizer = deployedElyfiContracts.tokenizer;
    const connector = deployedElyfiContracts.connector;
    const lToken = deployedElyfiContracts.lToken;
    const underlyingAsset = deployedElyfiContracts.underlyingAsset;

    const snapshot = await hre.ethers.provider.send('evm_snapshot', []);

    if (args.bond == undefined) {
      args.bond = testAssetBondData.tokenId.add(snapshot).toString();
    }

    const isCollateralServiceProvider = await connector.isCollateralServiceProvider(
      collateralServiceProvider.address
    );
    const isCouncil = await connector.isCouncil(signer.address);
    if (!isCollateralServiceProvider) {
      await connector
        .connect(deployer)
        .addCollateralServiceProvider(collateralServiceProvider.address);
    }
    if (!isCouncil) {
      await connector.connect(deployer).addCouncil(signer.address);
    }

    await tokenizer
      .connect(collateralServiceProvider)
      .mintAssetBond(collateralServiceProvider.address, args.bond);
    console.log(`The collateral service provider mints asset token which id is "${args.bond}"`);

    await tokenizer
      .connect(collateralServiceProvider)
      .settleAssetBond(
        borrower.address,
        signer.address,
        args.bond,
        testAssetBondData.principal,
        testAssetBondData.couponRate,
        testAssetBondData.overdueInterestRate,
        testAssetBondData.debtCeiling,
        testAssetBondData.loanDuration,
        testAssetBondData.loanStartTimeYear,
        testAssetBondData.loanStartTimeMonth,
        testAssetBondData.loanStartTimeDay.add(snapshot),
        testAssetBondData.ipfsHash
      );

    await tokenizer.connect(signer).signAssetBond(args.bond, 'test opinion');
    console.log(`The signer signs on asset token which id is "${args.bond}"`);

    const assetBondData = await tokenizer.getAssetBondData(args.bond);
    const borrowPrincipal = assetBondData.principal;
    const loanStartTimestamp = assetBondData.loanStartTimestamp.toNumber();
    const liquidityAvailable = await underlyingAsset.balanceOf(lToken.address);

    if (liquidityAvailable.lte(borrowPrincipal)) {
      await underlyingAsset.connect(deployer).transfer(depositor.address, utils.parseEther('1000'));
      await underlyingAsset.connect(depositor).approve(moneyPool.address, utils.parseEther('1500'));

      await moneyPool
        .connect(depositor)
        .deposit(underlyingAsset.address, depositor.address, utils.parseEther('100'));
      console.log(`The depositor deposited 100 due to the lack of available liquidity`);
    }

    const currentTimestamp = (await hre.ethers.provider.getBlock('latest')).timestamp;

    if (currentTimestamp < loanStartTimestamp) {
      const secondsToIncrease = loanStartTimestamp - currentTimestamp + 1;
      const timestamp = await hre.network.provider.send('evm_increaseTime', [secondsToIncrease]);
      await tokenizer.connect(collateralServiceProvider).approve(moneyPool.address, args.bond);
      const borrowTx = await moneyPool
        .connect(collateralServiceProvider)
        .borrow(underlyingAsset.address, args.bond);
      console.log(
        `The collateral service provider borrows against token id '${args.bond}' which principal amount is '${borrowPrincipal}'`
      );
    } else {
      console.log(
        `Borrow failed since current timestamp(${currentTimestamp}) exceeds loanStartTimestamp(${loanStartTimestamp})`
      );
    }
  });

task('createRepay', 'Create repay : 1500ETH')
  .addParam('bond', 'The id of asset bond token')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const [deployer, depositor, borrower, collateralServiceProvider, signer] =
      await hre.ethers.getSigners();

    const deployedElyfiContracts = (await getDeployedContracts(hre, deployer)) as ElyfiContracts;
    const moneyPool = deployedElyfiContracts.moneyPool;
    const underlyingAsset = deployedElyfiContracts.underlyingAsset;

    await underlyingAsset.connect(deployer).transfer(depositor.address, utils.parseEther('1000'));
    await underlyingAsset.connect(borrower).approve(moneyPool.address, utils.parseEther('1500'));

    if (args.bond == undefined) {
      args.bond = testAssetBondData.tokenId.toString();
    }

    await moneyPool.connect(borrower).repay(underlyingAsset.address, args.bond);

    console.log(`The borrower repays a loan on ${args.bond}`);
  });

task('createSignedAssetBond', 'Create signed asset bond in live network')
  .addParam('bond', 'The id of asset bond token')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const [deployer, depositor, borrower, collateralServiceProvider, signer] =
      await hre.ethers.getSigners();

    const deployedElyfiContracts = (await getDeployedContracts(hre, deployer)) as ElyfiContracts;
    const moneyPool = deployedElyfiContracts.moneyPool;
    const tokenizer = deployedElyfiContracts.tokenizer;
    const connector = deployedElyfiContracts.connector;
    const lToken = deployedElyfiContracts.lToken;
    const underlyingAsset = deployedElyfiContracts.underlyingAsset;

    const snapshot = await hre.ethers.provider.send('evm_snapshot', []);

    if (args.bond == undefined) {
      args.bond = testAssetBondData.tokenId.add(snapshot).toString();
    }

    const isCollateralServiceProvider = await connector.isCollateralServiceProvider(
      collateralServiceProvider.address
    );
    const isCouncil = await connector.isCouncil(signer.address);
    if (!isCollateralServiceProvider) {
      await connector
        .connect(deployer)
        .addCollateralServiceProvider(collateralServiceProvider.address);
    }
    if (!isCouncil) {
      connector.connect(deployer).addCouncil(signer.address);
    }

    await tokenizer
      .connect(collateralServiceProvider)
      .mintAssetBond(collateralServiceProvider.address, args.bond);
    console.log(`The collateral service provider mints asset token which id is "${args.bond}"`);

    await tokenizer
      .connect(collateralServiceProvider)
      .settleAssetBond(
        borrower.address,
        signer.address,
        args.bond,
        testAssetBondData.principal,
        testAssetBondData.couponRate,
        testAssetBondData.overdueInterestRate,
        testAssetBondData.debtCeiling,
        testAssetBondData.loanDuration,
        testAssetBondData.loanStartTimeYear,
        testAssetBondData.loanStartTimeMonth,
        testAssetBondData.loanStartTimeDay.add(snapshot),
        testAssetBondData.ipfsHash
      );

    await tokenizer.connect(signer).signAssetBond(args.bond, 'test opinion');
    console.log(`The signer signs on asset token which id is "${args.bond}"`);

    const assetBondData = await tokenizer.getAssetBondData(args.bond);
    const borrowPrincipal = assetBondData.principal;
    const loanStartTimestamp = assetBondData.loanStartTimestamp.toNumber();
    const liquidityAvailable = await underlyingAsset.balanceOf(lToken.address);

    if (liquidityAvailable.lte(borrowPrincipal)) {
      await underlyingAsset.connect(deployer).transfer(depositor.address, utils.parseEther('1000'));
      await underlyingAsset.connect(depositor).approve(moneyPool.address, utils.parseEther('1500'));

      await moneyPool
        .connect(depositor)
        .deposit(underlyingAsset.address, depositor.address, utils.parseEther('100'));
      console.log(`The depositor deposited 100 due to the lack of available liquidity`);
    }

    const currentTimestamp = (await hre.ethers.provider.getBlock('latest')).timestamp;

    if (currentTimestamp < loanStartTimestamp) {
      const secondsToIncrease = loanStartTimestamp - currentTimestamp + 1;
      const timestamp = await hre.network.provider.send('evm_increaseTime', [secondsToIncrease]);
      await tokenizer.connect(collateralServiceProvider).approve(moneyPool.address, args.bond);
      const borrowTx = await moneyPool
        .connect(collateralServiceProvider)
        .borrow(underlyingAsset.address, args.bond);
      console.log(
        `The collateral service provider borrows against token id '${args.bond}' which principal amount is '${borrowPrincipal}'`
      );
    } else {
      console.log(
        `Borrow failed since current timestamp(${currentTimestamp}) exceeds loanStartTimestamp(${loanStartTimestamp})`
      );
    }
  });

task('local:createDeposit', 'Create deposit, default amount : 100, default sender : depositor')
  .addOptionalParam('sender', 'The depositor sender, default: depositor')
  .addOptionalParam('amount', 'The approve amount')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    let sender: SignerWithAddress;
    let amount: string;
    const [deployer, depositor, borrower, collateralServiceProvider, signer] =
      await hre.ethers.getSigners();

    const deployedElyfiContracts = (await getDeployedContracts(hre, deployer)) as ElyfiContracts;
    const moneyPool = deployedElyfiContracts.moneyPool;
    const underlyingAsset = deployedElyfiContracts.underlyingAsset;

    sender = depositor;
    amount = '';

    if (args.sender != undefined) {
      switch (args.sender) {
        case `${deployer.address}`:
          sender = deployer;
          break;
        case `${depositor.address}`:
          sender = depositor;
          break;
        case `${borrower.address}`:
          sender = borrower;
          break;
        case `${collateralServiceProvider.address}`:
          sender = collateralServiceProvider;
          break;
        case `${signer.address}`:
          sender = signer;
          break;
      }
    }
    amount =
      args.amount != undefined
        ? utils.parseEther(args.amount).toString()
        : utils.parseEther('100').toString();

    const balance = await underlyingAsset.balanceOf(sender.address);
    if (balance.lte(amount)) {
      await hre.run('local:transfer', { amount: amount, sender: deployer.address });
    }

    const allowance = await underlyingAsset.allowance(sender.address, moneyPool.address);
    if (allowance.lte(amount)) {
      await hre.run('testnet:moneyPoolApprove', { amount: amount, sender: sender.address });
    }

    await moneyPool.connect(sender).deposit(underlyingAsset.address, sender.address, amount);
    console.log(`${sender.address.substr(0, 10)} deposits  ${amount}`);
  });

task('local:moneyPoolApprove', 'Approve to moneyPool, default: 100')
  .addParam('sender', 'The tx sender, default: deployer')
  .addOptionalParam('amount', 'The approve amount')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    let sender: SignerWithAddress;
    let amount: string;
    const [deployer, depositor, borrower, collateralServiceProvider, signer] =
      await hre.ethers.getSigners();

    const deployedElyfiContracts = (await getDeployedContracts(hre, deployer)) as ElyfiContracts;
    const underlyingAsset = deployedElyfiContracts.underlyingAsset;
    const moneyPool = deployedElyfiContracts.moneyPool;

    sender = deployer;
    amount = '';

    switch (args.sender) {
      case `${deployer.address}`:
        sender = deployer;
        break;
      case `${depositor.address}`:
        sender = depositor;
        break;
      case `${borrower.address}`:
        sender = borrower;
        break;
      case `${collateralServiceProvider.address}`:
        sender = collateralServiceProvider;
        break;
      case `${signer.address}`:
        sender = signer;
        break;
    }

    amount = args.amount != undefined ? args.amount : utils.parseEther('100').toString();

    await underlyingAsset.connect(sender).approve(moneyPool.address, amount);
    console.log(`${args.sender} approves moneyPool ${amount}`);
  });

task('local:transfer', 'Transfer underlyingAsset to account, default amount: 100')
  .addOptionalParam('sender', 'The tx sender, default: deployer')
  .addParam('account', 'The receiver, default: depositor')
  .addOptionalParam('amount', 'The approve amount, default amount: 100')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    let sender: SignerWithAddress;
    let amount: string;
    const [deployer, depositor, borrower, collateralServiceProvider, signer] =
      await hre.ethers.getSigners();

    const deployedElyfiContracts = (await getDeployedContracts(hre, deployer)) as ElyfiContracts;
    const underlyingAsset = deployedElyfiContracts.underlyingAsset;

    sender = deployer;

    switch (args.sender) {
      case `${deployer.address}`:
        sender = deployer;
        break;
      case `${depositor.address}`:
        sender = depositor;
        break;
      case `${borrower.address}`:
        sender = borrower;
        break;
      case `${collateralServiceProvider.address}`:
        sender = collateralServiceProvider;
        break;
      case `${signer.address}`:
        sender = signer;
        break;
    }

    amount = args.amount != undefined ? args.amount : utils.parseEther('100').toString();

    console.log('sender', sender.address);

    await underlyingAsset.connect(sender).transfer(args.account, amount);
    console.log(
      `${sender.address.substr(0, 10)} transfer ${amount} to ${args.account.substr(0, 10)}`
    );
  });

// const advanceTime = (hre: HardhatRuntimeEnvironment, time: number) => {
//   return new Promise((resolve, reject) => {
//     hre.network.provider.send('evm_increaseTime', [time]),
//       (err: any, result: unknown) => {
//         if (err) {
//           console.log('err');
//           return reject(err);
//         }
//         console.log('result');
//         return resolve(result);
//       };
//   });
// };

// subtask('addCollateralServiceProvider', 'add collateral service provider role').setAction(
//   async (hre: HardhatRuntimeEnvironment) => {
//     const [deployer, depositor, borrower, collateralServiceProvider, signer] =
//       await hre.ethers.getSigners();

//     const deployedElyfiContracts = (await getDeployedContracts(hre, deployer)) as ElyfiContracts;
//     const connector = deployedElyfiContracts.connector;

//     connector
//       .connect(deployer)
//       .addCollateralServiceProvider(collateralServiceProvider.address);
//   }
// );

// subtask('addCouncil', 'add council role').setAction(async () => {
//   const [deployer, depositor, borrower, collateralServiceProvider, signer] =
//     await hre.ethers.getSigners();

//   const deployedElyfiContracts = (await getDeployedContracts(hre, deployer)) as ElyfiContracts;
//   const connector = deployedElyfiContracts.connector;

//   connector.connect(deployer).addCouncil(signer.address);
// });
