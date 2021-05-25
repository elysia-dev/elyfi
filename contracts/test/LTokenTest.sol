// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '../LToken.sol';

contract LTokenTest is LToken {
  constructor(
    IMoneyPool moneyPool,
    address underlyingAsset_,
    string memory name_,
    string memory symbol_
  ) {
    initialize(moneyPool, underlyingAsset_, name_, symbol_);
  }
}
