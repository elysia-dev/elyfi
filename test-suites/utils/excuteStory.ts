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
import ActionType from "../enums/actinoType";
import Story from "../types/story";
import ElyfiContracts from "../types/ElyfiContracts";
import takeDataSnapshot from "./takeDataSnapshot";
require('../../test/assertions/equals')

const excuteInvest = async (
  account: Wallet,
  amount: BigNumber,
  elyfiContracts: ElyfiContracts,
  expected: boolean,
) => {
  await elyfiContracts.underlyingAsset.connect(account).approve(elyfiContracts.moneyPool.address, ethers.utils.parseEther('1000'));

  const [reserveDataBefore, userDataBefore] = await takeDataSnapshot(account, elyfiContracts)

  let tx

  try {
    tx = await elyfiContracts.moneyPool
      .connect(account)
      .investMoneyPool(elyfiContracts.underlyingAsset.address, account.address, amount.toString());
  } catch (e) {
    expect(expected).to.be.false
  }

  expect(expected).to.be.true

  const [reserveDataAfter, userDataAfter] = await takeDataSnapshot(account, elyfiContracts);

  const expectedReserveDataAfter = expectedReserveDataAfterInvestMoneyPool({
    amountInvest: amount,
    reserveDataBefore,
    txTimestamp: await getTimestamp(tx),
  });
  const expectedUserDataAfter = expectedUserDataAfterInvestMoneyPool({
    amountInvest: amount,
    userDataBefore: userDataBefore,
    reserveDataBefore: reserveDataBefore,
    reserveDataAfter: reserveDataAfter,
    txTimestamp: await getTimestamp(tx),
  });

  expect(reserveDataAfter).to.be.equalReserveData(expectedReserveDataAfter);
  expect(userDataAfter).to.be.equalUserData(expectedUserDataAfter);
}

const excuteWithdraw = async (
  account: Wallet,
  amount: BigNumber,
  elyfiContracts: ElyfiContracts,
  expected: boolean,
) => {
  const [reserveDataBefore, userDataBefore] = await takeDataSnapshot(account, elyfiContracts)

  let tx

  try {
    tx = await elyfiContracts.moneyPool
      .connect(account)
      .withdrawMoneyPool(elyfiContracts.underlyingAsset.address, account.address, amount.toString());
  } catch (e) {
    expect(expected).to.be.false
  }

  expect(expected).to.be.true

  const [reserveDataAfter, userDataAfter] = await takeDataSnapshot(account, elyfiContracts);

  const expectedReserveDataAfter = expectedReserveDataAfterWithdrawMoneyPool({
    amountWithdraw: amount,
    reserveDataBefore: reserveDataBefore,
    txTimestamp: await getTimestamp(tx),
  });

  const expectedUserDataAfter = expectedUserDataAfterWithdrawMoneyPool({
    amountWithdraw: amount,
    userDataBefore,
    reserveDataBefore,
    reserveDataAfter,
    txTimestamp: await getTimestamp(tx),
  });

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
      await excuteInvest(
        account,
        amount,
        elyfiContracts,
        story.expected,
      )
      break;
    case ActionType.withdrawMoneyPool:
      await excuteWithdraw(
        account,
        amount,
        elyfiContracts,
        story.expected,
      )
      break
    case ActionType.borrowAgainstABToken:
      break
    case ActionType.repayAgainstABToken:
      break
    default:
  }
}

export default excuteStory