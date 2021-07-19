import { Wallet } from 'ethers';
import { ethers } from 'hardhat';

export const getPoolAdmin = (): Wallet => {
  const privateKey = process.env.ADMIN;
  const poolAdmin = new Wallet(privateKey);
  return poolAdmin;
};

export const getCSP = (): Wallet => {
  const privateKey = process.env.CSP;
  const poolAdmin = new Wallet(privateKey);
  return poolAdmin;
};

export const getCouncil = (): Wallet => {
  const privateKey = process.env.COUNCIL;
  const poolAdmin = new ethers.Wallet(privateKey);
  return poolAdmin;
};
