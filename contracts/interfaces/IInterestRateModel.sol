// SPDX-License-Identifier: MIT
pragma solidity 0.8.3;

import '../libraries/DataStruct.sol';

interface IInterestRateModel {
  function calculateRates(
    uint256 lTokenAssetBalance,
    uint256 totalDTokenBalance,
    uint256 depositAmount,
    uint256 borrowAmount,
    uint256 moneyPoolFactor
  ) external view returns (uint256, uint256);

  function updateParameters(
    uint256 optimalUtilizationRate,
    uint256 borrowRateBase,
    uint256 borrowRateOptimal,
    uint256 borrowRateMax
  ) external;
}
