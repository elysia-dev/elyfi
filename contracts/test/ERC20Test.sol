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
    _owner = msg.sender;
  }

  address internal _owner;

  /**
   * @notice The faucet is for testing ELYFI functions
   */
  function faucet() external payable {
    require(msg.value > 0, 'Not enough msg.value');

    transfer(msg.sender, msg.value * 1000000);
  }

  function withdraw() external returns (bool) {
    require(msg.sender == _owner, 'We will give back to the faucet');
    return payable(address(msg.sender)).send(balanceOf(address(this)));
  }
}
