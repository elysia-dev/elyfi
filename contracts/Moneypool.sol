// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "./libraries/WadRayMath.sol";
import "./interfaces/ILToken.sol";
import "./interfaces/IMoneyPool.sol";
import "./interfaces/ILToken.sol";
import "./Errors.sol";
import "./MoneyPoolStorage.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

contract MoneyPool is IMoneyPool, MoneyPoolStorage {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    function invest(
        address asset,
        address account,
        uint256 amount
    ) external override returns (bool) {

        address lToken;
        // validation
        // update indexes
        // update interest rate

        // Mint ltoken

        IERC20Upgradeable(asset).transferFrom(msg.sender, lToken, amount);
    }
}