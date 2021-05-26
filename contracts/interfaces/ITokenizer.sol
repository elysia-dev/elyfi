// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '../libraries/DataStruct.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol';

interface ITokenizer is IERC1155Upgradeable {
  event Invest(address indexed asset, address indexed account, uint256 amount);

  event Withdraw(
    address indexed asset,
    address indexed account,
    address indexed to,
    uint256 amount
  );

  event MintAToken(
    address indexed account,
    uint256 aTokenID,
    uint256 borrowAmount,
    uint256 newAverageATokenRate,
    uint256 newTotalATokenSupply
  );

  function mintABToken(
    address account,
    uint256 id // information about Co and borrower
  ) external;

  function totalATokenSupply() external view returns (uint256);

  function getAverageATokenAPR() external view returns (uint256);

  function getTokenizerData() external view returns (DataStruct.TokenizerData memory);

  function getAssetBondData(uint256 tokenId)
    external
    view
    returns (DataStruct.AssetBondData memory);

  function getATokenInterestIndex(uint256 tokenId) external view returns (uint256);

  function depositAssetBond(
    address account,
    uint256 tokenId,
    uint256 borrowAmount,
    uint256 realAssetAPR
  ) external;
}
