// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "../logic/Index.sol";
import "../MoneyPoolStorage.sol";

contract IndexMock is MoneyPoolStorage {
    using Index for DataStruct.ReserveData;

    function getLTokenInterestIndex(address asset) public view returns (uint256) {
        return _reserves[asset].getLTokenInterestIndex();
    }

    function getDTokenInterestIndex(address asset) public view returns (uint256) {
        return _reserves[asset].getDTokenInterestIndex();
    }

    function updateState(address asset) public {
        return _reserves[asset].updateState();
    }
}