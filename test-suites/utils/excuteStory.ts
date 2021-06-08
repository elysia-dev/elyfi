import { Wallet } from "@ethersproject/wallet";
import {
  expectedReserveDataAfterInvestMoneyPool,
  expectedUserDataAfterInvestMoneyPool,
  expectedReserveDataAfterWithdrawMoneyPool,
  expectedUserDataAfterWithdrawMoneyPool,
} from "../../test/utils/Expect";
import { getTimestamp } from "../../test/utils/Ethereum";
import { ethers } from 'hardhat';
import BigNumber from "bignumber.js";
import { expect } from "chai";
import ActionType from "../enums/actionType";
import Story from "../types/story";
import ElyfiContracts from "../types/ElyfiContracts";
import takeDataSnapshot from "./takeDataSnapshot";
import { ContractTransaction } from "@ethersproject/contracts";
import { ReserveData, UserData } from "../../test/utils/Interfaces";
require('../../test/assertions/equals')

const excuteInvestor = async (
  account: Wallet,
  amount: BigNumber,
  elyfiContracts: ElyfiContracts,
  doTransaction: () => Promise<ContractTransaction | undefined>,
  calculateReserveData: (amount: BigNumber, reserveData: ReserveData, txTimestamp: BigNumber) => ReserveData,
  calculateUserData: (amount: BigNumber, userData: UserData, reserveDateBefore: ReserveData, reserveDataAfter: ReserveData, txTimestamp: BigNumber) => UserData
) => {
  const [reserveDataBefore, userDataBefore] = await takeDataSnapshot(account, elyfiContracts)

  const tx = await doTransaction();

  const [reserveDataAfter, userDataAfter] = await takeDataSnapshot(account, elyfiContracts);

  const expectedReserveDataAfter = calculateReserveData(
    amount,
    reserveDataBefore,
    await getTimestamp(tx),
  );

  const expectedUserDataAfter = calculateUserData(
    amount,
    userDataBefore,
    reserveDataBefore,
    reserveDataAfter,
    await getTimestamp(tx),
  );

  expect(reserveDataAfter).to.be.equalReserveData(expectedReserveDataAfter);
  expect(userDataAfter).to.be.equalUserData(expectedUserDataAfter);
}

const excuteStory = async (
  story: Story,
  account: Wallet,
  elyfiContracts: ElyfiContracts,
) => {
  const amount = new BigNumber(ethers.utils.parseEther(story.value.toFixed()).toString())

  switch (story.actionType) {
    case ActionType.investMoneyPool:
      await excuteInvestor(
        account,
        amount,
        elyfiContracts,
        async () => {
          await elyfiContracts.underlyingAsset.connect(account).approve(elyfiContracts.moneyPool.address, ethers.utils.parseEther('1000'));

          try {
            const tx = await elyfiContracts.moneyPool
              .connect(account)
              .investMoneyPool(elyfiContracts.underlyingAsset.address, account.address, amount.toString());

            expect(story.expected).to.be.true

            return tx
          } catch (e) {
            console.log(e)
            expect(story.expected).to.be.false
          }
        },
        (amountInvest, reserveDataBefore, txTimestamp) => {
          return expectedReserveDataAfterInvestMoneyPool({
            amountInvest,
            reserveDataBefore,
            txTimestamp,
          });
        },
        (amountInvest, userDataBefore, reserveDataBefore, reserveDataAfter, txTimestamp) => {
          return expectedUserDataAfterInvestMoneyPool({
            amountInvest,
            userDataBefore,
            reserveDataBefore,
            reserveDataAfter,
            txTimestamp,
          });
        },
      )
      break;

    case ActionType.withdrawMoneyPool:
      await excuteInvestor(
        account,
        amount,
        elyfiContracts,
        async () => {
          try {
            const tx = await elyfiContracts.moneyPool
              .connect(account)
              .withdrawMoneyPool(elyfiContracts.underlyingAsset.address, account.address, amount.toString());

            expect(story.expected).to.be.true

            return tx
          } catch (e) {
            console.log(e)
            expect(story.expected).to.be.false
          }
        },
        (amountWithdraw, reserveDataBefore, txTimestamp) => {
          return expectedReserveDataAfterWithdrawMoneyPool({
            amountWithdraw,
            reserveDataBefore,
            txTimestamp,
          });
        },
        (amountWithdraw, userDataBefore, reserveDataBefore, reserveDataAfter, txTimestamp) => {
          return expectedUserDataAfterWithdrawMoneyPool({
            amountWithdraw,
            userDataBefore,
            reserveDataBefore,
            reserveDataAfter,
            txTimestamp,
          });
        },
      )
      break;

    case ActionType.borrowAgainstABToken:
      break
    case ActionType.repayAgainstABToken:
      break
    default:
  }
}

export default excuteStory
