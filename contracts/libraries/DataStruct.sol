// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

library DataStruct {
  /**
    @notice The main reserve data struct.
   */
  struct ReserveData {
    uint256 moneyPoolFactor;
    uint256 lTokenInterestIndex;
    uint256 borrowAPR;
    uint256 supplyAPR;
    uint256 totalDepositedAssetBondCount;
    uint256 lastUpdateTimestamp;
    address lTokenAddress;
    address dTokenAddress;
    address interestModelAddress;
    address tokenizerAddress;
    uint8 id;
    bool isPaused;
    bool isActivated;
  }

  /**
   * @notice The asset bond data struct.
   * @param ipfsHash The IPFS hash that contains the informations and contracts
   * between Collateral Service Provider and lender.
   * @param maturityDate The amount of time measured in seconds that can elapse
   * before the NPL company liquidate the loan and seize the asset bond collateral.
   * @param borrower The address of the borrower.
   */
  struct AssetBondData {
    address asset;
    address borrower;
    address lawfirm;
    string ipfsHash; // refactor : gas
    uint256 collateralValue;
    uint256 borrowAPR;
    uint256 sign; // refactor : apply oz - sign
    uint256 issuanceDate;
    uint256 dueDate;
    uint256 maturityDate;
    uint256 lastUpdateTimestamp;
    AssetBondState state;
  }

  /**
    @notice The states of asset bond
    * EMPTY: After
    * SETTLED:
    * CONFIRMED:
    * COLLATERALIZED:
    * MATURED:
   */
  enum AssetBondState {EMPTY, SETTLED, CONFIRMED, COLLATERALIZED, MATURED, NOT_PERFORMED}

  struct TokenizerData {
    address asset;
    uint256 averageATokenAPR;
    uint256 totalATokenSupply;
    uint256 lastUpdateTimestamp;
  }
}
