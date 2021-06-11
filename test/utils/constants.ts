import { ethers } from 'ethers';

export const RAY = ethers.utils.parseUnits('1', 27).toString();
export const WAD = ethers.utils.parseEther('1').toString();

export const SECONDSPERYEAR = '31536000';
export const SECONDSPERDAY = '86400';
