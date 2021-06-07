// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '../MoneyPool.sol';

contract MoneyPoolTest is MoneyPool {
  constructor(uint256 maxReserveCount_, address connector) MoneyPool(maxReserveCount_, connector) {}
}
