// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "./interfaces/ILToken.sol";
import "./interfaces/IDToken.sol";
import "./interfaces/IMoneyPool.sol";
import "./MoneyPoolStorage.sol";
import "./logic/Index.sol";
import "./libraries/DataStruct.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

contract MoneyPool is IMoneyPool, MoneyPoolStorage {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using Index for DataStruct.ReserveData;

    function invest(
        address asset,
        address account,
        uint256 amount
    ) external override returns (bool) {
        DataStruct.ReserveData storage reserve = _reserves[asset];

        address lToken = reserve.lTokenAddress;

        // validation

        // update interest rate
        reserve.updateState();

        // Mint ltoken
        ILToken(lToken).mint(account, amount, reserve.lTokenInterestIndex);

        // transfer underlying asset
        IERC20Upgradeable(asset).transferFrom(msg.sender, lToken, amount);
    }

    function getLTokenInterestIndex(address asset)
        external
        view
        override
        returns (uint256) {
            return _reserves[asset].getLTokenInterestIndex();
        }
}