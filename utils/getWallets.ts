import { ethers, Wallet } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const provider = async (network: string) => {
  return new ethers.providers.InfuraProvider(network, process.env.INFURA_API_KEY);
};

export const getPoolAdmin = async (hre: HardhatRuntimeEnvironment): Promise<ethers.Wallet> => {
  const privateKey = process.env.ADMIN as string;
  const poolAdmin = new Wallet(privateKey, await provider(hre.network.name));
  return poolAdmin;
};

export const getCSP = async (hre: HardhatRuntimeEnvironment): Promise<ethers.Wallet> => {
  const privateKey = process.env.CSP as string;
  const csp = new Wallet(privateKey, await provider(hre.network.name));
  return csp;
};

export const getCouncil = async (hre: HardhatRuntimeEnvironment): Promise<ethers.Wallet> => {
  const privateKey = process.env.COUNCIL as string;
  const council = new Wallet(privateKey, await provider(hre.network.name));
  return council;
};

export const getBorrower = async (hre: HardhatRuntimeEnvironment): Promise<ethers.Wallet> => {
  const privateKey = process.env.BORROWER as string;
  const borrower = new Wallet(privateKey, await provider(hre.network.name));
  return borrower;
};
