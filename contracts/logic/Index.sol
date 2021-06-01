// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '../libraries/DataStruct.sol';
import '../libraries/Errors.sol';
import '../libraries/Math.sol';
import 'hardhat/console.sol';

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
    returns (uint256)
  {
    uint256 lastUpdateTimestamp = reserve.lastUpdateTimestamp;

    if (lastUpdateTimestamp == block.timestamp) {
      return reserve.lTokenInterestIndex;
    }

    uint256 newIndex =
      Math.calculateLinearInterest(reserve.supplyAPR, lastUpdateTimestamp, block.timestamp).rayMul(
        reserve.lTokenInterestIndex
      );

    return newIndex;
  }

  function updateState(DataStruct.ReserveData storage reserve) internal {
    uint256 previousLTokenIndex = reserve.lTokenInterestIndex;
    uint256 lastUpdateTimestamp = reserve.lastUpdateTimestamp;

    updateIndexes(reserve, previousLTokenIndex, lastUpdateTimestamp);

    // _mintToReserveFactor
  }

  /**
   * @dev Updates the reserve indexes and the timestamp
   * @param reserve The reserve to be updated
   * @param lTokenIndex The last updated lToken Index
   * @param timeStamp The last updated timestamp
   **/
  function updateIndexes(
    DataStruct.ReserveData storage reserve,
    uint256 lTokenIndex,
    uint256 timeStamp
  ) internal returns (uint256) {
    uint256 currentSupplyAPR = reserve.supplyAPR;

    if (currentSupplyAPR == 0) {
      reserve.lastUpdateTimestamp = block.timestamp;
      return (lTokenIndex);
    }

    reserve.lTokenInterestIndex = getLTokenInterestIndex(reserve);

    reserve.lastUpdateTimestamp = block.timestamp;

    console.log(
      'hardhat updateIndex console: lToken index | timestamp',
      reserve.lTokenInterestIndex,
      reserve.lastUpdateTimestamp
    );

    return (reserve.lTokenInterestIndex);
  }
}
