import { Wallet } from '@ethersproject/wallet';
import { getReserveData, getUserData } from './Helpers';
import ElyfiContracts from '../types/ElyfiContracts';
import ReserveData from '../types/ReserveData';
import UserData from '../types/UserData';

const takeDataSnapshot: (
  account: Wallet,
  elyfiContracts: ElyfiContracts
) => Promise<[ReserveData, UserData]> = async (account, elyfiContracts) => {
  return [
    await getReserveData({
      underlyingAsset: elyfiContracts.underlyingAsset,
      dataPipeline: elyfiContracts.dataPipeline,
      lToken: elyfiContracts.lToken,
    }),
    await getUserData({
      underlyingAsset: elyfiContracts.underlyingAsset,
      dataPipeline: elyfiContracts.dataPipeline,
      user: account,
    }),
  ];
};

export default takeDataSnapshot;
