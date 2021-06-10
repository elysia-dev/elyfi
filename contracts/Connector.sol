// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import './libraries/Role.sol';
import './ConnectorStorage.sol';
import './interfaces/IConnector.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

/**
 * @title ELYFI Connector
 * @author ELYSIA
 */
contract Connector is IConnector, ConnectorStorage, Ownable {
  constructor() {}

  function addCouncil(address account) external onlyOwner {
    _grantRole(Role.COUNCIL, account);
    emit NewCouncilAdded(account);
  }

  function addCollateralServiceProvider(address account) external onlyOwner {
    _grantRole(Role.CollateralServiceProvider, account);
    emit NewCollateralServiceProviderAdded(account);
  }

  function _grantRole(bytes32 role, address account) internal {
    _roles[role].participants[account] = true;
  }

  function _revokeRole(bytes32 role, address account) internal {
    _roles[role].participants[account] = false;
  }

  function _hasRole(bytes32 role, address account) internal view returns (bool) {
    return _roles[role].participants[account];
  }

  function isCollateralServiceProvider(address account) external view override returns (bool) {
    return _hasRole(Role.CollateralServiceProvider, account);
  }

  function isCouncil(address account) external view override returns (bool) {
    return _hasRole(Role.COUNCIL, account);
  }

  function activateMoneyPool(address asset) external onlyOwner {}

  function deactivateMoneyPool(address asset) external onlyOwner {}
}
