import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ERC20Test } from '../../typechain';
import { getDai } from '../../utils/getDependencies';

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

    const underlyingAsset = (await getDai(hre)) as ERC20Test;

    amount = args.amount != undefined ? args.amount : hre.ethers.utils.parseEther('100').toString();

    const from = await hre.ethers.getSigner(args.from);

    const approveTx = await underlyingAsset.connect(from).approve(args.to, amount);
    await approveTx.wait();
    console.log(`${args.from} approves moneyPool ${amount}`);
  });

task('testnet:transfer', 'Transfer underlyingAsset to account, default amount: 100')
  .addParam('from', 'from address')
  .addParam('to', 'to address')
  .addOptionalParam('amount', 'The transfer amount')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    let amount: string;
    const [deployer] = await hre.ethers.getSigners();

    const underlyingAsset = (await getDai(hre)) as ERC20Test;

    amount = args.amount != undefined ? args.amount : hre.ethers.utils.parseEther('100').toString();

    const from = await hre.ethers.getSigner(args.from);

    const trasnferTx = await underlyingAsset.connect(from).transfer(args.to, amount);
    await trasnferTx.wait();
    console.log(`${args.from.substr(0, 10)} transfer ${amount} to ${args.to.substr(0, 10)}`);
  });
