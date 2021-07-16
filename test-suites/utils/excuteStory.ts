import { Wallet } from '@ethersproject/wallet';
import {
  expectReserveDataAfterDeposit,
  expectUserDataAfterDeposit,
  expectReserveDataAfterWithdraw,
  expectUserDataAfterWithdraw,
  expectReserveDataAfterBorrow,
  expectUserDataAfterBorrow,
  expectReserveDataAfterRepay,
  expectUserDataAfterRepay,
} from '../../test/utils/Expect';
import { BigNumber, constants, utils } from 'ethers';
import { expect } from 'chai';
import ActionType from '../enums/ActionType';
import Story from '../types/Story';
import ElyfiContracts from '../../test/types/ElyfiContracts';
import takeDataSnapshot from '../../test/utils/takeDataSnapshot';
import { ContractTransaction } from '@ethersproject/contracts';
import ReserveData from '../../test/types/ReserveData';
import UserData from '../../test/types/UserData';
import { getTimestamp } from '../../test/utils/time';
import AssetBondSettleData from '../../test/types/AssetBondSettleData';
import hre from 'hardhat';
import UserType from '../enums/UserType';
import AbToken from '../types/AbToken';
import { deployAssetBondData } from '../../test/utils/Helpers';

require('../../test/assertions/equals');

const excutor = async (args: {
  account: Wallet;
  elyfiContracts: ElyfiContracts;
  doTransaction: () => Promise<ContractTransaction | undefined>;
  calculateReserveData: (reserveData: ReserveData, txTimestamp: BigNumber) => ReserveData;
  calculateUserData: (
    userData: UserData,
    reserveDateBefore: ReserveData,
    reserveDataAfter: ReserveData,
    txTimestamp: BigNumber
  ) => UserData;
  expected: boolean;
}) => {
  const {
    account,
    elyfiContracts,
    doTransaction,
    calculateReserveData,
    calculateUserData,
    expected,
  } = args;
  const [reserveDataBefore, userDataBefore] = await takeDataSnapshot(account, elyfiContracts);

  const tx = await doTransaction();

  if (!expected) return;

  const [reserveDataAfter, userDataAfter] = await takeDataSnapshot(account, elyfiContracts);

  const expectedReserveDataAfter = calculateReserveData(reserveDataBefore, await getTimestamp(tx));

  const expectedUserDataAfter = calculateUserData(
    userDataBefore,
    reserveDataBefore,
    reserveDataAfter,
    await getTimestamp(tx)
  );

  expect(reserveDataAfter).to.deepEqualWithBigNumber(expectedReserveDataAfter);
  expect(userDataAfter).to.deepEqualWithBigNumber(expectedUserDataAfter);
};

