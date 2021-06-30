import { Contract, ethers } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import TestnetEL_ABI from '../../dependencies/TestnetEL.json';
import ELToken_ABI from '../../dependencies/ELToken.json';
import Dai_ABI from '../../dependencies/Dai.json';
import Elyfi_ABI from '../../dependencies/Elyfi.json';

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
      //   case 'mainnet':
      //     elyfi = await hre.ethers.getContractAt(Elyfi_ABI, '');
      //     return elyfi;
      case 'kovan':
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
