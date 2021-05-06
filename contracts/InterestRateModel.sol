// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "./InterestRateModelStorage.sol";
import "./libraries/WadRayMath.sol";
import "./interfaces/IInterestRateModel.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

/**
 * @title ELYFI InterestRateModel
 * @author ELYSIA
 */
contract InterestRateModel is IInterestRateModel, InterestRateModelStorage {
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
        _optimalUtilizationRate = optimalUtilizationRate;
        _digitalAssetBorrowRateBase = digitalAssetBorrowRateBase;
        _digitalAssetBorrowRateOptimal = digitalAssetBorrowRateOptimal;
        _digitalAssetBorrowRateMax = digitalAssetBorrowRateMax;
        _realAssetBorrowRateBase = realAssetBorrowRateBase;
        _realAssetBorrowRateOptimal = realAssetBorrowRateOptimal;
        _realAssetBorrowRateMax = realAssetBorrowRateMax;
    }

    struct calculateRatesLocalVars {
        uint256 totalDebt;
        uint256 utilizationRate;
        uint256 newRealAssetAPR;
        uint256 newDigitalAssetAPR;
        uint256 newSupplyAPR;
    }

    function calculateRates(
        address asset,
        address lToken,
        uint256 aTokenAmount,
        uint256 dTokenAmount,
        uint256 investAmount,
        uint256 borrowAmount,
        uint256 averageRealAssetAPR,
        uint256 moneyPoolFactor
    ) public view override returns (uint256, uint256, uint256) {
        calculateRatesLocalVars memory vars;

        uint256 availableLiquidity = IERC20(asset).balanceOf(lToken) + investAmount - borrowAmount;

        vars.totalDebt = aTokenAmount + dTokenAmount;
        vars.utilizationRate = vars.totalDebt == 0
            ? 0
            : vars.totalDebt.rayDiv(availableLiquidity + vars.totalDebt);

        vars.newRealAssetAPR = 0;
        vars.newDigitalAssetAPR = 0;

        if (vars.utilizationRate <= _optimalUtilizationRate) {
            vars.newRealAssetAPR = _realAssetBorrowRateBase
                + ((_realAssetBorrowRateOptimal-_realAssetBorrowRateBase)
                .rayDiv(_optimalUtilizationRate)
                .rayMul(vars.utilizationRate));

            vars.newDigitalAssetAPR = _digitalAssetBorrowRateBase
                + ((_digitalAssetBorrowRateOptimal - _digitalAssetBorrowRateBase)
                .rayDiv(_optimalUtilizationRate)
                .rayMul(vars.utilizationRate));
        } else {
            vars.newRealAssetAPR = _realAssetBorrowRateOptimal
                + ((_realAssetBorrowRateMax - _realAssetBorrowRateOptimal)
                .rayDiv(WadRayMath.ray() - _optimalUtilizationRate)
                .rayMul(vars.utilizationRate));

            vars.newDigitalAssetAPR = _digitalAssetBorrowRateOptimal
                + ((_digitalAssetBorrowRateMax - _digitalAssetBorrowRateOptimal)
                .rayDiv(WadRayMath.ray() - _optimalUtilizationRate)
                .rayMul(vars.utilizationRate));
        }

        vars.newSupplyAPR = _overallBorrowAPR(
            aTokenAmount,
            dTokenAmount,
            vars.newDigitalAssetAPR,
            averageRealAssetAPR
            )
            .rayMul(vars.utilizationRate);
            // need reserveFactor calculation

        console.log("hardhat console: totalDebt-Util",
            vars.totalDebt,
            vars.utilizationRate
            );

        console.log("hardhat console: RealAsset-Digital-Supply",
            vars.newRealAssetAPR,
            vars.newDigitalAssetAPR,
            vars.newSupplyAPR);

        return (
            vars.newRealAssetAPR,
            vars.newDigitalAssetAPR,
            vars.newSupplyAPR
            );
    }

    function _overallBorrowAPR(
        uint256 aTokenAmount,
        uint256 dTokenAmount,
        uint256 digitalAssetAPR,
        uint256 averageRealAssetAPR
    ) internal pure returns (uint256) {
        uint256 totalDebt = aTokenAmount + dTokenAmount;

        if (totalDebt == 0) {
            return 0;
        }

        uint256 weightedRealAssetAPR = aTokenAmount.wadToRay().rayMul(averageRealAssetAPR);

        uint256 weightedDigitalAssetAPR = dTokenAmount.wadToRay().rayMul(digitalAssetAPR);

        uint256 result = (weightedDigitalAssetAPR + weightedRealAssetAPR).rayDiv(totalDebt.wadToRay());

        return result;
    }
}
