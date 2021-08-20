
The data pipeline contract is to help integrating the data of user and reserve in ELYFI.
Each reserve has a seperate data pipeline.

## Functions
### constructor
```solidity
  function constructor(
  ) public
```




### getUserData
```solidity
  function getUserData(
    address asset,
    address user
  ) external returns (struct DataPipeline.UserDataLocalVars)
```

Returns the user's data for asset.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`asset` | address | The address of the underlying asset of the reserve
|`user` | address | The address of the user

### getReserveData
```solidity
  function getReserveData(
    address asset
  ) external returns (struct DataPipeline.ReserveDataLocalVars)
```

Returns the reserve's data for asset.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`asset` | address | The address of the underlying asset of the reserve

### getAssetBondStateData
```solidity
  function getAssetBondStateData(
    address asset,
    uint256 tokenId
  ) external returns (struct DataPipeline.AssetBondStateDataLocalVars)
```

Return the asset bond data

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`asset` | address | The address of the underlying asset of the reserve
|`tokenId` | uint256 | The id of the token

