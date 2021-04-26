// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "../libraries/DataStruct.sol";
import "../libraries/Errors.sol";
import "../libraries/Math.sol";
import "../interfaces/IDToken.sol";

library Index {
    using WadRayMath for uint256;
    using Index for DataStruct.ReserveData;

    /**
     * @dev Returns the ongoing normalized income for the reserve
     * A value of 1e27 means there is no income. As time passes, the income is accrued
     * A value of 2*1e27 means for each unit of asset one unit of income has been accrued
     * @param reserve The reserve object
     * @return the normalized income. expressed in ray
     **/
    function getLTokenInterestIndex(DataStruct.ReserveData storage reserve)
        internal
        view
        returns (uint256) {
        uint40 lastUpdateTimestamp = reserve.lastUpdateTimestamp;

        if (lastUpdateTimestamp == uint40(block.timestamp)) {
            return reserve.lTokenInterestIndex;
        }

        uint256 newIndex =
            Math.calculateLinearInterest(
                reserve.supplyAPR,
                lastUpdateTimestamp,
                block.timestamp)
                .rayMul(reserve.lTokenInterestIndex);

        return newIndex;
    }

    function getDTokenInterestIndex(DataStruct.ReserveData storage reserve)
        internal
        view
        returns (uint256) {
        uint40 lastUpdateTimestamp = reserve.lastUpdateTimestamp;

        if (lastUpdateTimestamp == uint40(block.timestamp)) {
            return reserve.dTokenInterestIndex;
        }

        uint256 newIndex =
            Math.calculateCompoundedInterest(
                reserve.digitalAssetAPR,
                lastUpdateTimestamp,
                block.timestamp)
                .rayMul(reserve.dTokenInterestIndex);

        return newIndex;
    }

    function updateState(DataStruct.ReserveData storage reserve)
        internal {
        uint256 implicitDTokenTotalSupply = IDToken(reserve.dTokenAddress).implicitTotalSupply();
        uint256 previousLTokenIndex = reserve.lTokenInterestIndex;
        uint256 previousDTokenIndex = reserve.dTokenInterestIndex;
        uint40 lastUpdateTimestamp = reserve.lastUpdateTimestamp;

        updateIndexes(
            reserve,
            implicitDTokenTotalSupply,
            previousLTokenIndex,
            previousDTokenIndex,
            lastUpdateTimestamp
            );

        // _mintToReserveFactor
    }

    /**
    * @dev Updates the reserve indexes and the timestamp
   * @param reserve The reserve to be updated
   * @param implicitDTokenTotalSupply Implicit DToken total supply
   * @param lTokenIndex The last updated lToken Index
   * @param dTokenIndex The last updated dToken Index
   * @param timeStamp The last updated timestamp
   **/
    function updateIndexes(
        DataStruct.ReserveData storage reserve,
        uint256 implicitDTokenTotalSupply,
        uint256 lTokenIndex,
        uint256 dTokenIndex,
        uint40 timeStamp
    ) internal returns (uint256, uint256) {
        uint256 currentSupplyAPR = reserve.supplyAPR;

        if (currentSupplyAPR == 0) {
            reserve.lastUpdateTimestamp = uint40(block.timestamp);
            return (lTokenIndex, dTokenIndex);
        }

        reserve.lTokenInterestIndex = getLTokenInterestIndex(reserve);
        reserve.dTokenInterestIndex = getDTokenInterestIndex(reserve);

        reserve.lastUpdateTimestamp = uint40(block.timestamp);

        return (getLTokenInterestIndex(reserve), getDTokenInterestIndex(reserve));
    }
}