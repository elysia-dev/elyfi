// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '../DToken.sol';

contract DTokenTest is DToken {
  constructor(
    IMoneyPool moneyPool,
    address underlyingAsset_,
    string memory name_,
    string memory symbol_
  ) DToken(moneyPool, underlyingAsset_, name_, symbol_) {}
}
