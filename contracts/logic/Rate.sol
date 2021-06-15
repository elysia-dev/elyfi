// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '../libraries/DataStruct.sol';
import '../libraries/Errors.sol';
import '../libraries/Math.sol';
import '../interfaces/ILToken.sol';
import '../interfaces/IDToken.sol';
import '../interfaces/ITokenizer.sol';
import '../interfaces/IInterestRateModel.sol';

library Rate {
  using WadRayMath for uint256;
  using Rate for DataStruct.ReserveData;

  event RatesUpdated(
    address indexed underlyingAssetAddress,
    uint256 lTokenIndex,
    uint256 borrowAPR,
    uint256 supplyAPR
  );

  struct UpdateRatesLocalVars {
    uint256 totalDToken;
    uint256 newBorrowAPR;
    uint256 newSupplyAPR;
    uint256 averageBorrowAPR;
    uint256 totalVariableDebt;
  }

  function updateRates(
    DataStruct.ReserveData storage reserve,
    address underlyingAssetAddress,
    uint256 investAmount,
    uint256 borrowAmount
  ) internal {
    UpdateRatesLocalVars memory vars;

    vars.totalDToken = IDToken(reserve.dTokenAddress).totalSupply();

    vars.averageBorrowAPR = IDToken(reserve.dTokenAddress).getTotalAverageRealAssetBorrowRate();

    uint256 lTokenAssetBalance =
      IERC20(underlyingAssetAddress).balanceOf(reserve.lTokenAddress) + investAmount - borrowAmount;
    (vars.newBorrowAPR, vars.newSupplyAPR) = IInterestRateModel(reserve.interestModelAddress)
      .calculateRates(
      lTokenAssetBalance,
      vars.totalDToken,
      investAmount,
      borrowAmount,
      vars.averageBorrowAPR,
      reserve.moneyPoolFactor
    );

    reserve.borrowAPR = vars.newBorrowAPR;
    reserve.supplyAPR = vars.newSupplyAPR;

    emit RatesUpdated(
      underlyingAssetAddress,
      reserve.lTokenInterestIndex,
      vars.newBorrowAPR,
      vars.newSupplyAPR
    );
  }
}
