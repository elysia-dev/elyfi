// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "../libraries/DataStruct.sol";
import "../libraries/Errors.sol";
import "../libraries/Math.sol";
import "../interfaces/IDToken.sol";

library AssetBond {
    using WadRayMath for uint256;
    using AssetBond for DataStruct.AssetBondData;

    function initAssetBond(
        DataStruct.AssetBondData storage assetBondData,
        address asset,
        address borrower,
        address lawfirm,
        string memory ipfsHash
    ) internal {
        assetBondData.asset = asset;
        assetBondData.borrower = borrower;
        assetBondData.lawfirm = lawfirm;
        assetBondData.ipfsHash = ipfsHash;
        assetBondData.isSettled = true;
        assetBondData.isDeposited = false;
        assetBondData.isMatured = false;
    }

    function validateDepositAssetBond(
    DataStruct.AssetBondData storage assetBondData
    ) internal {

    }

    function depositAssetBond(
        DataStruct.AssetBondData storage assetBondData
    ) internal {
    }
}
