import { Contract, ethers } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

export const deployValidation = async (hre: HardhatRuntimeEnvironment): Promise<Contract> => {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;
  let validation: Contract;

  const validationLocalDeploy = await deploy('Validation', {
    from: deployer,
    log: true,
  });

  validation = await hre.ethers.getContractAt(
    validationLocalDeploy.abi,
    validationLocalDeploy.address
  );

  return validation;
};

export const deployTimeConverter = async (hre: HardhatRuntimeEnvironment): Promise<Contract> => {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;
  let timeConverter: Contract;

  const timeConverterLocalDeploy = await deploy('TimeConverter', {
    from: deployer,
    log: true,
  });

  timeConverter = await hre.ethers.getContractAt(
    timeConverterLocalDeploy.abi,
    timeConverterLocalDeploy.address
  );

  return timeConverter;
};

export const deployAssetBond = async (
  hre: HardhatRuntimeEnvironment,
  timeConverter: Contract
): Promise<Contract> => {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;
  let assetBond: Contract;

  const assetBondLocalDeploy = await deploy('AssetBond', {
    from: deployer,
    log: true,
    libraries: {
      TimeConverter: timeConverter.address,
    },
  });

  assetBond = await hre.ethers.getContractAt(
    assetBondLocalDeploy.abi,
    assetBondLocalDeploy.address
  );

  return assetBond;
};

export const deployIndex = async (hre: HardhatRuntimeEnvironment): Promise<Contract> => {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;
  let index: Contract;

  const indexLocalDeploy = await deploy('Index', {
    from: deployer,
    log: true,
  });

  index = await hre.ethers.getContractAt(indexLocalDeploy.abi, indexLocalDeploy.address);

  return index;
};

export const deployRate = async (hre: HardhatRuntimeEnvironment): Promise<Contract> => {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;
  let rate: Contract;

  const rateLocalDeploy = await deploy('Rate', {
    from: deployer,
    log: true,
  });

  rate = await hre.ethers.getContractAt(rateLocalDeploy.abi, rateLocalDeploy.address);

  return rate;
};
