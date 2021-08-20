


## Functions
### constructor
```solidity
  function constructor(
  ) public
```




### initializeIncentivePool
```solidity
  function initializeIncentivePool(
  ) external
```




### isClosed
```solidity
  function isClosed(
  ) public returns (bool)
```




### updateIncentivePool
```solidity
  function updateIncentivePool(
  ) external
```
Update user incentive index and last update timestamp in minting or burining lTokens.



### beforeTokenTransfer
```solidity
  function beforeTokenTransfer(
  ) external
```
If user transfered lToken, accrued reward will be updated
and user index will be set to the current index



### claimIncentive
```solidity
  function claimIncentive(
  ) external
```




### getIncentiveIndex
```solidity
  function getIncentiveIndex(
  ) public returns (uint256)
```




### getUserIncentive
```solidity
  function getUserIncentive(
  ) public returns (uint256)
```




### getUserIncentiveData
```solidity
  function getUserIncentiveData(
  ) public returns (uint256 userIndex, uint256 userReward, uint256 userLTokenBalance)
```




### getIncentivePoolData
```solidity
  function getIncentivePoolData(
  ) public returns (uint256 incentiveIndex, uint256 lastUpdateTimestamp)
```




### withdrawResidue
```solidity
  function withdrawResidue(
  ) external
```




