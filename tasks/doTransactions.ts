import { subtask, task } from 'hardhat/config';
import { BigNumber, utils } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import ElyfiContracts from '../test/types/ElyfiContracts';
import getDeployedContracts from '../test/utils/getDeployedContracts';
import { AssetBondSettleData } from '../test/utils/Interfaces';
import { RAY } from '../test/utils/constants';

const testAssetBondData: AssetBondSettleData = <AssetBondSettleData>{
  ...(<AssetBondSettleData>{}),
  borrower: '',
  signer: '',
  tokenId: BigNumber.from('100100200300400'),
  principal: utils.parseEther('10'),
  debtCeiling: utils.parseEther('13'),
  couponRate: BigNumber.from(RAY).div(10),
  overdueInterestRate: BigNumber.from(RAY).div(33),
  loanDuration: BigNumber.from(365),
  loanStartTimeYear: BigNumber.from(2022),
  loanStartTimeMonth: BigNumber.from(0),
  loanStartTimeDay: BigNumber.from(1),
  ipfsHash: 'test',
};

interface Args {
  pool: string;
  asset: string;
  bond: string;
}

task('createDeposit', 'Create deposit : 1500ETH').setAction(
  async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const [deployer, depositor] = await hre.ethers.getSigners();

    const deployedElyfiContracts = (await getDeployedContracts(hre, deployer)) as ElyfiContracts;
    const moneyPool = deployedElyfiContracts.moneyPool;
    const underlyingAsset = deployedElyfiContracts.underlyingAsset;

    await underlyingAsset.connect(deployer).transfer(depositor.address, utils.parseEther('1000'));
    await underlyingAsset.connect(depositor).approve(moneyPool.address, utils.parseEther('1500'));

    await moneyPool
      .connect(depositor)
      .deposit(underlyingAsset.address, depositor.address, utils.parseEther('100'));
    await moneyPool
      .connect(depositor)
      .deposit(underlyingAsset.address, depositor.address, utils.parseEther('500'));

    console.log(`Depositor deposits 100ETH and 500ETH`);
  }
);

task('createWithdraw', 'Create withdraw : 1500ETH').setAction(
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

task('mintAssetBond', 'Create empty asset bond')
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

task('createBorrowSequence', 'Create borrow : 1500ETH')
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
