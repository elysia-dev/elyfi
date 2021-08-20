LTokens are the basis for repayment of loans and interest on their deposits. When Money Pool
investors deposit or withdraw assets from the Money Pool Contract, the Smart Contract automatically
issues or destroys LTokens accordingly.

LTokens comply with the ERC20 token standard. Some functions are restricted to the general user.

## Functions
### constructor
```solidity
  function constructor(
  ) public
```




### mint
```solidity
  function mint(
  ) external
```




### burn
```solidity
  function burn(
  ) external
```




### balanceOf
```solidity
  function balanceOf(
  ) public returns (uint256)
```



#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`Returns`| address | implicit balance multipied by ltoken interest index

### implicitBalanceOf
```solidity
  function implicitBalanceOf(
  ) external returns (uint256)
```




### implicitTotalSupply
```solidity
  function implicitTotalSupply(
  ) public returns (uint256)
```




### totalSupply
```solidity
  function totalSupply(
  ) public returns (uint256)
```




### transferUnderlyingTo
```solidity
  function transferUnderlyingTo(
    address receiver,
    uint256 amount
  ) external
```

Transfers the underlying asset to receiver.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`receiver` | address | The recipient of the underlying asset
|`amount` | uint256 | The amount getting transferred


### _transfer
```solidity
  function _transfer(
    address from,
    address to,
    uint256 amount,
    bool validate
  ) internal
```

Transfers LToken

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`from` | address | The from address
|`to` | address | The recipient of LToken
|`amount` | uint256 | The amount getting transferred, but actual amount is implicit balance
|`validate` | bool | If true, validate and finalize transfer


### _transfer
```solidity
  function _transfer(
    address from,
    address to,
    uint256 amount
  ) internal
```

Overriding ERC20 _transfer for reflecting implicit balance

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`from` | address | The from address
|`to` | address | The recipient of LToken
|`amount` | uint256 | The amount getting transferred


### getUnderlyingAsset
```solidity
  function getUnderlyingAsset(
  ) external returns (address)
```

Returns the address of the underlying asset of this aToken (E.g. WETH for aWETH)



### updateIncentivePool
```solidity
  function updateIncentivePool(
  ) external
```




