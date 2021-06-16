// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

// Todo. add new arguements: We're waiting for hardhat team's working on custom error issue.

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
  error MaturedAssetBond();
  error NotDepositedAssetBond();
  error NotSettledAssetBond(uint256 id);
  error NotSignedAssetBond(uint256 id);
  error LTokenTransferNotAllowed(address from, address to);
  error OnlyLToken();
  error OnlySignedTokenBorrowAllowed();
  error OnlyAssetBondOwnerBorrowAllowed();
  error PartialRepaymentNotAllowed(uint256 amount, uint256 totalRetrieveAmount);
  error NotEnoughLiquidityToLoan();
  error NotTimeForLoanStart();
  error LoanExpired();
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
  error OnlyCollateralServiceProvider();
  error OnlyCouncil();
  error AssetBondIDAlreadyExists(uint256 tokenId);
  error MintedAssetBondReceiverNotAllowed(uint256 tokenId); // add `address receiver`
  error OnlyOwnerHasAuthrotyToSettle(uint256 tokenId); // and `address minter` |
  error AssetBondAlreadySettled(uint256 tokenId);
  error SettledLoanStartTimestampInvalid();
  error LoanDurationInvalid();
  error OnlySettledTokenSignAllowed();
}
