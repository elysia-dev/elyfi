// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "../libraries/DataStruct.sol";

interface IInterestRateModel {

    function calculateRates(
        address asset,
        address lToken,
        uint256 totalAToken,
        uint256 totalDToken,
        uint256 investAmount,
        uint256 borrowAmount,
        uint256 realAssetAPR,
        uint256 moneyPoolFactor
    ) external view returns (uint256, uint256, uint256);
}
