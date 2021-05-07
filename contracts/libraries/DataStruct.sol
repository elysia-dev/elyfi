// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

library DataStruct {
    struct ReserveData {
        uint256 lTokenInterestIndex;
        uint256 dTokenInterestIndex;
        uint256 realAssetAPR;
        uint256 digitalAssetAPR;
        uint256 supplyAPR;
        uint256 totalDepositedAssetBondCount; // need refactor: consider bitmask
        uint256 maturedAssetBondCount; // need refactor: consider bitmask
        uint256 totalDepositedATokenBalance;
        uint40 lastUpdateTimestamp;
        address lTokenAddress;
        address dTokenAddress;
        address interestModelAddress;
        address tokenizerAddress;
        uint8 id;
    }

    struct AssetBondData {
        address asset;
        address borrower;
        address lawfirm;
        string ipfsHash; // refactor : gas
        uint256 collateralValue;
        uint256 borrowAPR;
        uint256 sign; // refactor : apply oz - sign
        uint256 issuanceDate;
        uint256 dueDate;
        uint256 maturityDate;
        bool isSettled; // refactor : need configuration
        bool isDeposited; // refactor : need configuration
        bool isMatured; // refactor : need configuration
    }
}