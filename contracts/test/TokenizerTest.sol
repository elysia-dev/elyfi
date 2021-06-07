// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '../Tokenizer.sol';

contract TokenizerTest is Tokenizer {
  constructor(
    address connector,
    string memory name_,
    string memory symbol_
  ) Tokenizer(connector, name_, symbol_) {}
}
