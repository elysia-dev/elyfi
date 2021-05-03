// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "../libraries/DataStruct.sol";

interface ITokenizer {

    event Invest(address indexed asset, address indexed account, uint256 amount);

    function mintABToken(
        address account,
        uint256 id // information about Co and borrower
    ) external;

    event Withdraw(address indexed asset, address indexed account, address indexed to, uint256 amount);

    function mintAToken(
        address account,
        uint256 id,
        uint256 amount,
        uint256 realAssetAPR
    ) external;
}
