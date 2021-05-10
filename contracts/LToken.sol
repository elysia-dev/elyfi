// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "./libraries/WadRayMath.sol";
import "./interfaces/ILToken.sol";
import "./interfaces/IMoneyPool.sol";
import "./libraries/Errors.sol";

/**
 * @title ELYFI LToken
 * @author ELYSIA
 */
contract LToken is ILToken, ERC20Upgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using WadRayMath for uint256;

    IMoneyPool internal _moneyPool;
    address internal _underlyingAsset;

    function initialize(
        IMoneyPool moneyPool,
        address underlyingAsset_,
        string memory name_,
        string memory symbol_
    ) public initializer {
        _moneyPool = moneyPool;
        _underlyingAsset = underlyingAsset_;

        __ERC20_init(name_, symbol_);
    }

    function mint(
        address account,
        uint256 amount,
        uint256 index
    ) external override onlyMoneyPool returns (bool) {
        uint256 implicitBalance = amount.rayDiv(index);

        if (amount == 0) revert(); ////InvalidMintAmount(uint256 implicitBalance);

        _mint(account, implicitBalance);

        emit Transfer(address(0), account, amount);
        emit Mint(account, amount, index);
    }

    function burn(
        address account,
        address receiver,
        uint256 amount,
        uint256 index
    ) external override onlyMoneyPool {
        uint256 implicitBalance = amount.rayDiv(index);

        if (amount == 0) revert(); ////InvalidBurnAmount(uint256 implicitBalance);

        _burn(account, implicitBalance);

        IERC20Upgradeable(_underlyingAsset).safeTransfer(
            receiver,
            amount
        );

        emit Burn(account, receiver, amount, index);
    }

    /**
     * @return Returns implicit balance multipied by ltoken interest index
     **/
    function balanceOf(
        address account
    ) public view override(ERC20Upgradeable, IERC20Upgradeable) returns (uint256) {
        return
            super.balanceOf(account).rayMul(
                _moneyPool.getLTokenInterestIndex(_underlyingAsset)
            );
    }

    function implicitBalanceOf(
        address account
    ) external view override returns (uint256) {
        return super.balanceOf(account);
    }

    /**
     * @dev Transfers the underlying asset to receiver.
     * @param receiver The recipient of the underlying asset
     * @param amount The amount getting transferred
     * @return The amount transferred
     **/
    function transferUnderlyingTo(
        address receiver,
        uint256 amount
    ) external override onlyMoneyPool returns (uint256) {
        IERC20Upgradeable(_underlyingAsset).safeTransfer(
            receiver,
            amount
        );
        return amount;
    }

    /**
     * @dev Returns the address of the underlying asset of this aToken (E.g. WETH for aWETH)
     **/
    function getUnderlyingAsset() external view override returns (address) {
        return _underlyingAsset;
    }

    modifier onlyMoneyPool {
        if (_msgSender() != address(_moneyPool)) revert(); ////OnlyMoneyPool();
        _;
    }
}
