// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "../libraries/DataStruct.sol";

interface IConnector {
    event NewLawfirmAdded(address indexed account);
    event NewCSPAdded(address indexed account);
    event UpdatePriceOracle(address indexed account);
    event UpdateAdmin(address indexed account);
}
