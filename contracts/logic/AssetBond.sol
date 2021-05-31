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

  function settleAssetBond(
    DataStruct.AssetBondData storage assetBondData,
    address asset,
    address borrower,
    address lawfirm,
    uint256 collateralValue,
    uint256 dueDate,
    string memory ipfsHash
  ) internal {
    assetBondData.asset = asset;
    assetBondData.borrower = borrower;
    assetBondData.lawfirm = lawfirm;
    assetBondData.collateralValue = collateralValue;
    assetBondData.dueDate = dueDate;
    assetBondData.ipfsHash = ipfsHash;
    assetBondData.lastUpdateTimestamp = block.timestamp;
    assetBondData.state = DataStruct.AssetBondState.SETTLED;
  }

  function collateralizeAssetBond(
    DataStruct.AssetBondData storage assetBondData,
    uint256 borrowAmount,
    uint256 borrowAPR
  ) internal {
    // update tokenizer data
    //reserve.totalDepositedAssetBondCount += 1;

    // set bond date data
    assetBondData.borrowAPR = borrowAPR;
    assetBondData.aTokenInterestIndex = WadRayMath.RAY;
    assetBondData.state = DataStruct.AssetBondState.COLLATERALIZED;
    assetBondData.lastUpdateTimestamp = block.timestamp;
    assetBondData.issuanceDate = block.timestamp;
    assetBondData.maturityDate = block.timestamp + (assetBondData.dueDate * 1 days);
  }

  function releaseAssetBond(DataStruct.AssetBondData storage assetBondData) internal {
    assetBondData.state = DataStruct.AssetBondState.MATURED;
  }

  function validateSettleABToken(uint256 tokenId, address lawfirm) internal view {
    // checks whether lawfirm authorized
    // if (assetBond.state != AssetBondState.EMPTY) revert(); ////
    // access control : check lawfirm
  }

  function validateTokenId(uint256 id) internal {
    // validate id
    //// error InvalidABTokenID(id)
  }
}
