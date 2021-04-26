// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "./WadRaymath.sol";

library Math {
    using WadRayMath for uint256;

    uint256 internal constant SECONDSPERYEAR = 365 days;

    function calculateLinearInterest(uint256 rate, uint40 lastUpdateTimestamp)
        internal
        view
        returns (uint256) {
            uint256 timeDelta = block.timestamp - uint256(lastUpdateTimestamp);

            return (rate * timeDelta / SECONDSPERYEAR) + WadRayMath.ray();
        }
}