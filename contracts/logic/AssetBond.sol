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
        assetBondData.collateralizeTimestamp,
        block.timestamp
      );

    uint256 feeOnCollateralServiceProvider =
      calculateFeeOnRepayment(assetBondData, block.timestamp);

    return (accruedDebtOnMoneyPool, feeOnCollateralServiceProvider);
  }

  struct CalculateFeeOnRepaymentLocalVars {
    TimeConverter.DateTime paymentDateTimeStruct;
    uint256 paymentDate;
    uint256 firstTermRate;
    uint256 secondTermRate;
    uint256 secondTermOverdueRate;
    uint256 thirdTermRate;
    uint256 totalRate;
  }

  function calculateFeeOnRepayment(
    DataStruct.AssetBondData memory assetBondData,
    uint256 paymentTimestamp
  ) internal pure returns (uint256) {
    CalculateFeeOnRepaymentLocalVars memory vars;

    vars.firstTermRate = Math.calculateCompoundedInterest(
      assetBondData.couponRate,
      assetBondData.loanStartTimestamp,
      assetBondData.collateralizeTimestamp
    );

    vars.paymentDateTimeStruct = TimeConverter.parseTimestamp(paymentTimestamp);
    vars.paymentDate = TimeConverter.toTimestamp(
      vars.paymentDateTimeStruct.year,
      vars.paymentDateTimeStruct.month,
      vars.paymentDateTimeStruct.day + 1
    );

    if (paymentTimestamp <= assetBondData.liquidationTimestamp) {
      vars.secondTermRate =
        Math.calculateCompoundedInterest(
          assetBondData.couponRate - assetBondData.interestRate,
          assetBondData.collateralizeTimestamp,
          paymentTimestamp
        ) -
        WadRayMath.ray();
      vars.thirdTermRate =
        Math.calculateCompoundedInterest(
          assetBondData.couponRate,
          paymentTimestamp,
          vars.paymentDate
        ) -
        WadRayMath.ray();

      vars.totalRate = vars.firstTermRate + vars.secondTermRate + vars.thirdTermRate;

      return assetBondData.principal.rayMul(vars.totalRate);
    }

    vars.secondTermRate =
      Math.calculateCompoundedInterest(
        assetBondData.couponRate - assetBondData.interestRate,
        assetBondData.collateralizeTimestamp,
        assetBondData.maturityTimestamp
      ) -
      WadRayMath.ray();
    vars.secondTermOverdueRate =
      Math.calculateCompoundedInterest(
        assetBondData.couponRate + assetBondData.overdueInterestRate - assetBondData.interestRate,
        assetBondData.maturityTimestamp,
        paymentTimestamp
      ) -
      WadRayMath.ray();
    vars.thirdTermRate =
      Math.calculateCompoundedInterest(
        assetBondData.couponRate + assetBondData.overdueInterestRate,
        paymentTimestamp,
        vars.paymentDate
      ) -
      WadRayMath.ray();

    vars.totalRate =
      vars.firstTermRate +
      vars.secondTermRate +
      vars.secondTermOverdueRate +
      vars.thirdTermRate;

    return assetBondData.principal.rayMul(vars.totalRate);
  }

  struct CalculateDebtAmountToLiquidationLocalVars {
    TimeConverter.DateTime paymentDateTimeStruct;
    uint256 paymentDate;
    uint256 firstTermRate;
    uint256 secondTermRate;
    uint256 totalRate;
  }

  function calculateDebtAmountToLiquidation(
    uint256 principal,
    uint256 couponRate,
    uint256 overdueInterestRate,
    uint256 effectiveTimestamp,
    uint256 paymentTimestamp,
    uint256 maturityTimestamp
  ) internal pure returns (uint256) {
    CalculateDebtAmountToLiquidationLocalVars memory vars;
    vars.firstTermRate = Math.calculateCompoundedInterest(
      couponRate,
      effectiveTimestamp,
      maturityTimestamp
    );

    vars.paymentDateTimeStruct = TimeConverter.parseTimestamp(paymentTimestamp);
    vars.paymentDate = TimeConverter.toTimestamp(
      vars.paymentDateTimeStruct.year,
      vars.paymentDateTimeStruct.month,
      vars.paymentDateTimeStruct.day + 1
    );

    vars.secondTermRate =
      Math.calculateCompoundedInterest(
        couponRate + overdueInterestRate,
        maturityTimestamp,
        vars.paymentDate
      ) -
      WadRayMath.ray();
    vars.totalRate = vars.firstTermRate + vars.secondTermRate;
    return principal.rayMul(vars.totalRate);
  }
}
