// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '../libraries/DataStruct.sol';

interface IMoneyPool {
  event NewReserve(
    address indexed asset,
    address lToken,
    address dToken,
    address interestModel,
    address tokenizer,
    uint256 moneyPoolFactor
  );

  event Invest(address indexed asset, address indexed account, uint256 amount);

  event Withdraw(
    address indexed asset,
    address indexed account,
    address indexed to,
    uint256 amount
  );

  event Borrow(
    address indexed asset,
    address indexed borrower,
    address indexed receiver,
    uint256 tokenId,
    uint256 borrowAPR,
    uint256 borrowAmount
  );

  event Repay(
    address indexed asset,
    address indexed borrower,
    uint256 tokenId,
    uint256 userDTokenBalance,
    uint256 feeOnCollateralServiceProvider
  );

  function invest(
    address asset,
    address account,
    uint256 amount
  ) external;

  function withdraw(
    address asset,
    address account,
    uint256 amount
  ) external;

  function borrow(
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
