


## Functions
### mintAssetBond
```solidity
  function mintAssetBond(
  ) external
```




### collateralizeAssetBond
```solidity
  function collateralizeAssetBond(
  ) external
```




### releaseAssetBond
```solidity
  function releaseAssetBond(
  ) external
```




### liquidateAssetBond
```solidity
  function liquidateAssetBond(
  ) external
```




### getAssetBondIdData
```solidity
  function getAssetBondIdData(
  ) external returns (struct DataStruct.AssetBondIdData)
```




### getAssetBondData
```solidity
  function getAssetBondData(
  ) external returns (struct DataStruct.AssetBondData)
```




### getAssetBondDebtData
```solidity
  function getAssetBondDebtData(
  ) external returns (uint256, uint256)
```




### getMinter
```solidity
  function getMinter(
  ) external returns (address)
```




## Events
### EmptyAssetBondMinted
```solidity
  event EmptyAssetBondMinted(
    address account,
    uint256 tokenId
  )
```
Emitted when a collateral service provider mints an empty asset bond token.


#### Parameters:
| Name                           | Type          | Description                                    |
| :----------------------------- | :------------ | :--------------------------------------------- |
|`account`| address | The address of collateral service provider who minted
|`tokenId`| uint256 | The id of minted token

### AssetBondSettled
```solidity
  event AssetBondSettled(
  )
```
Emitted when a collateral service provider mints an empty asset bond token.



### AssetBondSigned
```solidity
  event AssetBondSigned(
  )
```



### AssetBondCollateralized
```solidity
  event AssetBondCollateralized(
  )
```



### AssetBondReleased
```solidity
  event AssetBondReleased(
  )
```



### AssetBondLiquidated
```solidity
  event AssetBondLiquidated(
  )
```



