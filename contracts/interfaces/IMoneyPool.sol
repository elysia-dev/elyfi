// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '../libraries/DataStruct.sol';

interface IMoneyPool {
  event InvestMoneyPool(address indexed asset, address indexed account, uint256 amount);

  event WithdrawMoneyPool(
    address indexed asset,
    address indexed account,
    address indexed to,
    uint256 amount
  );

  event BorrowAgainstAssetBond(
    address indexed asset,
    address indexed borrower,
    address indexed receiver,
    uint256 tokenId,
    uint256 borrowAPR,
    uint256 borrowAmount
  );

  event RepayAgainstAssetBond();

  function investMoneyPool(
    address asset,
    address account,
    uint256 amount
  ) external;

  function withdrawMoneyPool(
    address asset,
    address account,
    uint256 amount
  ) external returns (uint256);

  function borrowAgainstABToken(
    address asset,
    address receiver,
    uint256 borrowAmount,
    uint256 tokenID
  ) external;

  function getLTokenInterestIndex(address asset) external view returns (uint256);

  function getReserveData(address asset) external view returns (DataStruct.ReserveData memory);

  function addNewReserve(
    address asset,
    address lToken,
    address dToken,
    address interestModel,
    address tokenizer,
    uint256 moneyPoolFactor_
  ) external;
}
