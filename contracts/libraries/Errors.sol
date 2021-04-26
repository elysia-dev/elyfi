// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

/**
 * @title Errors library
 * @author ELYSIA
 * @dev Error messages prefix glossary:
 *  - VL = ValidationLogic
 *  - MATH = Math libraries
 *  - CT = Common errors between tokens (AToken, VariableDebtToken and StableDebtToken)
 *  - AT = AToken
 *  - SDT = StableDebtToken
 *  - VDT = VariableDebtToken
 *  - LP = LendingPool
 *  - LPAPR = LendingPoolAddressesProviderRegistry
 *  - LPC = LendingPoolConfiguration
 *  - RL = ReserveLogic
 *  - LPCM = LendingPoolCollateralManager
 *  - P = Pausable
 */
library Errors {
  //common errors
  string public constant BORROW_ALLOWANCE_NOT_ENOUGH = '59'; // User borrows on behalf, but allowance are too small
  string public constant VL_NO_ACTIVE_RESERVE = '2'; // 'Action requires an active reserve'
  string public constant AUTH_ONLY_MONEYPOOL = '1'; // Only moneypool

}

library MoneyPoolErrors {
  // error OnlyMoneyPool();
}

library TokenErrors {
  // error InvalidmintAmount(uint256 implicitBalance);
}