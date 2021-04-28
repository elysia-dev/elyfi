import {
    LTokenTest,
    LTokenTest__factory,
    DTokenTest,
    DTokenTest__factory,
    MoneyPoolTest,
    MoneyPoolTest__factory,
    ERC20Test,
    ERC20Test__factory,
    InterestRateModel,
    InterestRateModel__factory
} from "../../typechain"
import { BigNumber, Contract, Wallet } from "ethers"
import { ethers } from "hardhat";
import { expandToDecimals, toRate } from "./Ethereum";
import { defaultInterestModelParams, defaultReserveData } from "./Interfaces";


export async function makeUnderlyingAsset({
    deployer,
    totalSupply = expandToDecimals(1000000, 18),
    name = defaultReserveData.underlyingAssetName,
    symbol = defaultReserveData.underlyingAssetsymbol
}: {
    deployer: Wallet
    totalSupply?: BigNumber
    name?: string
    symbol?: string
}): Promise<ERC20Test> {
    let underlyingAsset: ERC20Test;

    const underlyingAssetFactory = (await ethers.getContractFactory(
        "ERC20Test",
        deployer
    )) as ERC20Test__factory

    underlyingAsset = await underlyingAssetFactory.deploy(
        totalSupply,
        name,
        symbol
    )

    return underlyingAsset;
}

export async function makeMoneyPool({
    deployer,
    maxReserveCount_ = BigNumber.from(16)
}: {
    deployer: Wallet
    maxReserveCount_?: BigNumber
}): Promise<MoneyPoolTest> {
    let moneyPoolTest: MoneyPoolTest;

    const moneyPoolFactory = (await ethers.getContractFactory(
        "MoneyPoolTest",
        deployer
    )) as MoneyPoolTest__factory

    moneyPoolTest = await moneyPoolFactory.deploy(
        maxReserveCount_
    );

    return moneyPoolTest;
}

export async function makeInterestModel({
    deployer,
    optimalDigitalAssetUtilizationRate = defaultInterestModelParams.optimalDigitalAssetUtilizationRate,
    optimalRealAssetUtilizationRate = defaultInterestModelParams.optimalRealAssetUtilizationRate,
    digitalAssetBorrowRateBase = defaultInterestModelParams.digitalAssetBorrowRateBase,
    digitalAssetBorrowRateOptimal = defaultInterestModelParams.digitalAssetBorrowRateOptimal,
    digitalAssetBorrowRateMax = defaultInterestModelParams.digitalAssetBorrowRateMax,
    realAssetBorrowRateBase = defaultInterestModelParams.realAssetBorrowRateBase,
    realAssetBorrowRateOptimal = defaultInterestModelParams.realAssetBorrowRateOptimal,
    realAssetBorrowRateMax = defaultInterestModelParams.realAssetBorrowRateMax,
}: {
    deployer: Wallet
    optimalDigitalAssetUtilizationRate?: BigNumber
    optimalRealAssetUtilizationRate?: BigNumber
    digitalAssetBorrowRateBase?: BigNumber
    digitalAssetBorrowRateOptimal?: BigNumber
    digitalAssetBorrowRateMax?: BigNumber
    realAssetBorrowRateBase?: BigNumber
    realAssetBorrowRateOptimal?: BigNumber
    realAssetBorrowRateMax?: BigNumber
}): Promise<InterestRateModel> {

    let interestRateModel: InterestRateModel;

    const interestRateModelFactory = (await ethers.getContractFactory(
        "InterestRateModel",
        deployer
    )) as InterestRateModel__factory;

    interestRateModel = await interestRateModelFactory.deploy(
        optimalDigitalAssetUtilizationRate,
        optimalRealAssetUtilizationRate,
        digitalAssetBorrowRateBase,
        digitalAssetBorrowRateOptimal,
        digitalAssetBorrowRateMax,
        realAssetBorrowRateBase,
        realAssetBorrowRateOptimal,
        realAssetBorrowRateMax
    );

    return interestRateModel;
}

export async function makeLToken({
    deployer,
    moneyPool,
    underlyingAsset,
    lTokenName = "LToken",
    lTokenSymbol = "LT"
}: {
    deployer: Wallet
    moneyPool: MoneyPoolTest | Contract
    underlyingAsset: Contract
    lTokenName?: string
    lTokenSymbol?: string
}): Promise<LTokenTest> {

    let lTokenTest: LTokenTest;

    const lTokenFactory = (await ethers.getContractFactory(
        "LTokenTest",
        deployer
    )) as LTokenTest__factory

    lTokenTest = await lTokenFactory.deploy(
        moneyPool.address,
        underlyingAsset.address,
        lTokenName,
        lTokenSymbol
    );

    return lTokenTest;
}

export async function makeDToken({
    deployer,
    moneyPool,
    underlyingAsset,
    dTokenName = "DToken",
    dTokenSymbol = "DT"
}: {
    deployer: Wallet
    moneyPool: MoneyPoolTest | Contract
    underlyingAsset: Contract
    dTokenName?: string
    dTokenSymbol?: string
}): Promise<DTokenTest> {

    let dTokenTest: DTokenTest;

    const dTokenFactory = (await ethers.getContractFactory(
        "DTokenTest",
        deployer
    )) as DTokenTest__factory

    dTokenTest = await dTokenFactory.deploy(
        moneyPool.address,
        underlyingAsset.address,
        dTokenName,
        dTokenSymbol
    );

    return dTokenTest;
}
