import { BigNumber } from 'bignumber.js';
import { Wallet } from 'ethers';
import { DataPipeline, ERC20Test, LTokenTest } from '../../typechain';
import { AssetBondData, defaultInterestModelParams, ReserveData, UserData } from './Interfaces';

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
  userData.underlyingAssetBalance = new BigNumber(
    contractUserData.underlyingAssetBalance.toString()
  );
  userData.lTokenBalance = new BigNumber(contractUserData.lTokenBalance.toString());
  userData.implicitLtokenBalance = new BigNumber(contractUserData.implicitLtokenBalance.toString());
  userData.dTokenBalance = new BigNumber(contractUserData.dTokenBalance.toString());
  userData.principalDTokenBalance = new BigNumber(
    contractUserData.principalDTokenBalance.toString()
  );
  userData.averageRealAssetBorrowRate = new BigNumber(
    contractUserData.averageRealAssetBorrowRate.toString()
  );
  userData.userLastUpdateTimestamp = new BigNumber(contractUserData.lastUpdateTimestamp.toString());

  return userData;
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
  reserveData.underlyingAssetAddress = underlyingAsset.address;
  reserveData.underlyingAssetName = await underlyingAsset.name();
  reserveData.underlyingAssetSymbol = await underlyingAsset.symbol();
  reserveData.underlyingAssetDecimals = new BigNumber(await underlyingAsset.decimals());
  reserveData.underlyingAssetBalance = new BigNumber(
    (await underlyingAsset.balanceOf(lToken.address)).toString()
  );
  reserveData.totalLTokenSupply = new BigNumber(contractReserveData.totalLTokenSupply.toString());
  reserveData.implicitLTokenSupply = new BigNumber(
    contractReserveData.implicitLTokenSupply.toString()
  );
  reserveData.lTokenInterestIndex = new BigNumber(
    contractReserveData.lTokenInterestIndex.toString()
  );
  reserveData.principalDTokenSupply = new BigNumber(
    contractReserveData.principalDTokenSupply.toString()
  );
  reserveData.totalDTokenSupply = new BigNumber(contractReserveData.totalDTokenSupply.toString());
  reserveData.averageRealAssetBorrowRate = new BigNumber(
    contractReserveData.averageRealAssetBorrowRate.toString()
  );
  reserveData.borrowAPR = new BigNumber(contractReserveData.borrowAPR.toString());
  reserveData.supplyAPR = new BigNumber(contractReserveData.supplyAPR.toString());
  reserveData.moneyPoolLastUpdateTimestamp = new BigNumber(
    contractReserveData.moneyPooLastUpdateTimestamp.toString()
  );
  reserveData.dTokenLastUpdateTimestamp = new BigNumber(
    contractReserveData.dTokenLastUpdateTimestamp.toString()
  );
  reserveData.interestRateModelParams = defaultInterestModelParams;

  /*
  console.log(
    'Contract Helpers:',
    contractReserveData.totalDTokenSupply.toString(),
    contractReserveData.borrowAPR.toString(),
    contractReserveData.supplyAPR.toString()
  );
  */

  return reserveData;
}

export async function getAssetBondData({
  underlyingAsset,
  dataPipeline,
  user,
}: {
  underlyingAsset: ERC20Test;
  dataPipeline: DataPipeline;
  user: Wallet;
}): Promise<AssetBondData> {
  const assetBondData = <AssetBondData>{};
  return assetBondData;
}
