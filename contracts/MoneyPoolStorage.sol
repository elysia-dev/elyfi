// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "./libraries/DataStruct.sol";
import "./logic/Index.sol";

contract MoneyPoolStorage {
    using Index for DataStruct.ReserveData;

    mapping(address => DataStruct.ReserveData) internal _reserves;
}