// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

library DataStruct {
  struct ReserveData {
    uint256 moneyPoolFactor;
    uint256 lTokenInterestIndex;
    uint256 borrowAPR;
    uint256 supplyAPR;
    uint256 totalDepositedAssetBondCount; // need refactor: consider bitmask
    uint256 lastUpdateTimestamp;
    address lTokenAddress;
    address interestModelAddress;
    address tokenizerAddress;
    uint8 id;
    bool isPaused;
    bool isActivated;
  }

  enum AssetBondState {EMPTY, SETTLED, CONFIRMED, COLLATERALIZED, MATURED, NOT_PERFORMED}

  struct AssetBondData {
    address asset;
    address borrower;
    address lawfirm;
    string ipfsHash; // refactor : gas
    uint256 collateralValue;
    uint256 borrowAPR;
    uint256 aTokenInterestIndex;
    uint256 sign; // refactor : apply oz - sign
    uint256 issuanceDate;
    uint256 dueDate;
    uint256 maturityDate;
    uint256 lastUpdateTimestamp;
    AssetBondState state;
  }

  struct TokenizerData {
    address asset;
    uint256 averageATokenAPR;
    uint256 totalATokenSupply;
    uint40 lastUpdateTimestamp;
  }
}
