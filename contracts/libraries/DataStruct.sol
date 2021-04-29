// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

library DataStruct {
    struct ReserveData {
        uint256 lTokenInterestIndex;
        uint256 dTokenInterestIndex;
        uint256 realAssetAPR;
        uint256 digitalAssetAPR;
        uint256 supplyAPR;
        uint40 lastUpdateTimestamp;
        address lTokenAddress;
        address dTokenAddress;
        address interestModelAddress;
        uint8 id;
    }

    struct AssetBondData {
        string ipfsHash; // refactor : gas
        uint256 sign; // refactor : apply oz - sign
    }

    struct TokenizerData {
        uint256 totalABToken;
        uint256 maturedABToken;
        uint256 totalAToken;
    }
}