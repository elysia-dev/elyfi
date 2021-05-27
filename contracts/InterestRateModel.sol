// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import './InterestRateModelStorage.sol';
import './libraries/WadRayMath.sol';
import './interfaces/IInterestRateModel.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import 'hardhat/console.sol';

/**
 * @title ELYFI InterestRateModel
 * @author ELYSIA
 */
contract InterestRateModel is IInterestRateModel, InterestRateModelStorage {
  using WadRayMath for uint256;

  constructor(
    uint256 optimalUtilizationRate,
    uint256 borrowRateBase,
    uint256 borrowRateOptimal,
    uint256 borrowRateMax
  ) {
    _optimalUtilizationRate = optimalUtilizationRate;
    _borrowRateBase = borrowRateBase;
    _borrowRateOptimal = borrowRateOptimal;
    _borrowRateMax = borrowRateMax;
  }

  struct calculateRatesLocalVars {
    uint256 totalDebt;
    uint256 utilizationRate;
    uint256 newBorrowAPR;
    uint256 newSupplyAPR;
  }

  function calculateRates(
    address asset,
    address lToken,
    uint256 totalATokenSupply,
    uint256 investAmount,
    uint256 borrowAmount,
    uint256 averageBorrowAPR,
    uint256 moneyPoolFactor
  ) public view override returns (uint256, uint256) {
    calculateRatesLocalVars memory vars;

    vars.totalDebt = totalATokenSupply;

    uint256 availableLiquidity = IERC20(asset).balanceOf(lToken) + investAmount - borrowAmount;

    vars.utilizationRate = vars.totalDebt == 0
      ? 0
      : vars.totalDebt.rayDiv(availableLiquidity + vars.totalDebt);

    vars.newBorrowAPR = 0;

    // Example
    // Case1: under optimal U
    // baseRate = 2%, util = 40%, optimalRate = 10%, optimalUtil = 80%
    // result = 2+40*(10-2)/80 = 4%
    // Case2: over optimal U
    // optimalRate = 10%, util = 90%, maxRate = 100%, optimalUtil = 80%
    // result = 10+(90-80)*(100-10)/(100-80) = 55%
    if (vars.utilizationRate <= _optimalUtilizationRate) {
      vars.newBorrowAPR =
        _borrowRateBase +
        (
          (_borrowRateOptimal - _borrowRateBase).rayDiv(_optimalUtilizationRate).rayMul(
            vars.utilizationRate
          )
        );
    } else {
      vars.newBorrowAPR =
        _borrowRateOptimal +
        (
          (_borrowRateMax - _borrowRateOptimal)
            .rayDiv(WadRayMath.ray() - _optimalUtilizationRate)
            .rayMul(vars.utilizationRate - _borrowRateOptimal)
        );
    }

    vars.newSupplyAPR = vars.newBorrowAPR.rayMul(vars.utilizationRate);
    // need reserveFactor calculation

    console.log(
      'hardhat interest Rate Model console: totalDebt-Util',
      vars.totalDebt,
      vars.utilizationRate
    );

    console.log(
      'hardhat interest Rate Model console: Borrow | Supply',
      vars.newBorrowAPR,
      vars.newSupplyAPR
    );

    return (vars.newBorrowAPR, vars.newSupplyAPR);
  }
}
