


## Functions
### getLTokenInterestIndex
```solidity
  function getLTokenInterestIndex(
    struct DataStruct.ReserveData reserve
  ) public returns (uint256)
```

Returns the ongoing normalized income for the reserve
A value of 1e27 means there is no income. As time passes, the income is accrued
A value of 2*1e27 means for each unit of asset one unit of income has been accrued

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`reserve` | struct DataStruct.ReserveData | The reserve object

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`the`| struct DataStruct.ReserveData | normalized income. expressed in ray

### updateState
```solidity
  function updateState(
    struct DataStruct.ReserveData reserve
  ) internal
```

Updates the reserve indexes and the timestamp

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`reserve` | struct DataStruct.ReserveData | The reserve to be updated


## Events
### LTokenIndexUpdated
```solidity
  event LTokenIndexUpdated(
  )
```



