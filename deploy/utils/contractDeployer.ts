import { Contract, ethers } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import TestnetEL_ABI from '../../dependencies/TestnetEL.json';
import ELToken_ABI from '../../dependencies/ELToken.json';
import Dai_ABI from '../../dependencies/Dai.json';
import Elyfi_ABI from '../../dependencies/Elyfi.json';

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

export const getIndex = async (hre: HardhatRuntimeEnvironment): Promise<Contract> => {
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

export const getRate = async (hre: HardhatRuntimeEnvironment): Promise<Contract> => {
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

export const getElysia = async (
  hre: HardhatRuntimeEnvironment,
  signer: string
): Promise<Contract> => {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;
  let elysia: Contract;
  if (hre.network.name) {
    switch (hre.network.name) {
      case 'mainnet':
        elysia = await hre.ethers.getContractAt(
          ELToken_ABI,
          '0x2781246fe707bB15CeE3e5ea354e2154a2877B16'
        );
        return elysia;
      case 'binanceTestnet':
        elysia = await hre.ethers.getContractAt(
          TestnetEL_ABI,
          '0xecd32309edFdBA6d51236A4517e9c2589c84C843'
        );
        return elysia;
    }
  }

  const elysiaLocalDeploy = await deploy('ERC20Test', {
    from: deployer,
    args: [ethers.utils.parseUnits('1', 30), 'Testnet Elysia', 'TestEL'],
  });

  elysia = await hre.ethers.getContractAt(elysiaLocalDeploy.abi, elysiaLocalDeploy.address);

  console.log(`ELYSIA, Asset address ${elysia.address}`);

  return elysia;
};

export const getDai = async (hre: HardhatRuntimeEnvironment, signer: string): Promise<Contract> => {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;
  let dai: Contract;
  if (hre.network.name) {
    switch (hre.network.name) {
      case 'mainnet':
        dai = await hre.ethers.getContractAt(Dai_ABI, '0x6B175474E89094C44Da98b954EedeAC495271d0F');
        return dai;
    }
  }

  const daiLocalDeploy = await deploy('ERC20Test', {
    from: deployer,
    args: [ethers.utils.parseUnits('1', 30), 'Testnet Stablecoin', 'TestStable'],
    log: true,
  });

  dai = await hre.ethers.getContractAt(daiLocalDeploy.abi, daiLocalDeploy.address);

  console.log(`DAI, Asset address ${dai.address}`);

  return dai;
};

export const getElyfi = async (
  hre: HardhatRuntimeEnvironment,
  signer: string
): Promise<Contract> => {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;
  let elyfi: Contract;
  if (hre.network.name) {
    switch (hre.network.name) {
      case 'mainnet':
        elyfi = await hre.ethers.getContractAt(
          Elyfi_ABI,
          '0x4dA34f8264CB33A5c9F17081B9EF5Ff6091116f4'
        );
        return elyfi;
      case 'kovan':
        elyfi = await hre.ethers.getContractAt(
          Elyfi_ABI,
          '0x9EAF333044ea90c849b127e60BB297AdE115D12c'
        );
        return elyfi;
      case 'ropsten':
        elyfi = await hre.ethers.getContractAt(
          Elyfi_ABI,
          '0x9EAF333044ea90c849b127e60BB297AdE115D12c'
        );
        return elyfi;
    }
  }

  const elyfiLocalDeploy = await deploy('ERC20Test', {
    from: deployer,
    args: [ethers.utils.parseUnits('1', 30), 'ELYFI', 'ELFI'],
    log: true,
  });

  elyfi = await hre.ethers.getContractAt(elyfiLocalDeploy.abi, elyfiLocalDeploy.address);

  console.log(`Elyfi, Asset address ${elyfi.address}`);

  return elyfi;
};
