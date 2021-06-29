// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '../libraries/DataStruct.sol';

interface IIncentivePool {
  function initializeIncentivePool(address lToken) external;

  function updateIncentivePool(address user) external;

  function beforeTokenTransfer(address from, address to) external;

  function claimIncentive(address user) external;
}
