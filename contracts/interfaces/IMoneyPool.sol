// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

interface IMoneyPool {

    event Invest(address indexed asset, address indexed account, uint256 amount);

    function invest(
        address asset,
        address account,
        uint256 amount
    ) external returns (bool);

    function getLTokenInterestIndex(address asset) external view returns (uint256);

    function addNewReserve(
        address asset,
        address lToken,
        address dToken,
        address interestModel
    ) external;
}
