// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '../libraries/DataStruct.sol';

interface IConnector {
  event NewCouncilAdded(address indexed account);
  event NewCSPAdded(address indexed account);

  function isCSP(address account) external view returns (bool);

  function isCouncil(address account) external view returns (bool);
}
