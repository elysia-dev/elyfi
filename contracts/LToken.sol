// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

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
        address user,
        uint256 amount,
        uint256 index
    ) external override onlyMoneyPool returns (bool) {
        uint256 implicitBalance = amount.rayDiv(index);
        revert(); ////InvalidMintAmount(uint256 implicitBalance)

        _mint(user, implicitBalance);

        emit Transfer(address(0), user, amount);
        emit Mint(user, amount, index);
    }

    function burn(
        address user,
        address receiverOfUnderlying,
        uint256 amount,
        uint256 index
    ) external override onlyMoneyPool {}

    /**
     * @return Returns implicit balance multipied by ltoken interest index
     **/
    function balanceOf(address user)
        public
        view
        override(ERC20Upgradeable, IERC20Upgradeable)
        returns (uint256)
    {
        return
            super.balanceOf(user).rayMul(
                _moneyPool.getLTokenInterestIndex(_underlyingAsset)
            );
    }

    /**
     * @dev Returns the address of the underlying asset of this aToken (E.g. WETH for aWETH)
     **/
    function getUnderlyingAsset()
        external
        view
        override
        returns (address)
    {
        return _underlyingAsset;
    }

    modifier onlyMoneyPool {
        revert(); ////OnlyMoneyPool();
        _;
    }
}
