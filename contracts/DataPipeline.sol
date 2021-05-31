// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import './interfaces/ILToken.sol';
import './interfaces/IDToken.sol';
import './interfaces/IMoneyPool.sol';
import './interfaces/ITokenizer.sol';
import './libraries/DataStruct.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

contract DataPipeline {
  IMoneyPool public moneyPool;

  constructor(address moneyPool_) {
    moneyPool = IMoneyPool(moneyPool_);
  }

  struct UserDataLocalVars {
    uint256 underlyingAssetBalance;
    uint256 lTokenBalance;
    uint256 implicitLtokenBalance;
    uint256 dTokenBalance;
    uint256 previousDTokenBalance;
  }

  function getUserData(address asset, address user)
    external
    view
    returns (UserDataLocalVars memory)
  {
    UserDataLocalVars memory vars;
    DataStruct.ReserveData memory reserve = moneyPool.getReserveData(asset);

    vars.underlyingAssetBalance = IERC20(asset).balanceOf(user);
    vars.lTokenBalance = ILToken(reserve.lTokenAddress).balanceOf(user);
    vars.implicitLtokenBalance = ILToken(reserve.lTokenAddress).implicitBalanceOf(user);
    vars.dTokenBalance = IDToken(reserve.dTokenAddress).balanceOf(user);
    vars.previousDTokenBalance = IDToken(reserve.dTokenAddress).balanceOf(user);

    return vars;
  }

  struct ReserveDataLocalVars {
    uint256 totalLTokenSupply;
    uint256 implicitLTokenSupply;
    uint256 totalDTokenSupply;
    uint256 lTokenInterestIndex;
    uint256 averageRealAssetBorrowRate;
    uint256 borrowAPR;
    uint256 supplyAPR;
    uint256 moneyPooLastUpdateTimestamp;
  }

  function getReserveData(address asset) external view returns (ReserveDataLocalVars memory) {
    ReserveDataLocalVars memory vars;
    DataStruct.ReserveData memory reserve = moneyPool.getReserveData(asset);

    vars.totalLTokenSupply = ILToken(reserve.lTokenAddress).totalSupply();
    vars.implicitLTokenSupply = ILToken(reserve.lTokenAddress).implicitTotalSupply();
    vars.totalDTokenSupply = IDToken(reserve.dTokenAddress).totalSupply();
    vars.lTokenInterestIndex = reserve.lTokenInterestIndex;
    vars.averageRealAssetBorrowRate = IDToken(reserve.dTokenAddress)
      .getTotalAverageRealAssetBorrowRate();
    vars.borrowAPR = reserve.borrowAPR;
    vars.supplyAPR = reserve.supplyAPR;
    vars.moneyPooLastUpdateTimestamp = reserve.lastUpdateTimestamp;

    return vars;
  }

  struct AssetBondDataLocalVars {
    uint256 tokenId;
    uint256 aTokenBalance;
    address tokenOwner;
    DataStruct.AssetBondState state;
  }

  function getAssetBondData(address asset, uint256 tokenId)
    external
    view
    returns (AssetBondDataLocalVars memory)
  {
    AssetBondDataLocalVars memory vars;
    DataStruct.ReserveData memory reserve = moneyPool.getReserveData(asset);
    ITokenizer tokenizer = ITokenizer(reserve.tokenizerAddress);
    vars.tokenId = tokenId;
    //vars.aTokenBalance

    return vars;
  }
}
