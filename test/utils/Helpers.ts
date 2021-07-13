import { BigNumber, ContractTransaction } from 'ethers';
import { Wallet } from 'ethers';
import AssetBondData from '../types/AssetBondData';
import ReserveData from '../types/ReserveData';
import UserData from '../types/UserData';
import AssetBondSettleData from '../types/AssetBondSettleData';
import { DataPipeline, ERC20Test, LTokenTest, TokenizerTest } from '../../typechain';
import { testInterestModelParams } from './testData';

export async function getUserData({
  underlyingAsset,
  dataPipeline,
  user,
}: {
  underlyingAsset: ERC20Test;
  dataPipeline: DataPipeline;
  user: Wallet;
}): Promise<UserData> {
  const userData = <UserData>{};
  const contractUserData = await dataPipeline.getUserData(underlyingAsset.address, user.address);

  return {
    ...userData,
    underlyingAssetBalance: contractUserData.underlyingAssetBalance,
    lTokenBalance: contractUserData.lTokenBalance,
    implicitLtokenBalance: contractUserData.implicitLtokenBalance,
    dTokenBalance: contractUserData.dTokenBalance,
    principalDTokenBalance: contractUserData.principalDTokenBalance,
    averageRealAssetBorrowRate: contractUserData.averageRealAssetBorrowRate,
    userLastUpdateTimestamp: contractUserData.lastUpdateTimestamp,
  };
}

export async function getReserveData({
  underlyingAsset,
  dataPipeline,
  lToken,
}: {
  underlyingAsset: ERC20Test;
  dataPipeline: DataPipeline;
  lToken: LTokenTest;
}): Promise<ReserveData> {
  const reserveData = <ReserveData>{};
  const contractReserveData = await dataPipeline.getReserveData(underlyingAsset.address);

  return {
    ...reserveData,
    lTokenInterestIndex: contractReserveData.lTokenInterestIndex,
    principalDTokenSupply: contractReserveData.principalDTokenSupply,
    totalDTokenSupply: contractReserveData.totalDTokenSupply,
    totalLTokenSupply: contractReserveData.totalLTokenSupply,
    implicitLTokenSupply: contractReserveData.implicitLTokenSupply,
    averageRealAssetBorrowRate: contractReserveData.averageRealAssetBorrowRate,
    borrowAPY: contractReserveData.borrowAPY,
    depositAPY: contractReserveData.depositAPY,
    moneyPoolLastUpdateTimestamp: contractReserveData.moneyPooLastUpdateTimestamp,
    dTokenLastUpdateTimestamp: contractReserveData.dTokenLastUpdateTimestamp,
    underlyingAssetAddress: underlyingAsset.address,
    underlyingAssetName: await underlyingAsset.name(),
    underlyingAssetSymbol: await underlyingAsset.symbol(),
    underlyingAssetDecimals: BigNumber.from(await underlyingAsset.decimals()),
    underlyingAssetBalance: await underlyingAsset.balanceOf(lToken.address),
    interestRateModelParams: testInterestModelParams,
  };
}

export async function getAssetBondData({
  underlyingAsset,
  dataPipeline,
  tokenizer,
  tokenId,
}: {
  underlyingAsset: ERC20Test;
  dataPipeline: DataPipeline;
  tokenizer: TokenizerTest;
  tokenId: BigNumber;
}): Promise<AssetBondData> {
  const assetBondData = <AssetBondData>{};
  const contractAssetBondStateData = await dataPipeline.getAssetBondStateData(
    underlyingAsset.address,
    tokenId
  );
  const contractAssetBondData = await tokenizer.getAssetBondData(tokenId);

  return {
    ...assetBondData,
    state: contractAssetBondStateData.assetBondState,
    tokenId: tokenId,
    tokenOwner: contractAssetBondStateData.tokenOwner,
    borrower: contractAssetBondData.borrower,
    signer: contractAssetBondData.signer,
    collateralServiceProvider: contractAssetBondData.collateralServiceProvider,
    principal: contractAssetBondData.principal,
    debtCeiling: contractAssetBondData.debtCeiling,
    couponRate: contractAssetBondData.couponRate,
    interestRate: contractAssetBondData.interestRate,
    delinquencyRate: contractAssetBondData.delinquencyRate,
    loanStartTimestamp: contractAssetBondData.loanStartTimestamp,
    collateralizeTimestamp: contractAssetBondData.collateralizeTimestamp,
    maturityTimestamp: contractAssetBondData.maturityTimestamp,
    liquidationTimestamp: contractAssetBondData.liquidationTimestamp,
    accruedDebtOnMoneyPool: contractAssetBondStateData.debtOnMoneyPool,
    feeOnCollateralServiceProvider: contractAssetBondStateData.feeOnCollateralServiceProvider,
    ipfsHash: contractAssetBondData.ipfsHash,
    signerOpinionHash: contractAssetBondData.signerOpinionHash,
  };
}

export async function settleAssetBond({
  tokenizer,
  txSender,
  settleArguments,
}: {
  tokenizer: TokenizerTest;
  txSender: Wallet;
  settleArguments: AssetBondSettleData;
}): Promise<ContractTransaction> {
  return await tokenizer
    .connect(txSender)
    .settleAssetBond(
      settleArguments.borrower,
      settleArguments.signer,
      settleArguments.tokenId,
      settleArguments.principal,
      settleArguments.couponRate,
      settleArguments.delinquencyRate,
      settleArguments.debtCeiling,
      settleArguments.loanDuration,
      settleArguments.loanStartTimeYear,
      settleArguments.loanStartTimeMonth,
      settleArguments.loanStartTimeDay,
      settleArguments.ipfsHash
    );
}
