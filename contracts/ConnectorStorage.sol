// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

/**
 * @title ELYFI Connector storage
 * @author ELYSIA
 */
contract ConnectorStorage {
    struct RoleData {
        mapping (address => bool) participants;
        bytes32 admin;
    }

    mapping (bytes32 => RoleData) internal _roles;
}
