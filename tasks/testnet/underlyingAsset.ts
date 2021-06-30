import { task } from 'hardhat/config';
import ElyfiContracts from '../../test/types/ElyfiContracts';
import getDeployedContracts from '../../test/utils/getDeployedContracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

interface Args {
  from: string;
  to: string;
  amount: string;
}

task('testnet:approve', 'Approve to moneyPool, default: 100')
  .addParam('from', 'from address')
  .addParam('to', 'to address')
  .addOptionalParam('amount', 'The approve amount')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    let amount: string;
    const [deployer] = await hre.ethers.getSigners();

    const deployedElyfiContracts = (await getDeployedContracts(hre, deployer)) as ElyfiContracts;
    const underlyingAsset = deployedElyfiContracts.underlyingAsset;

    amount = args.amount != undefined ? args.amount : hre.ethers.utils.parseEther('100').toString();

    await underlyingAsset.connect(args.from).approve(args.to, amount);
    console.log(`${args.from} approves moneyPool ${amount}`);
  });

task('testnet:transfer', 'Transfer underlyingAsset to account, default amount: 100')
  .addParam('from', 'from address')
  .addParam('to', 'to address')
  .addOptionalParam('amount', 'The transfer amount')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    let amount: string;
    const [deployer] = await hre.ethers.getSigners();

    const deployedElyfiContracts = (await getDeployedContracts(hre, deployer)) as ElyfiContracts;
    const underlyingAsset = deployedElyfiContracts.underlyingAsset;

    amount = args.amount != undefined ? args.amount : hre.ethers.utils.parseEther('100').toString();

    await underlyingAsset.connect(args.from).transfer(args.to, amount);
    console.log(`${args.from.substr(0, 10)} transfer ${amount} to ${args.to.substr(0, 10)}`);
  });
