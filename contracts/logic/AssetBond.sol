// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '../libraries/DataStruct.sol';
import '../libraries/Errors.sol';
import '../libraries/Math.sol';
import '../libraries/WadRayMath.sol';

library AssetBond {
  using WadRayMath for uint256;
  using AssetBond for DataStruct.AssetBondData;

  function getAssetBondDebtData(DataStruct.AssetBondData memory assetBondData)
    internal
    view
    returns (uint256, uint256)
  {
    uint256 accruedDebtOnMoneyPool =
      Math.calculateCompoundedInterest(
        assetBondData.interestRate,
        assetBondData.loanStartTimestamp,
        block.timestamp
      );

    uint256 feeOnCollateralServiceProvider =
      Math.calculateFeeOnRepayment(
        assetBondData.principal,
        assetBondData.couponRate,
        assetBondData.interestRate,
        assetBondData.overdueInterestRate,
        block.timestamp,
        assetBondData.loanStartTimestamp,
        assetBondData.collateralizeTimestamp,
        assetBondData.maturityTimestamp,
        assetBondData.liquidationTimestamp
      );

    return (accruedDebtOnMoneyPool, feeOnCollateralServiceProvider);
  }
}
