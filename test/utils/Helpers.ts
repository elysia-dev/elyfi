import { BigNumber, Wallet } from "ethers";
import { DataPipeline, ERC20Test, LTokenTest } from "../../typechain";
import { defaultInterestModelParams, ReserveData, UserData } from "./Interfaces";

export async function getUserData({
    underlyingAsset,
    dataPipeline,
    user
}: {
    underlyingAsset: ERC20Test
    dataPipeline: DataPipeline
    user: Wallet
}): Promise<UserData> {
    const userData = <UserData>{};
    const contractUserData = await dataPipeline.getUserData(
        underlyingAsset.address,
        user.address
    )
    userData.underlyingAssetBalance = contractUserData.underlyingAssetBalance;
    userData.lTokenBalance = contractUserData.lTokenBalance;
    userData.implicitLtokenBalance = contractUserData.implicitLtokenBalance;
    userData.dTokenBalance = contractUserData.dTokenBalance;
    userData.implicitDtokenBalance = contractUserData.implicitDtokenBalance;

    return userData;
}

export async function getReserveData({
    underlyingAsset,
    dataPipeline,
    lToken,
}: {
    underlyingAsset: ERC20Test
    dataPipeline: DataPipeline
    lToken: LTokenTest
}): Promise<ReserveData> {
    const reserveData = <ReserveData>{};
    const contractReserveData = await dataPipeline.getReserveData(
        underlyingAsset.address
    )
    reserveData.underlyingAssetAddress = underlyingAsset.address
    reserveData.underlyingAssetName = await underlyingAsset.name()
    reserveData.underlyingAssetSymbol = await underlyingAsset.symbol();
    reserveData.underlyingAssetDecimals = BigNumber.from(await underlyingAsset.decimals());
    reserveData.underlyingAssetBalance = await underlyingAsset.balanceOf(lToken.address);
    reserveData.totalLTokenSupply = contractReserveData.totalLTokenSupply;
    reserveData.implicitLTokenSupply = contractReserveData.implicitLTokenSupply;
    reserveData.totalDTokenSupply = contractReserveData.totalDTokenSupply;
    reserveData.implicitDTokenSupply = contractReserveData.implicitDTokenSupply;
    reserveData.totalATokenSupply = contractReserveData.totalATokenSupply;
    reserveData.totalMoneyPoolATokenBalance = contractReserveData.totalMoneyPoolATokenBalance;
    reserveData.lTokenInterestIndex = contractReserveData.lTokenInterestIndex;
    reserveData.dTokenInterestIndex = contractReserveData.dTokenInterestIndex;
    reserveData.averageATokenAPR = contractReserveData.averageATokenAPR;
    reserveData.realAssetAPR = contractReserveData.realAssetAPR;
    reserveData.digitalAssetAPR = contractReserveData.digitalAssetAPR;
    reserveData.supplyAPR = contractReserveData.supplyAPR;
    reserveData.moneyPoolLastUpdateTimestamp = contractReserveData.moneyPooLastUpdateTimestamp;
    reserveData.tokenizerLastUpdateTimestamp = contractReserveData.tokenizerLastUpdateTimestamp;
    reserveData.interestRateModelParams = defaultInterestModelParams;

    return reserveData;
}

