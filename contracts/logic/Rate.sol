// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "../libraries/DataStruct.sol";
import "../libraries/Errors.sol";
import "../libraries/Math.sol";
import "../interfaces/IDToken.sol";
import "../interfaces/ILToken.sol";
import "../interfaces/ITokenizer.sol";

library Rate {
    using WadRayMath for uint256;
    using Rate for DataStruct.ReserveData;

    struct UpdateRatesLocalVars {
        uint256 totalLToken;
        uint256 totalAToken;
        uint256 totalDToken;
        uint256 newSupplyAPR;
        uint256 newRealAssetAPR;
        uint256 newDigitalAssetAPR;
        uint256 avgStableRate;
        uint256 totalVariableDebt;
    }

    function updateRates(
        DataStruct.ReserveData storage reserve,
        address tokenizer,
        address underlyingAssetAddress,
        uint256 investAmount,
        uint256 borrowAmount
    ) internal {
        UpdateRatesLocalVars memory vars;

        vars.totalLToken = ILToken(reserve.lTokenAddress).totalSupply();

        vars.totalAToken = ITokenizer(tokenizer).totalATokenSupply();

        vars.totalDToken = IDToken(reserve.dTokenAddress).totalSupply();

        vars.newRealAssetAPR = reserve.realAssetAPR;

    }
}
