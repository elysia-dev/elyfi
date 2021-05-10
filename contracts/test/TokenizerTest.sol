// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "../Tokenizer.sol";

contract TokenizerTest is Tokenizer {
    constructor(address moneyPool, string memory uri) {
        initialize(moneyPool, uri);
    }

}