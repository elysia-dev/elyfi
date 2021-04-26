// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "./libraries/WadRayMath.sol";
import "./interfaces/IDToken.sol";
import "./interfaces/IMoneyPool.sol";
import "./libraries/Errors.sol";

/**
 * @title ELYFI DToken
 * @author ELYSIA
 */
contract DToken is IDToken, ERC20Upgradeable {
    using WadRayMath for uint256;

    IMoneyPool internal _pool;
    address internal _underlyingAsset;

    function initialize(
        IMoneyPool pool,
        address underlyingAsset_,
        string memory name_,
        string memory symbol_
    ) public initializer {
        _pool = pool;
        _underlyingAsset = underlyingAsset_;

        __ERC20_init(name_, symbol_);
    }

    function mint(
        address user,
        uint256 amount,
        uint256 index
    ) external override onlyMoneyPool returns (bool) {}

    function burn(
        address user,
        address receiverOfUnderlying,
        uint256 amount,
        uint256 index
    ) external override onlyMoneyPool {}

    /**
     * @dev Returns the address of the underlying asset of this aToken (E.g. WETH for aWETH)
     **/
    function UNDERLYING_ASSET_ADDRESS() external view override returns (address) {
        return _underlyingAsset;
    }

  modifier onlyMoneyPool {
    revert (); //OnlyMoneyPool();
    _;
  }
}
