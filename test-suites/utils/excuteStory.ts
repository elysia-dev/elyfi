import { Wallet } from "@ethersproject/wallet";
import {
  expectReserveDataAfterDeposit,
  expectUserDataAfterDeposit,
  expectReserveDataAfterWithdraw,
  expectUserDataAfterWithdraw,
} from "../../test/utils/Expect";
import { getTimestamp } from "../../test/utils/Ethereum";
import { BigNumber, utils } from 'ethers';
import { expect } from "chai";
import ActionType from "../enums/ActionType";
import Story from "../types/Story";
import ElyfiContracts from "../../test/types/ElyfiContracts";
import takeDataSnapshot from "../../test/utils/takeDataSnapshot";
import { ContractTransaction } from "@ethersproject/contracts";
import { ReserveData, UserData } from "../../test/utils/Interfaces";
require('../../test/assertions/equals')

const excuteDepositor = async (
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

  expect(reserveDataAfter).to.equalReserveData(expectedReserveDataAfter);
  expect(userDataAfter).to.equalUserData(expectedUserDataAfter)
}

const excuteStory = async (
  story: Story,
  account: Wallet,
  elyfiContracts: ElyfiContracts,
) => {
  const amount = utils.parseEther(story.value.toFixed());

  switch (story.actionType) {
    case ActionType.deposit:
      await excuteDepositor(
        account,
        amount,
        elyfiContracts,
        async () => {
          await elyfiContracts.underlyingAsset.connect(account).approve(elyfiContracts.moneyPool.address, utils.parseEther('1000'));

          try {
            const tx = await elyfiContracts.moneyPool
              .connect(account)
              .deposit(elyfiContracts.underlyingAsset.address, account.address, amount.toString());

            expect(story.expected).to.be.true

            return tx
          } catch (e) {
            console.log(e)
            expect(story.expected).to.be.false
          }
        },
        (amountDeposit, reserveDataBefore, txTimestamp) => {
          return expectReserveDataAfterDeposit({
            amount: amountDeposit,
            reserveData: reserveDataBefore,
            txTimestamp,
          });
        },
        (amountDeposit, userDataBefore, reserveDataBefore, reserveDataAfter, txTimestamp) => {
          return expectUserDataAfterDeposit({
            amountDeposit,
            userDataBefore,
            reserveDataAfter,
            txTimestamp,
          });
        },
      )
      break;

    case ActionType.withdraw:
      await excuteDepositor(
        account,
        amount,
        elyfiContracts,
        async () => {
          try {
            const tx = await elyfiContracts.moneyPool
              .connect(account)
              .withdraw(elyfiContracts.underlyingAsset.address, account.address, amount.toString());

            expect(story.expected).to.be.true

            return tx
          } catch (e) {
            console.log(e)
            expect(story.expected).to.be.false
          }
        },
        (amountWithdraw, reserveDataBefore, txTimestamp) => {
          return expectReserveDataAfterWithdraw({
            amount: amountWithdraw,
            reserveData: reserveDataBefore,
            txTimestamp,
          });
        },
        (amountWithdraw, userDataBefore, reserveDataBefore, reserveDataAfter, txTimestamp) => {
          return expectUserDataAfterWithdraw({
            amountWithdraw,
            userDataBefore,
            reserveDataAfter,
            txTimestamp,
          });
        },
      )
      break;

    case ActionType.borrow:
      break
    case ActionType.repay:
      break
    default:
  }
}

export default excuteStory
