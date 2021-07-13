// SPDX-License-Identifier: MIT
pragma solidity 0.8.3;

import '../logic/Index.sol';
import '../MoneyPoolStorage.sol';

contract IndexTest is MoneyPoolStorage {
  using Index for DataStruct.ReserveData;

  function getLTokenInterestIndex(address asset) public view returns (uint256) {
    return _reserves[asset].getLTokenInterestIndex();
  }

  function updateState(address asset) public {
    _reserves[asset].updateState(asset);
  }

  /**
   * @dev Returns the state and configuration of the reserve
   * @param asset The address of the underlying asset of the reserve
   * @return The state of the reserve
   **/
  function getReserveData(address asset) public view returns (DataStruct.ReserveData memory) {
    return _reserves[asset];
  }
}
