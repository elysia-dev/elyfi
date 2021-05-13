// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "../logic/Index.sol";
import "../MoneyPoolStorage.sol";

contract IndexTest is MoneyPoolStorage {
    using Index for DataStruct.ReserveData;

    function getLTokenInterestIndex(address asset)
        public
        view
        returns (uint256)
    {
        return _reserves[asset].getLTokenInterestIndex();
    }

    function getDTokenInterestIndex(address asset)
        public
        view
        returns (uint256)
    {
        return _reserves[asset].getDTokenInterestIndex();
    }

    function updateState(address asset) public
    {
        return _reserves[asset].updateState();
    }

    /**
     * @dev Returns the state and configuration of the reserve
     * @param asset The address of the underlying asset of the reserve
     * @return The state of the reserve
     **/
    function getReserveData(address asset)
        public
        view
        returns (DataStruct.ReserveData memory)
    {
        return _reserves[asset];
    }
}
