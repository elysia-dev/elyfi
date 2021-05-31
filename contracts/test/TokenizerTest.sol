// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '../Tokenizer.sol';

contract TokenizerTest is Tokenizer {
  constructor(
    address moneyPool,
    string memory name_,
    string memory symbol_
  ) {
    initialize(moneyPool, name_, symbol_);
  }
}
