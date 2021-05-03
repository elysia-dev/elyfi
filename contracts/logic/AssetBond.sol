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
        uint256 collateralValue,
        string memory ipfsHash
    ) internal {
        assetBondData.asset = asset;
        assetBondData.borrower = borrower;
        assetBondData.lawfirm = lawfirm;
        assetBondData.ipfsHash = ipfsHash;
        assetBondData.collateralValue = collateralValue;
        assetBondData.isSettled = true;
        assetBondData.isDeposited = false;
        assetBondData.isMatured = false;
    }

    function validateBorrowAgainstAssetBond(
        DataStruct.AssetBondData storage assetBond,
        DataStruct.ReserveData storage reserve,
        uint256 borrowAmount,
        uint256 id
    ) internal {
        if (assetBond.isSettled == true) revert(); ////error NotSettledABToken(id);
        // sign logic
        // moneypool validate logic : active, frozen
    }

    struct DepositAssetBondLocalVars {
        uint256 netAmount;
        uint256 futureInterest;
        uint256 totalAssetBondCount;
        uint256 maturedAssetBondCount;
        uint256 newTotalATokenAmount;
        uint256 newRealAssetAPR;
    }

    function depositAssetBond(
        DataStruct.AssetBondData storage assetBondData,
        DataStruct.TokenizerData storage tokenizer,
        uint256 borrowAmount,
        uint256 realAssetAPR)
        internal returns (uint256, uint256) {
        }
}
