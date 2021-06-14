import { BigNumber, ContractTransaction } from 'ethers';
import { Wallet } from 'ethers';
import { DataPipeline, ERC20Test, LTokenTest, TokenizerTest } from '../../typechain';
import {
  AssetBondSettleData,
  defaultInterestModelParams,
  ReserveData,
  UserData,
} from './Interfaces';

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
    borrowAPR: contractReserveData.borrowAPR,
    supplyAPR: contractReserveData.supplyAPR,
    moneyPoolLastUpdateTimestamp: contractReserveData.moneyPooLastUpdateTimestamp,
    dTokenLastUpdateTimestamp: contractReserveData.dTokenLastUpdateTimestamp,
    underlyingAssetAddress: underlyingAsset.address,
    underlyingAssetName: await underlyingAsset.name(),
    underlyingAssetSymbol: await underlyingAsset.symbol(),
    underlyingAssetDecimals: BigNumber.from(await underlyingAsset.decimals()),
    underlyingAssetBalance: await underlyingAsset.balanceOf(lToken.address),
    interestRateModelParams: defaultInterestModelParams,
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
      settleArguments.overdueInterestRate,
      settleArguments.debtCeiling,
      settleArguments.loanDuration,
      settleArguments.loanStartTimeYear,
      settleArguments.loanStartTimeMonth,
      settleArguments.loanStartTimeDay,
      settleArguments.ipfsHash
    );
}
