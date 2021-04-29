// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "../libraries/DataStruct.sol";
import "../libraries/Errors.sol";
import "../libraries/Math.sol";
import "../interfaces/IDToken.sol";

library Rate {
    using WadRayMath for uint256;
    using Rate for DataStruct.ReserveData;

    struct UpdateRatesLocalVars {
        address dTokenAddress;
        uint256 availableLiquidity;
        uint256 totalStableDebt;
        uint256 newLiquidityRate;
        uint256 newStableRate;
        uint256 newVariableRate;
        uint256 avgStableRate;
        uint256 totalVariableDebt;
    }

    function updateRates(
        DataStruct.ReserveData storage reserve,
        address underlyingAssetAddress,
        address lToken,
        uint256 investAmount,
        uint256 borrowAmount
    ) internal {
        UpdateRatesLocalVars memory vars;
    }
}
