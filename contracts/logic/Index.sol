// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "../libraries/DataStruct.sol";
import "../libraries/Errors.sol";
import "../libraries/Math.sol";

library Index {
    using WadRayMath for uint256;
    using Index for DataStruct.ReserveData;

    function updateState(DataStruct.ReserveData storage reserve)
        internal {
        updateIndexes();
    }

    function updateIndexes() internal {}

    function getLTokenInterestIndex(DataStruct.ReserveData storage reserve)
        internal
        view
        returns (uint256) {
        uint40 lastUpdateTimestamp = reserve.lastUpdateTimestamp;

        if (lastUpdateTimestamp == uint40(block.timestamp)) {
            return reserve.lTokenInterestIndex;
        }

        uint256 result =
            Math.calculateLinearInterest(
                reserve.supplyAPR,
                lastUpdateTimestamp)
                .rayMul(reserve.lTokenInterestIndex);

        return result;
    }
}