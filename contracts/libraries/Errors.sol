// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

/**
 * @title Errors library
 * @author ELYSIA
 * @dev Custom error messages
 */
library MoneyPoolErrors {
  error DigitalAssetAlreadyAdded(address asset);
  error MaxDigitalAssetCountExceeded();
  error MaxReserveCountExceeded();
  error ReservePaused();
  error ReserveInactivated();
  error InvalidAmount(uint256 amount);
  error WithdrawInsufficientBalance(uint256 amount, uint256 userLTokenBalance);
  error MaturedABToken();
  error NotDepositedABToken();
  error NotSettledABToken(uint256 id);
  error NotSignedABToken(uint256 id);
  error LTokenTransferNotAllowed(address from, address to);
  error OnlyLToken();
}

library TokenErrors {
  error OnlyMoneyPool();
  error LTokenInvalidMintAmount(uint256 implicitBalance);
  error LTokenInvalidBurnAmount(uint256 implicitBalance);
  error DTokenTransferFromNotAllowed();
  error DTokenAllowanceNotAllowed();
  error DTokenApproveNotAllowed();
  error DTokenTransferNotAllowed();
}

library TokenizerErrors {
  error OnlyMoneyPool();
  error OnlyCSP();
  error OnlyCouncil();
  error ABTokenIDAlreadyExists(uint256 tokenId);
  error MintedABTokenReceiverNotAllowed(address account, uint256 tokenId);
}
