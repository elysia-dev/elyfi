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
}