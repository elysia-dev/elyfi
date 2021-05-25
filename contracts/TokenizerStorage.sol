// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import './libraries/DataStruct.sol';
import './logic/Index.sol';
import './interfaces/IMoneyPool.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';

contract TokenizerStorage is Initializable {
  using Index for DataStruct.ReserveData;

  IMoneyPool internal _moneyPool;

  mapping(uint256 => bytes32) internal _tokenType;

  mapping(uint256 => address) internal _minter;

  address internal _underlyingAsset;

  DataStruct.TokenizerData internal _tokenizerData;

  mapping(uint256 => DataStruct.AssetBondData) internal _assetBondData;
}
