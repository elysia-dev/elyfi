// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "./InterestRateModelStorage.sol";
import "./libraries/WadRayMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title ELYFI InterestRateModel
 * @author ELYSIA
 */
contract InterestRateModel is InterestRateModelStorage {
    using WadRayMath for uint256;

    constructor(
        uint256 optimalUtilizationRate,
        uint256 digitalAssetBorrowRateBase,
        uint256 digitalAssetBorrowRateOptimal,
        uint256 digitalAssetBorrowRateMax,
        uint256 realAssetBorrowRateBase,
        uint256 realAssetBorrowRateOptimal,
        uint256 realAssetBorrowRateMax
    ) {
        optimalUtilizationRate = _optimalUtilizationRate;
        digitalAssetBorrowRateBase = _digitalAssetBorrowRateBase;
        digitalAssetBorrowRateOptimal = _digitalAssetBorrowRateOptimal;
        digitalAssetBorrowRateMax = _digitalAssetBorrowRateMax;
        realAssetBorrowRateBase = _realAssetBorrowRateBase;
        realAssetBorrowRateOptimal = _realAssetBorrowRateOptimal;
        realAssetBorrowRateMax = _realAssetBorrowRateMax;
    }

    struct calculateRatesLocalVars {
        uint256 totalDebt;
        uint256 utilizationRate;
        uint256 newRealAssetAPR;
        uint256 newDigitalAssetAPR;
    }

    function calculateRates(
        address asset,
        address lToken,
        uint256 investAmount,
        uint256 borrowAmount,
        uint256 dToken,
        uint256 aToken,
        uint256 moneyPoolFactor,
        uint256 realAssetAPR
    ) public view override returns (uint256, uint256, uint256) {
        calculateRatesLocalVars memory vars;

        uint256 availableLiquidity = IERC20(asset).balanceOf(lToken) + investAmount - borrowAmount;

        vars.totalDebt = dToken + aToken;
        vars.utilizationRate = vars.totalDebt == 0
            ? 0
            : vars.totalDebt.rayDiv(availableLiquidity + vars.totalDebt);

        if (vars.utilizationRate <= _optimalUtilizationRate) {
            vars.newRealAssetAPR = _realAssetBorrowRateBase
                + (_realAssetBorrowRateOptimal-_realAssetBorrowRateBase)
                .rayDiv(_optimalUtilizationRate)
                .rayMul(vars.utilizationRate);

            vars.newDigitalAssetAPR = _digitalAssetBorrowRateBase
                + (_digitalAssetBorrowRateOptimal - _digitalAssetBorrowRateBase)
                .rayDiv(_optimalUtilizationRate)
                .rayMul(vars.utilizationRate);
        } else {
            vars.newRealAssetAPR = _realAssetBorrowRateOptimal
                + (_realAssetBorrowRateMax - _realAssetBorrowRateOptimal)
                .rayDiv(WadRayMath.ray() - _optimalUtilizationRate)
                .rayMul(vars.utilizationRate);

            vars.newDigitalAssetAPR = _digitalAssetBorrowRateOptimal
                + (_digitalAssetBorrowRateMax - _digitalAssetBorrowRateOptimal)
                .rayDiv(WadRayMath.ray() - _optimalUtilizationRate)
                .rayMul(vars.utilizationRate);
        }
    }

    function _overallBorrowAPR(
        uint256 dToken,
        uint256 aToken,
        uint256 digitalAssetAPR,
        uint256 realAssetAPR
    ) internal pure returns (uint256) {
        uint256 totalDebt = dToken + aToken;

        uint256 weightedDigitalAssetAPR = dToken.wadToRay().rayMul(digitalAssetAPR);

        uint256 weightedRealAssetAPR = aToken.wadToRay().rayMul(realAssetAPR);

        uint256 result = (weightedDigitalAssetAPR + weightedRealAssetAPR).rayDiv(totalDebt.wadToRay());

        return result;
    }
}
