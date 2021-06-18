// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '../libraries/DataStruct.sol';

interface IConnector {
  event NewCouncilAdded(address indexed account);
  event NewCollateralServiceProviderAdded(address indexed account);
  event CouncilRevoked(address indexed account);
  event CollateralServiceProviderRevoked(address indexed account);

  function isCollateralServiceProvider(address account) external view returns (bool);

  function isCouncil(address account) external view returns (bool);

  function isMoneyPoolAdmin(address account) external view returns (bool);
}
