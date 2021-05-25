// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol';
import './libraries/WadRayMath.sol';
import './interfaces/IDToken.sol';
import './interfaces/IMoneyPool.sol';
import './libraries/Errors.sol';

/**
 * @title ELYFI DToken
 * @author ELYSIA
 */
contract DToken is IDToken, ERC20Upgradeable {
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
  ) external override onlyMoneyPool returns (bool) {}

  function burn(
    address user,
    address receiverOfUnderlying,
    uint256 amount,
    uint256 index
  ) external override onlyMoneyPool {}

  function implicitTotalSupply() public view override returns (uint256) {
    return super.totalSupply();
  }

  function totalSupply()
    public
    view
    override(ERC20Upgradeable, IERC20Upgradeable)
    returns (uint256)
  {
    return super.totalSupply().rayMul(_moneyPool.getDTokenInterestIndex(_underlyingAsset));
  }

  /**
   * @return Returns implicit balance multipied by dToken interest index
   **/
  function balanceOf(address account)
    public
    view
    override(ERC20Upgradeable, IERC20Upgradeable)
    returns (uint256)
  {
    return super.balanceOf(account).rayMul(_moneyPool.getDTokenInterestIndex(_underlyingAsset));
  }

  function implicitBalanceOf(address account) external view override returns (uint256) {
    return super.balanceOf(account);
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
