// SPDX-License-Identifier: MIT
pragma solidity 0.8.3;

import '../LToken.sol';

contract LTokenTest is LToken {
  constructor(
    IMoneyPool moneyPool,
    address underlyingAsset,
    IIncentivePool incentivePool,
    string memory name,
    string memory symbol
  ) LToken(moneyPool, underlyingAsset, incentivePool, name, symbol) {}
}
