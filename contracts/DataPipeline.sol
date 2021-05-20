// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "./interfaces/ILToken.sol";
import "./interfaces/IDToken.sol";
import "./interfaces/IMoneyPool.sol";
import "./interfaces/ITokenizer.sol";
import "./libraries/DataStruct.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DataPipeline {

    IMoneyPool public moneyPool;

    constructor(address moneyPool_) {
        moneyPool = IMoneyPool(moneyPool_);
    }

    struct UserData {
        uint256 underlyingAssetBalance;
        uint256 lTokenBalance;
        uint256 implicitLtokenBalance;
        uint256 dTokenBalance;
        uint256 implicitDtokenBalance;
    }

    function getUserData(
        address asset,
        address user
    ) external view returns (UserData memory){
        UserData memory vars;
        DataStruct.ReserveData memory reserve = moneyPool.getReserveData(asset);

        vars.underlyingAssetBalance = IERC20(asset).balanceOf(user);
        vars.lTokenBalance = ILToken(reserve.lTokenAddress).balanceOf(user);
        vars.implicitLtokenBalance = ILToken(reserve.lTokenAddress).implicitBalanceOf(user);
        vars.dTokenBalance = IDToken(reserve.dTokenAddress).balanceOf(user);
        vars.implicitDtokenBalance = IDToken(reserve.dTokenAddress).implicitBalanceOf(user);

        return vars;
    }

    struct ReserveData {
        uint256 totalLTokenSupply;
        uint256 implicitLTokenSupply;
        uint256 totalDTokenSupply;
        uint256 implicitDTokenSupply;
        uint256 totalATokenSupply;
        uint256 totalMoneyPoolATokenBalance;
        uint256 lTokenInterestIndex;
        uint256 dTokenInterestIndex;
        uint256 averageATokenAPR;
        uint256 realAssetAPR;
        uint256 digitalAssetAPR;
        uint256 supplyAPR;
    }

    function getReserveData(
        address asset
    ) external view returns (ReserveData memory) {
        ReserveData memory vars;
        DataStruct.ReserveData memory reserve = moneyPool.getReserveData(asset);

        vars.totalLTokenSupply = ILToken(reserve.lTokenAddress).totalSupply();
        vars.implicitLTokenSupply = ILToken(reserve.lTokenAddress).implicitTotalSupply();
        vars.totalDTokenSupply = IDToken(reserve.dTokenAddress).totalSupply();
        vars.implicitDTokenSupply = IDToken(reserve.dTokenAddress).implicitTotalSupply();
        vars.totalATokenSupply = ITokenizer(reserve.tokenizerAddress).totalATokenSupply();
        vars.totalMoneyPoolATokenBalance = ITokenizer(reserve.tokenizerAddress).totalATokenBalanceOfMoneyPool();
        vars.lTokenInterestIndex = reserve.lTokenInterestIndex;
        vars.dTokenInterestIndex = reserve.dTokenInterestIndex;
        vars.averageATokenAPR = ITokenizer(reserve.tokenizerAddress).getAverageATokenAPR();
        vars.realAssetAPR = reserve.realAssetAPR;
        vars.digitalAssetAPR = reserve.digitalAssetAPR;
        vars.supplyAPR = reserve.supplyAPR;

        return vars;
    }
}