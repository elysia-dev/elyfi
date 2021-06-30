import { task } from 'hardhat/config';
import ElyfiContracts from '../../test/types/ElyfiContracts';
import getDeployedContracts from '../../test/utils/getDeployedContracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { testAssetBondData } from '../../test/utils/testData';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

interface Args {
  asset: string;
  bond: string;
  amount: string;
  txSender: string;
  loanStart: string;
}

task('local:deposit', 'Deposit, default amount : 100, default txSender : depositor')
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
    amount =
      args.amount != undefined
        ? hre.ethers.utils.parseEther(args.amount).toString()
        : hre.ethers.utils.parseEther('100').toString();

    const balance = await underlyingAsset.balanceOf(txSender.address);
    if (balance.lte(amount)) {
      await hre.run('local:transfer', {
        from: deployer.address,
        to: txSender.address,
        amount: amount,
      });
    }

    const allowance = await underlyingAsset.allowance(txSender.address, moneyPool.address);
    if (allowance.lte(amount)) {
      await hre.run('local:approve', {
        from: txSender.address,
        to: moneyPool.address,
        amount: amount,
      });
    }

    const tx = await moneyPool
      .connect(txSender)
      .deposit(underlyingAsset.address, txSender.address, amount);
    console.log(`${txSender.address.substr(0, 10)} deposits ${amount}`);
  });

task('local:withdraw', 'Create withdraw, default txSender: depositor, amount: 100').setAction(
  async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const [deployer, depositor] = await hre.ethers.getSigners();

    const deployedElyfiContracts = (await getDeployedContracts(hre, deployer)) as ElyfiContracts;
    const moneyPool = deployedElyfiContracts.moneyPool;
    const underlyingAsset = deployedElyfiContracts.underlyingAsset;

    await moneyPool
      .connect(depositor)
      .withdraw(underlyingAsset.address, depositor.address, hre.ethers.utils.parseEther('100'));
    await moneyPool
      .connect(depositor)
      .withdraw(underlyingAsset.address, depositor.address, hre.ethers.utils.parseEther('500'));

    console.log(`Depositor withdraws 100ETH and 500ETH`);
  }
);

task('local:borrow', 'Create borrow : 1500ETH').setAction(
  async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const [deployer, depositor, borrower, collateralServiceProvider, signer] =
      await hre.ethers.getSigners();

    const deployedElyfiContracts = (await getDeployedContracts(hre, deployer)) as ElyfiContracts;
    const moneyPool = deployedElyfiContracts.moneyPool;
    const tokenizer = deployedElyfiContracts.tokenizer;
    const connector = deployedElyfiContracts.connector;
    const lToken = deployedElyfiContracts.lToken;
    const underlyingAsset = deployedElyfiContracts.underlyingAsset;

    const snapshot = await hre.ethers.provider.send('evm_snapshot', []);

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

    const tokenId = testAssetBondData.tokenId.add(snapshot);

    await tokenizer
      .connect(collateralServiceProvider)
      .mintAssetBond(collateralServiceProvider.address, tokenId);
    console.log(`The collateral service provider mints asset token which id is "${snapshot}"`);

    await tokenizer
      .connect(collateralServiceProvider)
      .settleAssetBond(
        borrower.address,
        signer.address,
        tokenId,
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

    await tokenizer.connect(signer).signAssetBond(tokenId, 'test opinion');
    console.log(`The signer signs on asset token which id is "${snapshot}"`);

    const assetBondData = await tokenizer.getAssetBondData(tokenId);
    const borrowPrincipal = assetBondData.principal;
    const loanStartTimestamp = assetBondData.loanStartTimestamp.toNumber();
    const liquidityAvailable = await underlyingAsset.balanceOf(lToken.address);

    if (liquidityAvailable.lte(borrowPrincipal)) {
      await underlyingAsset
        .connect(deployer)
        .transfer(depositor.address, hre.ethers.utils.parseEther('1000'));
      await underlyingAsset
        .connect(depositor)
        .approve(moneyPool.address, hre.ethers.utils.parseEther('1000'));

      await moneyPool
        .connect(depositor)
        .deposit(underlyingAsset.address, depositor.address, hre.ethers.utils.parseEther('100'));
      console.log(`The depositor deposited 100 due to the lack of available liquidity`);
    }

    const currentTimestamp = (await hre.ethers.provider.getBlock('latest')).timestamp;

    if (currentTimestamp < loanStartTimestamp) {
      const secondsToIncrease = loanStartTimestamp - currentTimestamp + 1;
      const timestamp = await hre.network.provider.send('evm_increaseTime', [secondsToIncrease]);
      await tokenizer.connect(collateralServiceProvider).approve(moneyPool.address, tokenId);
      const borrowTx = await moneyPool
        .connect(collateralServiceProvider)
        .borrow(underlyingAsset.address, tokenId);
      console.log(
        `The collateral service provider borrows against token id '${snapshot}' which principal amount is '${borrowPrincipal}'`
      );
    } else {
      console.log(
        `Borrow failed since current timestamp(${currentTimestamp}) exceeds loanStartTimestamp(${loanStartTimestamp})`
      );
    }
  }
);

task('local:createRepay', 'Create repay : 1500ETH')
  .addParam('bond', 'The id of asset bond token')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const [deployer, depositor, borrower, collateralServiceProvider, signer] =
      await hre.ethers.getSigners();

    const deployedElyfiContracts = (await getDeployedContracts(hre, deployer)) as ElyfiContracts;
    const moneyPool = deployedElyfiContracts.moneyPool;
    const underlyingAsset = deployedElyfiContracts.underlyingAsset;

    await underlyingAsset
      .connect(deployer)
      .transfer(depositor.address, hre.ethers.utils.parseEther('1000'));
    await underlyingAsset
      .connect(borrower)
      .approve(moneyPool.address, hre.ethers.utils.parseEther('1500'));

    if (args.bond == undefined) {
      args.bond = testAssetBondData.tokenId.toString();
    }

    await moneyPool.connect(borrower).repay(underlyingAsset.address, args.bond);

    console.log(`The borrower repays a loan on ${args.bond}`);
  });
