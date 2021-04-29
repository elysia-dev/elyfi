// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "../libraries/DataStruct.sol";

interface IMoneyPool {

    event Invest(address indexed asset, address indexed account, uint256 amount);

    function invest(
        address asset,
        address account,
        uint256 amount
    ) external returns (bool);

    event Withdraw(address indexed asset, address indexed account, address indexed to, uint256 amount);

    function withdraw(
        address asset,
        address account,
        uint256 amount
    ) external returns (uint256);

    function getLTokenInterestIndex(address asset) external view returns (uint256);

    function addNewReserve(
        address asset,
        address lToken,
        address dToken,
        address interestModel
    ) external;

    function getReserveData(address asset) external view returns (DataStruct.ReserveData memory);
}
