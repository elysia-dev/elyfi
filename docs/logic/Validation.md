


## Functions
### validateDeposit
```solidity
  function validateDeposit(
    struct DataStruct.ReserveData reserve,
    uint256 amount
  ) public
```

Validate Deposit
Check reserve state

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`reserve` | struct DataStruct.ReserveData | The reserve object
|`amount` | uint256 | Deposit amount


### validateWithdraw
```solidity
  function validateWithdraw(
    struct DataStruct.ReserveData reserve,
    address amount
  ) public
```

Validate Withdraw
Check reserve state
Check user amount
Check user total debt(later)

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`reserve` | struct DataStruct.ReserveData | The reserve object
|`amount` | address | Withdraw amount


### validateBorrow
```solidity
  function validateBorrow(
  ) public
```




### validateLTokenTrasfer
```solidity
  function validateLTokenTrasfer(
  ) internal
```




### validateRepay
```solidity
  function validateRepay(
  ) public
```




### validateLiquidation
```solidity
  function validateLiquidation(
  ) public
```




### validateSignAssetBond
```solidity
  function validateSignAssetBond(
  ) public
```




### validateSettleAssetBond
```solidity
  function validateSettleAssetBond(
  ) public
```




### validateTokenId
```solidity
  function validateTokenId(
  ) internal
```




