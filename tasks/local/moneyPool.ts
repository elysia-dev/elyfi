import { task } from 'hardhat/config';
import ElyfiContracts from '../../test/types/ElyfiContracts';
import getDeployedContracts, {
  getConnector,
  getMoneyPool,
  getTokenizer,
} from '../../utils/getDeployedContracts';
import { testAssetBond } from '../../test/utils/testData';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import assetBondIdData from '../../misc/assetBond/assetBondIdDataExample.json';
import { tokenIdGenerator } from '../../misc/assetBond/generator';
import { getDai, getElyfi, getElysia } from '../../utils/getDependencies';
import { Connector, ERC20Test, LToken, MoneyPool, Tokenizer } from '../../typechain';

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
    let amount: string;
    const [deployer, depositor, borrower, collateralServiceProvider, signer] =
      await hre.ethers.getSigners();

    const moneyPool = (await getMoneyPool(hre)) as MoneyPool;
    const dai = (await getDai(hre)) as ERC20Test;

    console.log(await moneyPool.getLTokenInterestIndex(dai.address));

    // const deployedElyfiContracts = (await getDeployedContracts(hre, deployer)) as ElyfiContracts;
    // const moneyPool = await getMoneyPool(hre);
    // const underlyingAsset = await getDai(hre);

    // amount =
    //   args.amount != undefined
    //     ? hre.ethers.utils.parseEther(args.amount).toString()
    //     : hre.ethers.utils.parseEther('100').toString();

    // const balance = await underlyingAsset.balanceOf(depositor.address);
    // if (balance.lt(amount)) {
    //   await hre.run('local:transfer', {
    //     from: deployer.address,
    //     to: depositor.address,
    //     amount: amount,
    //   });
    // }

    // const allowance = await underlyingAsset.allowance(depositor.address, moneyPool.address);
    // if (allowance.lt(amount)) {
    //   await hre.run('local:approve', {
    //     from: depositor.address,
    //     to: moneyPool.address,
    //     amount: amount,
    //   });
    // }

    // const tx = await moneyPool
    //   .connect(deployer)
    //   .deposit(underlyingAsset.address, depositor.address, amount);

    // console.log((await tx.wait()).events);
    // console.log(`${depositor.address.substr(0, 10)} deposits ${amount}`);
  });

task('local:withdraw', 'Create withdraw, default txSender: depositor, amount: 100')
  .addOptionalParam('amount', 'The approve amount')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const [deployer, depositor] = await hre.ethers.getSigners();

    const deployedElyfiContracts = (await getDeployedContracts(hre, deployer)) as ElyfiContracts;
    const moneyPool = (await getMoneyPool(hre)) as MoneyPool;
    const underlyingAsset = (await getDai(hre)) as ERC20Test;

    await moneyPool
      .connect(depositor)
      .withdraw(underlyingAsset.address, depositor.address, hre.ethers.utils.parseEther('100'));
    await moneyPool
      .connect(depositor)
      .withdraw(underlyingAsset.address, depositor.address, hre.ethers.utils.parseEther('500'));

    console.log(`Depositor withdraws 100ETH and 500ETH`);
  });

task('local:borrow', 'Create borrow : 1500ETH')
  .addParam('bond', 'The nonce of the token id')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const [deployer, depositor, borrower, collateralServiceProvider, signer] =
      await hre.ethers.getSigners();

    const moneyPool = (await getMoneyPool(hre)) as MoneyPool;
    const tokenizer = (await getTokenizer(hre)) as Tokenizer;
    const connector = (await getConnector(hre)) as Connector;
    const lToken = (await getConnector(hre)) as LToken;
    const underlyingAsset = (await getDai(hre)) as ERC20Test;

    const snapshot = await hre.ethers.provider.send('evm_snapshot', []);

    assetBondIdData.nonce = +args.bond;
    if (args.bond.length > 5) {
      console.log('The nonce of bond is too big. --bond should be less than 10000');
      assetBondIdData.nonce = 0;
    }
    const tokenId = tokenIdGenerator(assetBondIdData);

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
      .mintAssetBond(collateralServiceProvider.address, tokenId);
    console.log(`The collateral service provider mints asset token which id is "${args.bond}"`);

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
        testAssetBond.loanStartTimeDay.add(snapshot),
        testAssetBond.ipfsHash
      );

    await tokenizer.connect(signer).signAssetBond(tokenId, 'test opinion');
    console.log(`The signer signs on asset token which id is "${args.bond}"`);

    const assetBondData = await tokenizer.getAssetBondData(tokenId);
    const borrowprincipal = assetBondData.principal;
    const loanStartTimestamp = assetBondData.loanStartTimestamp.toNumber();
    const liquidityAvailable = await underlyingAsset.balanceOf(lToken.address);

    if (liquidityAvailable.lt(borrowprincipal)) {
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
        `The collateral service provider borrows against token id '${args.bond}' which principal amount is '${borrowprincipal}'`
      );
    } else {
      console.log(
        `Borrow failed since current timestamp(${currentTimestamp}) exceeds loanStartTimestamp(${loanStartTimestamp})`
      );
    }
  });

task('local:repay', 'Create repay : 1500ETH')
  .addParam('bond', 'The id of asset bond token')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const [deployer, depositor, borrower, collateralServiceProvider, signer] =
      await hre.ethers.getSigners();

    const moneyPool = (await getMoneyPool(hre)) as MoneyPool;
    const underlyingAsset = (await getDai(hre)) as ERC20Test;

    assetBondIdData.nonce = +args.bond;
    if (args.bond.length > 5) {
      console.log('The nonce of bond is too big. --bond should be less than 10000');
      assetBondIdData.nonce = 0;
    }
    const tokenId = tokenIdGenerator(assetBondIdData);

    await underlyingAsset
      .connect(deployer)
      .transfer(depositor.address, hre.ethers.utils.parseEther('1000'));
    await underlyingAsset
      .connect(borrower)
      .approve(moneyPool.address, hre.ethers.utils.parseEther('1500'));

    await moneyPool.connect(borrower).repay(underlyingAsset.address, tokenId);

    console.log(`The borrower repays a loan on ${args.bond}`);
  });
