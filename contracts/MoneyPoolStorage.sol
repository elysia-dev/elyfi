// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "./libraries/DataStruct.sol";
import "./logic/Index.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract MoneyPoolStorage is Initializable {
    using Index for DataStruct.ReserveData;

    mapping(address => DataStruct.ReserveData) internal _reserves;

    mapping(uint256 => address) internal _reservesList;

    uint256 internal _reserveCount;

    uint256 internal _maxReserveCount;

    mapping(uint256 => DataStruct.AssetBondData) internal _assetBond;

    mapping(address => DataStruct.TokenizerData) internal _tokenizers;

    address internal _tokenizer;

    mapping(uint256 => uint256) internal _depositedAssetBondList;

    uint256 internal _depositAssetBondCount;

    uint256 internal _maturedAssetBondCount;
}
