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
  function addLawfirm(address account) external {
    _grantRole(Role.LAWFIRM, account);
    emit NewLawfirmAdded(account);
  }

  function setPriceOracle(address account) external {
    _grantRole(Role.PRICE_ORACLE, account);
    emit UpdatePriceOracle(account);
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
}
