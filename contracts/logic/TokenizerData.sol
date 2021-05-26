// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '../libraries/DataStruct.sol';
import '../libraries/Errors.sol';
import '../libraries/Math.sol';
import '../libraries/WadRayMath.sol';

library TokenizerData {
  using WadRayMath for uint256;
  using TokenizerData for DataStruct.TokenizerData;

  event MoneyPoolATokenDataUpdated(
    address underlyingAsset,
    uint256 id,
    uint256 averageATokenAPR,
    uint256 totalATokenBalanceOfMoneyPool
  );

  event TotalATokenUpdated(
    address underlyingAsset,
    uint256 averageATokenAPR,
    uint256 totalATokenSupply
  );

  struct IncreaseATokenBalanceLocalVars {
    uint256 newAPR;
    uint256 newBalance;
  }

  function increaseTotalATokenSupply(
    DataStruct.TokenizerData storage tokenizerData,
    uint256 amountIn,
    uint256 rate
  ) internal {
    IncreaseATokenBalanceLocalVars memory vars;

    (vars.newAPR, vars.newBalance) = Math.calculateRateInIncreasingBalance(
      tokenizerData.averageATokenAPR,
      tokenizerData.totalATokenSupply,
      amountIn,
      rate
    );

    tokenizerData.averageATokenAPR = vars.newAPR;
    tokenizerData.totalATokenSupply = vars.newBalance;

    emit TotalATokenUpdated(tokenizerData.asset, vars.newAPR, vars.newBalance);
  }

  struct DecreaseATokenBalanceLocalVars {
    uint256 newAPR;
    uint256 newBalance;
  }

  function decreaseTotalATokenSupply(
    DataStruct.TokenizerData storage tokenizerData,
    uint256 amountOut,
    uint256 rate
  ) internal {
    IncreaseATokenBalanceLocalVars memory vars;

    (vars.newAPR, vars.newBalance) = Math.calculateRateInDecreasingBalance(
      tokenizerData.averageATokenAPR,
      tokenizerData.totalATokenSupply,
      amountOut,
      rate
    );

    tokenizerData.averageATokenAPR = vars.newAPR;
    tokenizerData.totalATokenSupply = vars.newBalance;

    emit TotalATokenUpdated(tokenizerData.asset, vars.newAPR, vars.newBalance);
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
