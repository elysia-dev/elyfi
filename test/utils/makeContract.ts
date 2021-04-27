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

export async function makeUnderlyingAsset({
    deployer,
    totalSupply = expandToDecimals(1000000, 18),
    name = "RandomToken",
    symbol = "RT"
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
    maxReserveCount_ = new BigNumber(16, "10")
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
    optimalDigitalAssetUtilizationRate = toRate(0.8),
    optimalRealAssetUtilizationRate = toRate(0.8),
    digitalAssetBorrowRateBase = toRate(0.02),
    digitalAssetBorrowRateOptimal = toRate(0.1),
    digitalAssetBorrowRateMax = toRate(0.4),
    realAssetBorrowRateBase = toRate(0.05),
    realAssetBorrowRateOptimal = toRate(0.2),
    realAssetBorrowRateMax = toRate(0.6),
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

export async function makeTokens({
    deployer,
    moneyPool,
    underlyingAsset,
    interestModel,
    lTokenName = "LToken",
    dTokenName = "DToken",
    lTokenSymbol = "LT",
    dTokenSymbol = "DT"
}: {
    deployer: Wallet
    moneyPool: MoneyPoolTest | Contract
    underlyingAsset: Contract
    interestModel: Contract
    lTokenName?: string
    dTokenName?: string
    lTokenSymbol?: string
    dTokenSymbol?: string
}): Promise<[LTokenTest, DTokenTest]> {

    let lTokenTest: LTokenTest;
    let dTokenTest: DTokenTest;

    const dTokenFactory = (await ethers.getContractFactory(
        "DTokenTest",
        deployer
    )) as DTokenTest__factory

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

    dTokenTest = await dTokenFactory.deploy(
        moneyPool.address,
        underlyingAsset.address,
        dTokenName,
        dTokenSymbol
    );

    await moneyPool.addNewReserve(
        underlyingAsset.address,
        lTokenTest.address,
        dTokenTest.address,
        interestModel.address
    )

    return [lTokenTest, dTokenTest];
}

