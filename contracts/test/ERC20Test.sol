// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

/**
 * @notice This ERC20 is only for the testnet.
 */
contract ERC20Test is ERC20 {
  constructor(
    uint256 totalSupply_,
    string memory name_,
    string memory symbol_
  ) ERC20(name_, symbol_) {
    _mint(msg.sender, totalSupply_ / 2);
    _mint(address(this), totalSupply_ / 2);
  }

  /**
   * @notice The faucet is for testing ELYFI functions
   */
  function faucet() external {
    transfer(msg.sender, 10000 * 1e18);
  }
}
