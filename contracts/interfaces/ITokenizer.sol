// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '../libraries/DataStruct.sol';

interface ITokenizer {
  event EmptyABTokenMinted(address indexed account, uint256 tokenId);

  event Invest(address indexed asset, address indexed account, uint256 amount);

  event Withdraw(
    address indexed asset,
    address indexed account,
    address indexed to,
    uint256 amount
  );

  function mintABToken(
    address account,
    uint256 id // information about Co and borrower
  ) external;

  function collateralizeAssetBond(
    address account,
    uint256 tokenId,
    uint256 borrowAmount,
    uint256 borrowAPR
  ) external;

  function releaseAssetBond(address account, uint256 tokenId) external;

  function getAssetBondData(uint256 tokenId) external returns (DataStruct.AssetBondData memory);
}
