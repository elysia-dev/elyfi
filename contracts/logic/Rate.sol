// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "../libraries/DataStruct.sol";
import "../libraries/Errors.sol";
import "../libraries/Math.sol";
import "../interfaces/IDToken.sol";
import "../interfaces/ILToken.sol";
import "../interfaces/ITokenizer.sol";
import "../interfaces/IInterestRateModel.sol";

library Rate {
    using WadRayMath for uint256;
    using Rate for DataStruct.ReserveData;

    event MoneyPoolRatesUpdated(
        address indexed underlyingAssetAddress,
        uint256 lTokenIndex,
        uint256 dTokenIndex,
        uint256 realAssetAPR,
        uint256 digitalAssetAPR,
        uint256 supplyAPR
    );

    struct UpdateRatesLocalVars {
        uint256 totalLToken;
        uint256 totalAToken;
        uint256 totalDToken;
        uint256 newRealAssetAPR;
        uint256 newDigitalAssetAPR;
        uint256 newSupplyAPR;
        uint256 averageRealAssetAPR;
        uint256 totalVariableDebt;
    }

    function updateRates(
        DataStruct.ReserveData storage reserve,
        address underlyingAssetAddress,
        address tokenizer,
        uint256 investAmount,
        uint256 borrowAmount
    ) internal {
        UpdateRatesLocalVars memory vars;

        vars.totalLToken = ILToken(reserve.lTokenAddress).totalSupply();

        vars.totalAToken = reserve.totalDepositedATokenBalance;

        vars.totalDToken = IDToken(reserve.dTokenAddress).totalSupply();

        vars.averageRealAssetAPR = ITokenizer(tokenizer).getAverageATokenAPR();

        (vars.newRealAssetAPR, vars.newDigitalAssetAPR, vars.newSupplyAPR) =
            IInterestRateModel(reserve.interestModelAddress).calculateRates(
                underlyingAssetAddress,
                reserve.lTokenAddress,
                vars.totalLToken,
                vars.totalAToken,
                vars.totalDToken,
                investAmount,
                borrowAmount,
                vars.averageRealAssetAPR
            );

        reserve.realAssetAPR = vars.newRealAssetAPR;
        reserve.digitalAssetAPR = vars.newDigitalAssetAPR;
        reserve.supplyAPR = vars.newSupplyAPR;

        emit MoneyPoolRatesUpdated(
            underlyingAssetAddress,
            reserve.lTokenInterestIndex,
            reserve.dTokenInterestIndex,
            vars.newRealAssetAPR,
            vars.newDigitalAssetAPR,
            vars.newSupplyAPR
            );
    }
}
