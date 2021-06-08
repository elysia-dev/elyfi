// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '../Connector.sol';

contract ConnectorTest is Connector {
  constructor(address moneyPool) Connector(moneyPool) {}
}
