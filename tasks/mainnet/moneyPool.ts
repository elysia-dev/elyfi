import { task } from 'hardhat/config';
import { getConnector, getMoneyPool, getTokenizer } from '../../utils/getDeployedContracts';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Connector, MoneyPool, Tokenizer } from '../../typechain';
import { getCSP } from '../../utils/getWallets';
import AssetBondSettleData from '../../test/types/AssetBondSettleData';
import { BigNumber, ethers, Wallet } from 'ethers';
import AssetBondState from '../../test/types/AssetBondState';
import { getDai } from '../../utils/getDependencies';

interface Args {
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

const checkApproved = async ({
  tokenId,
  moneyPool,
  tokenizer,
}: {
  tokenId: BigNumber;
  moneyPool: MoneyPool;
  tokenizer: Tokenizer;
}) => {
  const isApproved = (await tokenizer.getApproved(tokenId)) == moneyPool.address;
  if (!isApproved) {
    throw new Error(`The token has not been approved`);
  }
};

const checkTokenState = async ({
  tokenId,
  tokenizer,
}: {
  tokenId: BigNumber;
  tokenizer: Tokenizer;
}) => {
  const contractAssetBondData = await tokenizer.getAssetBondData(tokenId);
  if (contractAssetBondData.state != AssetBondState.CONFIRMED) {
    throw new Error(`The token has not been confirmed`);
  }
};

task('mainnet:borrow', 'Borrow asset bond')
  .addParam('data', 'The asset bond from saved production data')
  .setAction(async (args: Args, hre: HardhatRuntimeEnvironment) => {
    const collateralServiceProvider = await getCSP(hre);

    const tokenizer = (await getTokenizer(hre)) as Tokenizer;
    const connector = (await getConnector(hre)) as Connector;
    const moneyPool = (await getMoneyPool(hre)) as MoneyPool;
    const underlyingAsset = await getDai(hre);

    const assetBondData = require(`../../data/assetBond/mainnet/${args.data}`)
      .data as AssetBondSettleData;

    checkAssetBondFileData(assetBondData);

    await checkCollateralServiceProvider({
      connector: connector,
      txSender: collateralServiceProvider,
    });

    await checkTokenState({
      tokenId: assetBondData.tokenId,
      tokenizer: tokenizer,
    });

    await checkApproved({
      tokenId: assetBondData.tokenId,
      moneyPool: moneyPool,
      tokenizer: tokenizer,
    });

    const borrowTx = await moneyPool
      .connect(collateralServiceProvider)
      .borrow(underlyingAsset.address, assetBondData.tokenId);

    await borrowTx.wait();

    console.log(`The signer signs on asset token which da is "${args.data}"`);
  });
