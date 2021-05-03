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
        // moneypool validate logic : active, frozen

        // check settled logic
        if (assetBond.isSettled == true) revert(); ////error NotSettledABToken(id);

        // check sign logic

    }

    struct DepositAssetBondLocalVars {
        uint256 netAmount;
        uint256 futureInterest;
        uint256 currentTotalAssetBondCount;
        uint256 currentMaturedAssetBondCount;
        uint256 newTotalATokenAmount;
    }

    function depositAssetBond(
        DataStruct.AssetBondData storage assetBondData,
        DataStruct.TokenizerData storage tokenizer,
        uint256 borrowAmount,
        uint256 realAssetAPR,
        uint256 dueDate)
        internal returns (uint256, uint256) {
            DepositAssetBondLocalVars memory vars;

            tokenizer.totalDepositedAssetBondCount += 1;
            tokenizer.totalAToken += borrowAmount;

            assetBondData.borrowAPR = realAssetAPR;
            assetBondData.isDeposited = true;
            assetBondData.issuanceDate = block.timestamp;
            assetBondData.maturityDate = block.timestamp + (dueDate *  1 days);

            vars.netAmount = borrowAmount.rayMul(realAssetAPR);
            vars.futureInterest = borrowAmount - vars.netAmount;

            return (vars.netAmount, vars.futureInterest);
        }
}
