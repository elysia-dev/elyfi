// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import './libraries/Role.sol';
import './ConnectorStorage.sol';
import './interfaces/IConnector.sol';

/**
 * @title ELYFI Connector
 * @author ELYSIA
 */
contract Connector is IConnector, ConnectorStorage {
  function addCouncil(address account) external {
    _grantRole(Role.COUNCIL, account);
    emit NewCouncilAdded(account);
  }

  function addCSP(address account) external {
    _grantRole(Role.CSP, account);
    emit NewCSPAdded(account);
  }

  function setAdmin(address account) external {
    _grantRole(Role.MONEYPOOL_ADMIN, account);
    emit UpdateAdmin(account);
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

  function isMoneyPool(address account) external view override returns (bool) {}

  function isCSP(address account) external view override returns (bool) {}

  function isCouncil(address account) external view override returns (bool) {}
}
