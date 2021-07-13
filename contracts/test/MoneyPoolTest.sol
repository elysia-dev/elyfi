// SPDX-License-Identifier: MIT
pragma solidity 0.8.3;

import '../MoneyPool.sol';

contract MoneyPoolTest is MoneyPool {
  using Rate for DataStruct.ReserveData;

  constructor(uint256 maxReserveCount_, address connector) MoneyPool(maxReserveCount_, connector) {}

  function utilzedReserveForTest(
    address asset,
    uint256 totalSupply,
    uint256 totalBorrow
  ) external {
    DataStruct.ReserveData storage reserve = _reserves[asset];

    ILToken(reserve.lTokenAddress).mint(msg.sender, totalSupply, reserve.lTokenInterestIndex);
    reserve.updateRates(asset, 0, 0);

    IDToken(reserve.dTokenAddress).mint(msg.sender, msg.sender, totalBorrow, reserve.borrowAPY);
    reserve.updateRates(asset, 0, 0);
  }
}
