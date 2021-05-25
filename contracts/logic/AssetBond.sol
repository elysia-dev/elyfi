// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '../libraries/DataStruct.sol';
import '../libraries/Errors.sol';
import '../libraries/Math.sol';
import '../interfaces/IDToken.sol';
import '../libraries/WadRayMath.sol';

library AssetBond {
  using WadRayMath for uint256;
  using AssetBond for DataStruct.AssetBondData;

  event MoneyPoolTotalATokenDataUpdated(
    address underlyingAsset,
    uint256 id,
    uint256 averageMoneyPoolAPR,
    uint256 totalATokenBalanceOfMoneyPool
  );

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
    assetBondData.dueDate = dueDate;
    assetBondData.ipfsHash = ipfsHash;
    assetBondData.collateralValue = collateralValue;
    assetBondData.lastUpdateTimestamp = uint40(block.timestamp);
    assetBondData.state = DataStruct.AssetBondState.SETTLED;
  }

  struct DepositAssetBondLocalVars {
    uint256 netAmount;
    uint256 futureInterest;
  }

  function depositAssetBond(
    DataStruct.AssetBondData storage assetBondData,
    uint256 borrowAmount,
    uint256 realAssetAPR
  ) internal returns (uint256) {
    DepositAssetBondLocalVars memory vars;

    // update tokenizer data
    //reserve.totalDepositedAssetBondCount += 1;

    // set bond date data
    assetBondData.borrowAPR = realAssetAPR;
    assetBondData.aTokenInterestIndex = WadRayMath.RAY;
    assetBondData.lastUpdateTimestamp = uint40(block.timestamp);
    assetBondData.state = DataStruct.AssetBondState.COLLATERALIZED;
    assetBondData.issuanceDate = block.timestamp;
    assetBondData.maturityDate = block.timestamp + (assetBondData.dueDate * 1 days);

    return vars.netAmount;
  }

  function updateAccountATokenBalance(
    address account,
    uint256 tokenId,
    uint256 supplyAPR
  ) internal {}

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
