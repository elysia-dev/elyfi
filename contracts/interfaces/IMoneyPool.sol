// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "../libraries/DataStruct.sol";

interface IMoneyPool {

    event InvestMoneyPool(
        address indexed asset,
        address indexed account,
        uint256 amount);

    event WithdrawMoneyPool(
        address indexed asset,
        address indexed account,
        address indexed to,
        uint256 amount);

    event InvestABToken(
        address indexed asset,
        address indexed account,
        uint256 id,
        uint256 amount);

    function investMoneyPool(
        address asset,
        address account,
        uint256 amount
    ) external;

    function withdrawMoneyPool(
        address asset,
        address account,
        uint256 amount
    ) external returns (uint256);

    function investABToken(
        address asset,
        address account,
        uint256 id,
        uint256 amount
    ) external;

    function withdrawABTokenInvestment(
        address asset,
        address account,
        uint256 id,
        uint256 amount,
        bool rewardClaim
    ) external returns (uint256);

    function getLTokenInterestIndex(
        address asset
    ) external view returns (uint256);

    function getDTokenInterestIndex(
        address asset
    ) external view returns (uint256);

    function getReserveData(
        address asset
    ) external view returns (DataStruct.ReserveData memory);

    function addNewReserve(
        address asset,
        address lToken,
        address dToken,
        address interestModel,
        address tokenizer
    ) external;
}
