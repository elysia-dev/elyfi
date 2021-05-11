// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

/**
 * @title Errors library
 * @author ELYSIA
 * @dev Error messages prefix glossary:
 */
library Errors {
  //common errors
  string public constant BORROW_ALLOWANCE_NOT_ENOUGH = '59'; // User borrows on behalf, but allowance are too small
  string public constant VL_NO_ACTIVE_RESERVE = '2'; // 'Action requires an active reserve'
  string public constant AUTH_ONLY_MONEYPOOL = '1'; // Only moneypool
}

library MoneyPoolErrors {
  //// error MaxDigitalAssetCountExceeded();
  //// error DigitalAssetAlreadyAdded(address asset);
  //// error ReservePaused();
  //// error ReserveInactivated();
  //// error InvalidAmount(uint256 amount);
  //// error WithdrawInsufficientBalance(uint256 amount, uint256 userLTokenBalance);
  //// error MaturedABToken();
  //// error NotDepositedABToken();
  //// error InsufficientATokenBalance(uint256 totalDepositedATokenBalance);
}

library TokenErrors {
  //// error OnlyMoneyPool();
  //// error InvalidMintAmount(uint256 implicitBalance);
  //// error InvalidBurnAmount(uint256 implicitBalance);
}