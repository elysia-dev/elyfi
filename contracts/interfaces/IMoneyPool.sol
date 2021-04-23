// SPDX-License-Identifier: MIT
pragma solidity 0.8.3;


interface IMoneyPool {

    event Invest(address indexed asset, address indexed account, uint256 amount);

    function invest(
        address asset,
        address account,
        uint256 amount
    ) external returns (bool);
}
