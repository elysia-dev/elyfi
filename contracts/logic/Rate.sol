// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '../libraries/DataStruct.sol';
import '../libraries/Errors.sol';
import '../libraries/Math.sol';
import '../interfaces/ILToken.sol';
import '../interfaces/ITokenizer.sol';
import '../interfaces/IInterestRateModel.sol';

library Rate {
  using WadRayMath for uint256;
  using Rate for DataStruct.ReserveData;

  event MoneyPoolRatesUpdated(
    address indexed underlyingAssetAddress,
    uint256 lTokenIndex,
    uint256 borrowAPR,
    uint256 supplyAPR
  );

  struct UpdateRatesLocalVars {
    uint256 totalLToken;
    uint256 totalAToken;
    uint256 newBorrowAPR;
    uint256 newSupplyAPR;
    uint256 averageATokenAPR;
    uint256 totalVariableDebt;
  }

  function updateRates(
    DataStruct.ReserveData storage reserve,
    address underlyingAssetAddress,
    uint256 investAmount,
    uint256 borrowAmount
  ) internal {
    UpdateRatesLocalVars memory vars;

    vars.totalLToken = ILToken(reserve.lTokenAddress).totalSupply();

    vars.totalAToken = ITokenizer(reserve.tokenizerAddress).totalATokenSupply();

    vars.averageATokenAPR = ITokenizer(reserve.tokenizerAddress).getAverageATokenAPR();

    (vars.newBorrowAPR, vars.newSupplyAPR) = IInterestRateModel(reserve.interestModelAddress)
      .calculateRates(
      underlyingAssetAddress,
      reserve.lTokenAddress,
      vars.totalAToken,
      investAmount,
      borrowAmount,
      vars.averageATokenAPR,
      reserve.moneyPoolFactor
    );

    reserve.borrowAPR = vars.newBorrowAPR;
    reserve.supplyAPR = vars.newSupplyAPR;

    emit MoneyPoolRatesUpdated(
      underlyingAssetAddress,
      reserve.lTokenInterestIndex,
      vars.newBorrowAPR,
      vars.newSupplyAPR
    );
  }
}
