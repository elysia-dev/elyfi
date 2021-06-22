import { subtask, task } from 'hardhat/config';
import '@nomiclabs/hardhat-waffle';
import { BigNumber, utils } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import ElyfiContracts from '../test/types/ElyfiContracts';
import getDeployedContracts from '../test/utils/getDeployedContracts';
import { AssetBondSettleData } from '../test/utils/Interfaces';
import { RAY } from '../test/utils/constants';
import { advanceTimeTo, getTimestamp, toTimestamp } from '../test/utils/Ethereum';

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
    console.log(hre.network.name);
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

    console.log(`${depositor.address} deposits 100ETH and 500ETH`);
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

    console.log(`${depositor.address} withdraws 100ETH and 500ETH`);
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
    console.log(isCollateralServiceProvider);
    if (!isCollateralServiceProvider) {
      await connector
        .connect(deployer)
        .addCollateralServiceProvider(collateralServiceProvider.address);
    }

    await tokenizer
      .connect(collateralServiceProvider)
      .mintAssetBond(collateralServiceProvider.address, args.bond);

    console.log(
      `${collateralServiceProvider.address} mints asset token which id is "${args.bond}"`
    );
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

    console.log(
      `${collateralServiceProvider.address} settles asset token which id is "${args.bond}"`
    );
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

    console.log(`${signer.address} signs on asset token which id is "${args.bond}"`);
  });

task('createBorrow', 'Create borrow : 1500ETH')
  .addOptionalParam('bond', 'The id of asset bond token')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    let borrowPrincipal: BigNumber;
    const [deployer, depositor, borrower, collateralServiceProvider, signer] =
      await hre.ethers.getSigners();

    const deployedElyfiContracts = (await getDeployedContracts(hre, deployer)) as ElyfiContracts;
    const moneyPool = deployedElyfiContracts.moneyPool;
    const tokenizer = deployedElyfiContracts.tokenizer;
    const underlyingAsset = deployedElyfiContracts.underlyingAsset;

    if (args.bond == undefined) {
      args.bond = testAssetBondData.tokenId.toString();
      borrowPrincipal = testAssetBondData.principal;
    } else {
      const assetBondData = await tokenizer.getAssetBondData(args.bond);
      borrowPrincipal = assetBondData.principal;
    }

    const loanStartTimestamp = toTimestamp(
      testAssetBondData.loanStartTimeYear,
      testAssetBondData.loanStartTimeMonth,
      testAssetBondData.loanStartTimeDay
    );

    await moneyPool.connect(collateralServiceProvider).borrow(underlyingAsset.address, args.bond);

    console.log(
      `${depositor.address} borrows against ${args.bond} which amount is ${borrowPrincipal}`
    );
  });

task('createRepay', 'Create repay : 1500ETH')
  .addParam('bond', 'The id of asset bond token')
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

    await moneyPool.connect(borrower).repay(underlyingAsset.address, args.bond);

    console.log(`${depositor.address} repays a loan on ${args.bond}`);
  });

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
