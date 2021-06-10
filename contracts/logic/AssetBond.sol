// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '../libraries/DataStruct.sol';
import '../libraries/Errors.sol';
import '../libraries/Math.sol';
import '../libraries/WadRayMath.sol';

library AssetBond {
  using WadRayMath for uint256;
  using AssetBond for DataStruct.AssetBondData;

  event TotalATokenSupplyUpdated(
    address underlyingAsset,
    uint256 id,
    uint256 averageMoneyPoolAPR,
    uint256 totalATokenBalanceOfMoneyPool
  );

  //   uint256 constant COUNTRY_CODE =
  //   uint256 constant CollateralServiceProvider_IDENTIFICATION_NUMBER = ;
  //   uint256 constant COLLATERAL_LATITUDE = ;
  //   uint256 constant COLLATERAL_LONGITUDE = ;
  //   uint256 constant COLLATERAL_DETAILS = ;
  //   uint256 constant NONCE = ;
  //   uint256 constant ??? = ;
  //   uint256 constant COLLATERAL_CATEGORY = ;

  // uint256 constant COUNTRY_CODE_START= 0;
  // uint256 constant CollateralServiceProvider_IDENTIFICATION_NUMBER_START= 3;
  // uint256 constant COLLATERAL_LATITUDE_START= 18;
  // uint256 constant COLLATERAL_LONGITUDE_START= 30;
  // uint256 constant COLLATERAL_DETAILS_START= 42;
  // uint256 constant NONCE_START= 52;
  // uint256 constant 대출상품번호_START= 55;
  // uint256 constant COLLATERAL_CATEGOR_START= 60;
  function settleAssetBond(
    DataStruct.AssetBondData storage assetBondData,
    address borrower,
    address signer,
    uint256 principal,
    uint256 couponRate,
    uint256 overdueInterestRate,
    uint256 maturityTimestamp,
    uint8 gracePeriod,
    string memory ipfsHash
  ) internal {
    uint256 _gracePeriod = uint256(gracePeriod);
    uint256 liquidationTimestamp = maturityTimestamp + (_gracePeriod * 1 days);

    assetBondData.state = DataStruct.AssetBondState.SETTLED;
    assetBondData.borrower = borrower;
    assetBondData.signer = signer;
    assetBondData.principal = principal;
    assetBondData.couponRate = couponRate;
    assetBondData.maturityTimestamp = maturityTimestamp;
    assetBondData.overdueInterestRate = overdueInterestRate;
    assetBondData.liquidationTimestamp = liquidationTimestamp;
    assetBondData.ipfsHash = ipfsHash;
  }

  function signAssetBond(
    DataStruct.AssetBondData storage assetBondData,
    string memory signerOpinionHash
  ) internal {
    assetBondData.state = DataStruct.AssetBondState.CONFIRMED;
    assetBondData.signerOpinionHash = signerOpinionHash;
  }

  function collateralizeAssetBond(
    DataStruct.AssetBondData storage assetBondData,
    uint256 interestRate
  ) internal {
    assetBondData.state = DataStruct.AssetBondState.COLLATERALIZED;
    // update tokenizer data
    //reserve.totalDepositedAssetBondCount += 1;

    // set bond date data
    assetBondData.interestRate = interestRate;
    assetBondData.collateralizeTimestamp = block.timestamp;
  }

  function releaseAssetBond(DataStruct.AssetBondData storage assetBondData) internal {
    assetBondData.state = DataStruct.AssetBondState.MATURED;
  }
}
