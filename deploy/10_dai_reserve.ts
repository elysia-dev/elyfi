import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import {
  testIncentiveAmountPerSecond,
  testInterestModelParams,
  testReserveData,
} from '../test/utils/testData';
import { ethers } from 'hardhat';
import { getDai, getElyfi } from '../utils/getDependencies';

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

  const moneyPool = await get('MoneyPool');
  const connector = await get('Connector');
  const assetBond = await get('AssetBond');
  const validation = await get('Validation');
  const timeConverter = await get('TimeConverter');

  const deployedMoneyPool = await hre.ethers.getContractAt(moneyPool.abi, moneyPool.address);

  const incentivePool = await deploy('IncentivePool', {
    from: deployer,
    args: [moneyPool.address, incentiveAsset.address, testIncentiveAmountPerSecond],
    log: true,
  });

  const interestRateModel = await deploy('InterestRateModel', {
    from: deployer,
    args: [
      testInterestModelParams.optimalUtilizationRate,
      testInterestModelParams.borrowRateBase,
      testInterestModelParams.borrowRateOptimal,
      testInterestModelParams.borrowRateMax,
    ],
    log: true,
  });

  const lToken = await deploy('LToken', {
    from: deployer,
    args: [moneyPool.address, underlyingAsset?.address, incentivePool.address, 'testLToken', 'L'],
    log: true,
  });

  const dToken = await deploy('DToken', {
    from: deployer,
    args: [moneyPool.address, underlyingAsset?.address, 'testDToken', 'D'],
    log: true,
  });

  const tokenizer = await deploy('Tokenizer', {
    from: deployer,
    args: [connector.address, moneyPool.address, 'testTokenizer', 'T'],
    log: true,
    libraries: {
      AssetBond: assetBond.address,
      Validation: validation.address,
      TimeConverter: timeConverter.address,
    },
  });

  const addNewReserveTx = await deployedMoneyPool.addNewReserve(
    underlyingAsset?.address,
    lToken.address,
    dToken.address,
    interestRateModel.address,
    tokenizer.address,
    incentivePool.address,
    testReserveData.moneyPoolFactor
  );
  console.log('addNewReserve done');

  if (hre.network.name != 'ganache' && hre.network.name != 'hardhat') {
    await hre.run('etherscan-verify', {
      network: hre.network.name,
    });
  }
};

deploy.tags = ['dai_reserve'];
deploy.dependencies = ['core'];

export default deploy;
