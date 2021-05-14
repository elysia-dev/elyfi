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
        uint256 dueDate,
        string memory ipfsHash
    ) internal {
        assetBondData.asset = asset;
        assetBondData.borrower = borrower;
        assetBondData.lawfirm = lawfirm;
        assetBondData.dueDate = dueDate;
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

    function validateTokenId(uint256 id) internal {
        // validate id
        //// error InvalidABTokenID(id)
    }

    struct DepositAssetBondLocalVars {
        uint256 netAmount;
        uint256 futureInterest;
    }

    function depositAssetBond(
        DataStruct.AssetBondData storage assetBondData,
        DataStruct.ReserveData storage reserve,
        uint256 borrowAmount,
        uint256 realAssetAPR
        )
        internal returns (uint256) {
            DepositAssetBondLocalVars memory vars;

            // update tokenizer data
            reserve.totalDepositedAssetBondCount += 1;

            // set bond date data
            assetBondData.borrowAPR = realAssetAPR;
            assetBondData.isDeposited = true;
            assetBondData.issuanceDate = block.timestamp;
            assetBondData.maturityDate = block.timestamp + (assetBondData.dueDate *  1 days);

            // calculate amount reserve in tokenizer
            vars.netAmount = borrowAmount.rayMul(realAssetAPR);

            return vars.netAmount;
        }

    struct IncreaseATokenBalanceLocalVars {
        uint256 newAPR;
        uint256 newBalance;
    }

    event TokenizerDataUpdated(
        address underlyingAsset,
        uint256 id,
        uint256 averageMoneyPoolAPR,
        uint256 totalATokenBalanceOfMoneyPool
    );

    function increaseTotalAToken(
        DataStruct.TokenizerData storage tokenizer,
        uint256 id,
        uint256 amountIn,
        uint256 rate
    ) internal {
        IncreaseATokenBalanceLocalVars memory vars;

        (vars.newAPR, vars.newBalance) = Math.calculateRateInIncreasingBalance(
            tokenizer.averageATokenAPR,
            tokenizer.totalATokenSupply,
            amountIn,
            rate
        );

        tokenizer.averageATokenAPR = vars.newAPR;
        tokenizer.totalATokenSupply = vars.newBalance;

        emit TokenizerDataUpdated(
            tokenizer.asset,
            id,
            vars.newAPR,
            vars.newBalance
        );
    }

    function increaseATokenBalanceOfMoneyPool(
        DataStruct.TokenizerData storage tokenizer,
        uint256 amountIn,
        uint256 rate
    ) internal {
        IncreaseATokenBalanceLocalVars memory vars;

        (vars.newAPR, vars.newBalance) = Math.calculateRateInIncreasingBalance(
            tokenizer.averageATokenAPR,
            tokenizer.totalATokenSupply,
            amountIn,
            rate
        );

        tokenizer.averageMoneyPoolAPR = vars.newAPR;
        tokenizer.totalATokenBalanceOfMoneyPool = vars.newBalance;
    }

    struct DecreaseATokenBalanceLocalVars {
        uint256 previousMoneyPoolBalance;
        uint256 newAPR;
        uint256 newBalance;
    }

    function decreaseATokenBalanceOfMoneyPool(
        DataStruct.TokenizerData storage tokenizer,
        uint256 amountOut,
        uint256 rate
    ) internal {
        DecreaseATokenBalanceLocalVars memory vars;
    }

}
