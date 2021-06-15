// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '../libraries/DataStruct.sol';

interface ITokenizer {
  event EmptyAssetBondMinted(address indexed account, uint256 tokenId);

  event AssetBondSettled(
    address indexed borrower,
    address indexed signer,
    uint256 tokenId,
    uint256 principal,
    uint256 couponRate,
    uint256 overdueInterestRate,
    uint256 debtCeiling,
    uint256 maturityTimestamp,
    uint256 liquidationTimestamp,
    string ifpsHash
  );

  event AssetBondSigned(address indexed signer, uint256 tokenId, string signerOpinionHash);

  event AssetBondCollateralized(
    address indexed account,
    uint256 tokenId,
    uint256 borrowAmount,
    uint256 interestRate
  );

  event AssetBondReleased(address indexed borrower, uint256 tokenId);

  function mintAssetBond(
    address account,
    uint256 id // information about Co and borrower
  ) external;

  function collateralizeAssetBond(
    address collateralServiceProvider,
    uint256 tokenId,
    uint256 borrowAmount,
    uint256 borrowAPR
  ) external;

  function releaseAssetBond(address account, uint256 tokenId) external;

  function getAssetBondData(uint256 tokenId) external returns (DataStruct.AssetBondData memory);

  function getAssetBondDebtData(uint256 tokenId) external returns (uint256, uint256);

  function getMinter(uint256 tokenId) external view returns (address);
}
