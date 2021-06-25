// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '../libraries/DataStruct.sol';
import '../libraries/Errors.sol';
import '../libraries/Math.sol';
import '../libraries/WadRayMath.sol';

library AssetBond {
  using WadRayMath for uint256;
  using AssetBond for DataStruct.AssetBondData;

  uint256 constant NONCE = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC00;
  uint256 constant COUNTRY_CODE =
    0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC03FF;
  uint256 constant COLLATERAL_SERVICE_PROVIDER_IDENTIFICATION_NUMBER =
    0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF0000000000003FFFF;
  uint256 constant COLLATERAL_LATITUDE =
    0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF0000000FFFFFFFFFFFFFFFFF;
  uint256 constant COLLATERAL_LATITUDE_SIGNS =
    0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFF;
  uint256 constant COLLATERAL_LONGITUDE =
    0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE0000001FFFFFFFFFFFFFFFFFFFFFFFF;
  uint256 constant COLLATERAL_LONGITUDE_SIGNS =
    0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFDFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;
  uint256 constant COLLATERAL_DETAILS =
    0xFFFFFFFFFFFFFFFFFFFFFFC0000000003FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;
  uint256 constant COLLATERAL_CATEGORY =
    0xFFFFFFFFFFFFFFFFFFFF003FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;
  uint256 constant PRODUCT_NUMBER =
    0xFFFFFFFFFFFFFFFFFC00FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;

  uint256 constant NONCE_START = 0;
  uint256 constant COUNTRY_CODE_START = 10;
  uint256 constant COLLATERAL_SERVICE_PROVIDER_IDENTIFICATION_NUMBER_START = 18;
  uint256 constant COLLATERAL_LATITUDE_START = 68;
  uint256 constant COLLATERAL_LATITUDE_SIGNS_START = 96;
  uint256 constant COLLATERAL_LONGITUDE_START = 97;
  uint256 constant COLLATERAL_LONGITUDE_SIGNS_START = 125;
  uint256 constant COLLATERAL_DETAILS_START = 126;
  uint256 constant COLLATERAL_CATEGORY_START = 166;
  uint256 constant PRODUCT_NUMBER_START = 176;

  function getNonce(uint256 tokenId) internal pure returns (uint256) {
    return tokenId & ~NONCE;
  }

  function getCountryCode(uint256 tokenId) internal pure returns (uint256) {
    return (tokenId & ~COUNTRY_CODE) >> COUNTRY_CODE_START;
  }

  function getCollateralServiceProviderIdentification(uint256 tokenId)
    internal
    pure
    returns (uint256)
  {
    return
      (tokenId & ~COLLATERAL_SERVICE_PROVIDER_IDENTIFICATION_NUMBER) >>
      COLLATERAL_SERVICE_PROVIDER_IDENTIFICATION_NUMBER_START;
  }

  function getCollateralLatitude(uint256 tokenId) internal pure returns (uint256) {
    return (tokenId & ~COLLATERAL_LATITUDE) >> COLLATERAL_LATITUDE_START;
  }

  function getCollateralLatitudeSigns(uint256 tokenId) internal pure returns (uint256) {
    return (tokenId & ~COLLATERAL_LATITUDE_SIGNS) >> COLLATERAL_LATITUDE_SIGNS_START;
  }

  function getCollateralLongitude(uint256 tokenId) internal pure returns (uint256) {
    return (tokenId & ~COLLATERAL_LONGITUDE) >> COLLATERAL_LONGITUDE_START;
  }

  function getCollateralLongitudeSigns(uint256 tokenId) internal pure returns (uint256) {
    return (tokenId & ~COLLATERAL_LONGITUDE_SIGNS) >> COLLATERAL_LONGITUDE_SIGNS_START;
  }

  function getCollateralDetails(uint256 tokenId) internal pure returns (uint256) {
    return (tokenId & ~COLLATERAL_DETAILS) >> COLLATERAL_DETAILS_START;
  }

  function getCollateralCategory(uint256 tokenId) internal pure returns (uint256) {
    return (tokenId & ~COLLATERAL_CATEGORY) >> COLLATERAL_CATEGORY_START;
  }

  function getProductNumber(uint256 tokenId) internal pure returns (uint256) {
    return (tokenId & ~PRODUCT_NUMBER) >> PRODUCT_NUMBER_START;
  }

  function getAssetBondDebtData(DataStruct.AssetBondData memory assetBondData)
    internal
    view
    returns (uint256, uint256)
  {
    if (assetBondData.state != DataStruct.AssetBondState.COLLATERALIZED) {
      return (0, 0);
    }

    uint256 accruedDebtOnMoneyPool = Math
    .calculateCompoundedInterest(
      assetBondData.interestRate,
      assetBondData.collateralizeTimestamp,
      block.timestamp
    ).rayMul(assetBondData.principal);

    uint256 feeOnCollateralServiceProvider = calculateFeeOnRepayment(
      assetBondData,
      block.timestamp
    );

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

      return assetBondData.principal.rayMul(vars.totalRate) - assetBondData.principal;
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

    return assetBondData.principal.rayMul(vars.totalRate) - assetBondData.principal;
  }

  function getAssetBondLiquidationData(DataStruct.AssetBondData memory assetBondData)
    internal
    view
    returns (uint256, uint256)
  {
    uint256 accruedDebtOnMoneyPool = Math
    .calculateCompoundedInterest(
      assetBondData.interestRate,
      assetBondData.collateralizeTimestamp,
      block.timestamp
    ).rayMul(assetBondData.principal);

    uint256 feeOnCollateralServiceProvider = calculateDebtAmountToLiquidation(
      assetBondData,
      block.timestamp
    );

    return (accruedDebtOnMoneyPool, feeOnCollateralServiceProvider);
  }

  struct CalculateDebtAmountToLiquidationLocalVars {
    TimeConverter.DateTime paymentDateTimeStruct;
    uint256 paymentDate;
    uint256 firstTermRate;
    uint256 secondTermRate;
    uint256 totalRate;
  }

  function calculateDebtAmountToLiquidation(
    DataStruct.AssetBondData memory assetBondData,
    uint256 paymentTimestamp
  ) internal pure returns (uint256) {
    CalculateDebtAmountToLiquidationLocalVars memory vars;
    vars.firstTermRate = Math.calculateCompoundedInterest(
      assetBondData.couponRate,
      assetBondData.loanStartTimestamp,
      assetBondData.maturityTimestamp
    );

    vars.paymentDateTimeStruct = TimeConverter.parseTimestamp(paymentTimestamp);
    vars.paymentDate = TimeConverter.toTimestamp(
      vars.paymentDateTimeStruct.year,
      vars.paymentDateTimeStruct.month,
      vars.paymentDateTimeStruct.day + 1
    );

    vars.secondTermRate =
      Math.calculateCompoundedInterest(
        assetBondData.couponRate + assetBondData.overdueInterestRate,
        assetBondData.maturityTimestamp,
        vars.paymentDate
      ) -
      WadRayMath.ray();
    vars.totalRate = vars.firstTermRate + vars.secondTermRate;

    return assetBondData.principal.rayMul(vars.totalRate) - assetBondData.principal;
  }
}
