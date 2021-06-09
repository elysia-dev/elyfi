// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '../Tokenizer.sol';

contract TokenizerTest is Tokenizer {
  constructor(
    address connector,
    address moneyPool,
    string memory name_,
    string memory symbol_
  ) Tokenizer(connector, moneyPool, name_, symbol_) {}
}
