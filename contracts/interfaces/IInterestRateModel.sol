// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "../libraries/DataStruct.sol";

interface IInterestRateModel {

    function calculateRates(
        address asset,
        address lToken,
        uint256 investAmount,
        uint256 borrowAmount,
        uint256 dToken,
        uint256 aToken,
        uint256 moneyPoolFactor,
        uint256 realAssetAPR
    ) external view returns (uint256, uint256, uint256);
}
