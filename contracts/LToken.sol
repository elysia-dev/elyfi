// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/utils/Address.sol';
import './libraries/WadRayMath.sol';
import './libraries/Errors.sol';
import './interfaces/ILToken.sol';
import './interfaces/IMoneyPool.sol';

/**
 * @title ELYFI LToken
 * @author ELYSIA
 * @notice LTokens are the basis for repayment of loans and interest on their deposits.
 * @dev LTokens comply with the ERC20 token standard. When Money Pool depositors deposit or withdraw
 * assets from the Money Pool Contract, the Smart Contract automatically issues or destroys LTokens accordingly.
 */
contract LToken is ILToken, ERC20 {
  using SafeERC20 for IERC20;
  using WadRayMath for uint256;

  IMoneyPool internal _moneyPool;
  address internal _underlyingAsset;

  constructor(
    IMoneyPool moneyPool,
    address underlyingAsset_,
    string memory name_,
    string memory symbol_
  ) ERC20(name_, symbol_) {
    _moneyPool = moneyPool;
    _underlyingAsset = underlyingAsset_;
  }

  function mint(
    address account,
    uint256 amount,
    uint256 index
  ) external override onlyMoneyPool {
    uint256 implicitBalance = amount.rayDiv(index);

    if (amount == 0) revert TokenErrors.LTokenInvalidMintAmount(implicitBalance);

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

    if (amount == 0) revert TokenErrors.LTokenInvalidBurnAmount(implicitBalance);

    _burn(account, implicitBalance);

    IERC20(_underlyingAsset).safeTransfer(receiver, amount);

    emit Burn(account, receiver, amount, index);
  }

  /**
   * @return Returns implicit balance multipied by ltoken interest index
   **/
  function balanceOf(address account) public view override(IERC20, ERC20) returns (uint256) {
    return super.balanceOf(account).rayMul(_moneyPool.getLTokenInterestIndex(_underlyingAsset));
  }

  function implicitBalanceOf(address account) external view override returns (uint256) {
    return super.balanceOf(account);
  }

  function implicitTotalSupply() public view override returns (uint256) {
    return super.totalSupply();
  }

  function totalSupply() public view override(IERC20, ERC20) returns (uint256) {
    return super.totalSupply().rayMul(_moneyPool.getLTokenInterestIndex(_underlyingAsset));
  }

  /**
   * @dev Transfers the underlying asset to receiver.
   * @param receiver The recipient of the underlying asset
   * @param amount The amount getting transferred
   * @return The amount transferred
   **/
  function transferUnderlyingTo(address receiver, uint256 amount)
    external
    override
    onlyMoneyPool
    returns (uint256)
  {
    IERC20(_underlyingAsset).safeTransfer(receiver, amount);
    return amount;
  }

  /**
   * @dev Transfers LToken
   * @param from The from address
   * @param to The recipient of LToken
   * @param amount The amount getting transferred, but actual amount is implicit balance
   * @param validate If true, validate and finalize transfer
   **/
  function _transfer(
    address from,
    address to,
    uint256 amount,
    bool validate
  ) internal {
    uint256 index = _moneyPool.getLTokenInterestIndex(_underlyingAsset);

    super._transfer(from, to, amount.rayDiv(index));
  }

  /**
   * @dev Overriding ERC20 _transfer for reflecting implicit balance
   * @param from The from address
   * @param to The recipient of LToken
   * @param amount The amount getting transferred
   **/
  function _transfer(
    address from,
    address to,
    uint256 amount
  ) internal override {
    _transfer(from, to, amount, true);
  }

  /**
   * @dev Returns the address of the underlying asset of this aToken (E.g. WETH for aWETH)
   **/
  function getUnderlyingAsset() external view override returns (address) {
    return _underlyingAsset;
  }

  modifier onlyMoneyPool {
    if (_msgSender() != address(_moneyPool)) revert TokenErrors.OnlyMoneyPool();
    _;
  }
}
