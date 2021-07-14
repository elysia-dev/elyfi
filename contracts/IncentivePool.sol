// SPDX-License-Identifier: MIT
pragma solidity 0.8.3;

import './libraries/WadRayMath.sol';
import './interfaces/IIncentivePool.sol';
import './interfaces/IMoneyPool.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract IncentivePool is IIncentivePool {
  using WadRayMath for uint256;

  constructor(
    IMoneyPool moneyPool,
    address incentiveAsset,
    uint256 amountPerSecond
  ) {
    _moneyPool = moneyPool;
    _incentiveAsset = incentiveAsset;
    _amountPerSecond = amountPerSecond;
  }

  bool private _initialized;

  address internal _incentiveAsset;

  IMoneyPool internal _moneyPool;
  // ray : for obviating underflow error
  uint256 internal _amountPerSecond;

  address internal _lToken;

  uint256 internal _incentiveIndex;

  uint256 internal _lastUpdateTimestamp;

  mapping(address => uint256) internal _userIncentiveIndex;

  mapping(address => uint256) internal _accruedIncentive;

  function initializeIncentivePool(address lToken) external override onlyMoneyPool {
    require(!_initialized, 'AlreadyInitialized');
    _initialized = true;
    _lToken = lToken;
  }

  /**
   * @notice Update user incentive index and last update timestamp in minting or burining lTokens.
   */
  function updateIncentivePool(address user) external override onlyLToken {
    _accruedIncentive[user] = getUserIncentiveReward(user);
    _incentiveIndex = _userIncentiveIndex[user] = getIncentiveIndex();
    _lastUpdateTimestamp = block.timestamp;

    emit UpdateIncentivePool(_incentiveIndex);
  }

  /**
   * @notice If user transfered lToken, accrued reward will be updated
   * and user index will be set to the current index
   */
  function beforeTokenTransfer(address from, address to) external override onlyLToken {
    _accruedIncentive[from] = getUserIncentiveReward(from);
    _accruedIncentive[to] = getUserIncentiveReward(to);
    _userIncentiveIndex[from] = _userIncentiveIndex[to] = getIncentiveIndex();
  }

  function claimIncentive(address user) external override {
    uint256 accruedIncentive = getUserIncentiveReward(user);

    IERC20(_incentiveAsset).transfer(user, accruedIncentive);

    _userIncentiveIndex[user] = getIncentiveIndex();

    _accruedIncentive[user] = 0;

    emit ClaimIncentive(user, accruedIncentive);
  }

  function getIncentiveIndex() public view returns (uint256) {
    uint256 timeDiff = block.timestamp - _lastUpdateTimestamp;
    uint256 totalSupply = IERC20(_lToken).totalSupply();

    if (timeDiff == 0) {
      return _incentiveIndex;
    }

    if (totalSupply == 0) {
      return 0;
    }

    uint256 IncentiveIndexDiff = (timeDiff * _amountPerSecond) / totalSupply;

    return _incentiveIndex + IncentiveIndexDiff;
  }

  function getUserIncentiveReward(address user) public view returns (uint256) {
    if (_userIncentiveIndex[user] == 0) {
      return 0;
    }

    uint256 indexDiff = 0;

    if (getIncentiveIndex() >= _userIncentiveIndex[user]) {
      indexDiff = getIncentiveIndex() - _userIncentiveIndex[user];
    }
    uint256 balance = IERC20(_lToken).balanceOf(user);

    uint256 result = _accruedIncentive[user] + (balance * indexDiff) / 1e9;

    return result;
  }

  function getUserIncentiveData(address user)
    public
    view
    returns (
      uint256 userIndex,
      uint256 userReward,
      uint256 userLTokenBalance
    )
  {
    return (
      _userIncentiveIndex[user],
      getUserIncentiveReward(user),
      IERC20(_lToken).balanceOf(user)
    );
  }

  function getIncentivePoolData()
    public
    view
    returns (uint256 incentiveIndex, uint256 lastUpdateTimestamp)
  {
    return (_incentiveIndex, _lastUpdateTimestamp);
  }

  modifier onlyMoneyPool {
    require(msg.sender == address(_moneyPool), 'OnlyMoneyPool');
    _;
  }

  modifier onlyLToken {
    require(msg.sender == address(_lToken), 'OnlyLToken');
    _;
  }
}