const excuteStory = async (
  story: Story,
  elyfiContracts: ElyfiContracts,
  abTokens: AssetBondSettleData[],
  rawAbTokenData: AbToken[]
) => {
  const wallets = hre.waffle.provider.getWallets();
  let amount = utils.parseEther((story.value || 0).toFixed());

  switch (story.actionType) {
    case ActionType.deposit:
      await excutor({
        expected: story.expected,
        account: wallets[UserType[story.actionMaker]],
        elyfiContracts,
        doTransaction: async () => {
          await elyfiContracts.underlyingAsset
            .connect(wallets[UserType[story.actionMaker]])
            .approve(elyfiContracts.moneyPool.address, constants.MaxUint256);

          try {
            const tx = await elyfiContracts.moneyPool
              .connect(wallets[UserType[story.actionMaker]])
              .deposit(
                elyfiContracts.underlyingAsset.address,
                wallets[UserType[story.actionMaker]].address,
                amount
              );

            expect(story.expected).to.be.true;

            return tx;
          } catch (e) {
            if (story.expected) {
              console.log(e);
            }
            expect(story.expected).to.be.false;
          }
        },
        calculateReserveData: (reserveDataBefore, txTimestamp) => {
          return expectReserveDataAfterDeposit({
            amount,
            reserveData: reserveDataBefore,
            txTimestamp,
          });
        },
        calculateUserData: (userDataBefore, _reserveDataBefore, reserveDataAfter, txTimestamp) => {
          return expectUserDataAfterDeposit({
            amountDeposit: amount,
            userDataBefore,
            reserveDataAfter,
            txTimestamp,
          });
        },
      });
      break;

    case ActionType.withdrawAll:
      amount = await elyfiContracts.lToken.balanceOf(wallets[UserType[story.actionMaker]].address);
    case ActionType.withdraw:
      await excutor({
        expected: story.expected,
        account: wallets[UserType[story.actionMaker]],
        elyfiContracts,
        doTransaction: async () => {
          try {
            const tx = await elyfiContracts.moneyPool
              .connect(wallets[UserType[story.actionMaker]])
              .withdraw(
                elyfiContracts.underlyingAsset.address,
                wallets[UserType[story.actionMaker]].address,
                story.actionType === ActionType.withdrawAll ? constants.MaxUint256 : amount
              );

            expect(story.expected).to.be.true;

            return tx;
          } catch (e) {
            if (story.expected) {
              console.log(e);
            }
            expect(story.expected).to.be.false;
          }
        },
        calculateReserveData: (reserveDataBefore, txTimestamp) => {
          return expectReserveDataAfterWithdraw({
            amount,
            reserveData: reserveDataBefore,
            txTimestamp,
          });
        },
        calculateUserData: (userDataBefore, _reserveDataBefore, reserveDataAfter, txTimestamp) => {
          return expectUserDataAfterWithdraw({
            amountWithdraw: amount,
            userDataBefore,
            reserveDataAfter,
            txTimestamp,
          });
        },
      });
      break;

    case ActionType.borrow:
      amount = abTokens[story.abToken!].principal;

      await excutor({
        expected: story.expected,
        account: wallets[UserType[rawAbTokenData[story.abToken!].borrower]],
        elyfiContracts,
        doTransaction: async () => {
          try {
            const tx = await elyfiContracts.moneyPool
              .connect(wallets[UserType[story.actionMaker]])
              .borrow(elyfiContracts.underlyingAsset.address, abTokens[story.abToken!].tokenId);

            expect(story.expected).to.be.true;

            return tx;
          } catch (e) {
            if (story.expected) {
              console.log(e);
            }
            expect(story.expected).to.be.false;
          }
        },
        calculateReserveData: (reserveDataBefore, txTimestamp) => {
          return expectReserveDataAfterBorrow({
            amountBorrow: amount,
            reserveDataBefore,
            txTimestamp,
          });
        },
        calculateUserData: (userDataBefore, reserveDataBefore, reserveDataAfter, txTimestamp) => {
          return expectUserDataAfterBorrow({
            amountBorrow: amount,
            userDataBefore,
            reserveDataBefore,
            reserveDataAfter,
            txTimestamp,
          });
        },
      });
      break;
    case ActionType.repay:
      const assetBondData = await deployAssetBondData({
        underlyingAsset: elyfiContracts.underlyingAsset,
        dataPipeline: elyfiContracts.dataPipeline,
        tokenizer: elyfiContracts.tokenizer,
        tokenId: abTokens[story.abToken!].tokenId,
      });

      await excutor({
        expected: story.expected,
        account: wallets[UserType[rawAbTokenData[story.abToken!].borrower]],
        elyfiContracts,
        doTransaction: async () => {
          try {
            const tx = await elyfiContracts.moneyPool
              .connect(wallets[UserType[story.actionMaker]])
              .repay(elyfiContracts.underlyingAsset.address, abTokens[story.abToken!].tokenId);

            expect(story.expected).to.be.true;

            return tx;
          } catch (e) {
            if (story.expected) {
              console.log(e);
            }
            expect(story.expected).to.be.false;
          }
        },
        calculateReserveData: (reserveData, txTimestamp) => {
          return expectReserveDataAfterRepay({
            assetBondData,
            reserveData,
            txTimestamp,
          });
        },
        calculateUserData: (userDataBefore, _reserveDataBefore, reserveDataAfter, txTimestamp) => {
          return expectUserDataAfterRepay({
            assetBondData,
            userDataBefore,
            reserveDataAfter,
            txTimestamp,
          });
        },
      });
      break;
    default:
  }
};

export default excuteStory;
