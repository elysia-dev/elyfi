// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import './libraries/DataStruct.sol';
import './logic/Index.sol';
import './interfaces/IConnector.sol';
import './interfaces/IMoneyPool.sol';

contract TokenizerStorage {
  using Index for DataStruct.ReserveData;

  IConnector internal _connector;

  IMoneyPool internal _moneyPool;

  mapping(uint256 => bytes32) internal _tokenType;

  mapping(uint256 => address) internal _minter;

  address internal _underlyingAsset;

  /// @notice A mapping from an asset bond's identifier to the asset bond data struct.
  /// The token id is a unique identifier for asset bond.
  mapping(uint256 => DataStruct.AssetBondData) internal _assetBondData;
}
