import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';
import { getDai, getElyfi } from '../utils/getDependencies';
import { usdcReserveData } from '../data/moneyPool/reserves';

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, get } = hre.deployments;

  let underlyingAsset = await getDai(hre);
  let incentiveAsset = await getElyfi(hre);

  if (hre.network.name == 'ganache' || hre.network.name == 'hardhat') {
    const tokenDeployment = await deploy('ERC20Test', {
      from: deployer,
      args: [ethers.utils.parseUnits('1', 36), 'name', 'symbol'],
      log: true,
    });
    const token = await hre.ethers.getContractAt(tokenDeployment.abi, tokenDeployment.address);
    underlyingAsset = incentiveAsset = token;
  }

  const reserveData = usdcReserveData;

  const moneyPool = await get('MoneyPool');
  const connector = await get('Connector');
  const assetBond = await get('AssetBond');
  const validation = await get('Validation');
  const timeConverter = await get('TimeConverter');

  const deployedMoneyPool = await hre.ethers.getContractAt(moneyPool.abi, moneyPool.address);

  const incentivePool = await deploy(reserveData.incentivePool.name, {
    from: deployer,
    args: [
      moneyPool.address,
      incentiveAsset.address,
      reserveData.incentivePool.incentiveAmountPerSecond,
    ],
    log: true,
    contract: 'IncentivePool',
  });

  const interestRateModel = await deploy(reserveData.interestRateModel.name, {
    from: deployer,
    args: [
      reserveData.interestRateModel.params.optimalUtilizationRate,
      reserveData.interestRateModel.params.borrowRateBase,
      reserveData.interestRateModel.params.borrowRateOptimal,
      reserveData.interestRateModel.params.borrowRateMax,
    ],
    log: true,
    contract: 'InterestRateModel',
  });

  const lToken = await deploy(reserveData.lToken.name, {
    from: deployer,
    args: [
      moneyPool.address,
      underlyingAsset?.address,
      incentivePool.address,
      reserveData.lToken.name,
      reserveData.lToken.symbol,
    ],
    log: true,
    contract: 'LToken',
  });

  const dToken = await deploy(reserveData.dToken.name, {
    from: deployer,
    args: [
      moneyPool.address,
      underlyingAsset?.address,
      reserveData.dToken.name,
      reserveData.dToken.symbol,
    ],
    log: true,
    contract: 'DToken',
  });

  const tokenizer = await deploy(reserveData.tokenizer.name, {
    from: deployer,
    args: [
      connector.address,
      moneyPool.address,
      reserveData.tokenizer.name,
      reserveData.tokenizer.symbol,
    ],
    log: true,
    libraries: {
      AssetBond: assetBond.address,
      Validation: validation.address,
      TimeConverter: timeConverter.address,
    },
    contract: 'Tokenizer',
  });

  const addNewReserveTx = await deployedMoneyPool.addNewReserve(
    underlyingAsset?.address,
    lToken.address,
    dToken.address,
    interestRateModel.address,
    tokenizer.address,
    incentivePool.address,
    reserveData.moneyPoolFactor
  );
  console.log('addNewReserve done');

  if (hre.network.name != 'ganache' && hre.network.name != 'hardhat') {
    await hre.run('etherscan-verify', {
      network: hre.network.name,
    });
  }
};

deploy.tags = ['usdc_reserve'];
deploy.dependencies = ['core'];

export default deploy;
