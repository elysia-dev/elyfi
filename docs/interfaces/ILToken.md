


## Functions
### mint
```solidity
  function mint(
  ) external
```




### burn
```solidity
  function burn(
    address account,
    address receiver,
    uint256 amount,
    uint256 index
  ) external
```

Burns lTokens account `account` and sends the equivalent amount of underlying to `receiver`

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`account` | address | The owner of the lTokens, getting them burned
|`receiver` | address | The address that will receive the underlying
|`amount` | uint256 | The amount being burned
|`index` | uint256 | The new liquidity index of the reserve


### getUnderlyingAsset
```solidity
  function getUnderlyingAsset(
  ) external returns (address)
```

Returns the address of the underlying asset of this LTokens (E.g. WETH for aWETH)



### implicitBalanceOf
```solidity
  function implicitBalanceOf(
  ) external returns (uint256)
```




### implicitTotalSupply
```solidity
  function implicitTotalSupply(
  ) external returns (uint256)
```




### transferUnderlyingTo
```solidity
  function transferUnderlyingTo(
  ) external
```




### updateIncentivePool
```solidity
  function updateIncentivePool(
  ) external
```




## Events
### Mint
```solidity
  event Mint(
    address account,
    uint256 amount,
    uint256 index
  )
```

Emitted after lTokens are minted

#### Parameters:
| Name                           | Type          | Description                                    |
| :----------------------------- | :------------ | :--------------------------------------------- |
|`account`| address | The receiver of minted lToken
|`amount`| uint256 | The amount being minted
|`index`| uint256 | The new liquidity index of the reserve

### Burn
```solidity
  event Burn(
    address account,
    address underlyingAssetReceiver,
    uint256 amount,
    uint256 index
  )
```

Emitted after lTokens are burned

#### Parameters:
| Name                           | Type          | Description                                    |
| :----------------------------- | :------------ | :--------------------------------------------- |
|`account`| address | The owner of the lTokens, getting them burned
|`underlyingAssetReceiver`| address | The address that will receive the underlying asset
|`amount`| uint256 | The amount being burned
|`index`| uint256 | The new liquidity index of the reserve

### BalanceTransfer
```solidity
  event BalanceTransfer(
    address account,
    address to,
    uint256 amount,
    uint256 index
  )
```

Emitted during the transfer action

#### Parameters:
| Name                           | Type          | Description                                    |
| :----------------------------- | :------------ | :--------------------------------------------- |
|`account`| address | The account whose tokens are being transferred
|`to`| address | The recipient
|`amount`| uint256 | The amount being transferred
|`index`| uint256 | The new liquidity index of the reserve

