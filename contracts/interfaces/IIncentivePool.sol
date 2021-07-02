// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '../libraries/DataStruct.sol';

interface IIncentivePool {
  event ClaimIncentive(address indexed user, uint256 accruedIncentive);

  event UpdateIncentivePool(uint256 incentiveIndex);

  function initializeIncentivePool(address lToken) external;

  function updateIncentivePool(address user) external;

  function beforeTokenTransfer(address from, address to) external;

  function claimIncentive(address user) external;

  error OnlyLToken();
  error OnlyMoneyPool();
  error AlreadyInitialized();
}
