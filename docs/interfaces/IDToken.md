


## Functions
### mint
```solidity
  function mint(
    address account,
    address receiver,
    uint256 amount,
    uint256 rate
  ) external
```

Mints debt token to the `receiver` address.
- The resulting rate is the weighted average between the rate of the new debt
and the rate of the previous debt

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`account` | address | The address receiving the borrowed underlying, being the delegatee in case
of credit delegate, or same as `receiver` otherwise
|`receiver` | address | The address receiving the debt tokens
|`amount` | uint256 | The amount of debt tokens to mint
|`rate` | uint256 | The rate of the debt being minted


### burn
```solidity
  function burn(
    address account,
    uint256 amount
  ) external
```

Burns debt of `account`
- The resulting rate is the weighted average between the rate of the new debt
and the rate of the previous debt

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`account` | address | The address of the account getting his debt burned
|`amount` | uint256 | The amount of debt tokens getting burned


### getTotalAverageRealAssetBorrowRate
```solidity
  function getTotalAverageRealAssetBorrowRate(
  ) external returns (uint256)
```

Returns the average rate of all the stable rate loans.


#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`The`|  | average stable rate

### getUserAverageRealAssetBorrowRate
```solidity
  function getUserAverageRealAssetBorrowRate(
  ) external returns (uint256)
```

Returns the stable rate of the account debt


#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`The`| address | stable rate of the account

### getUserLastUpdateTimestamp
```solidity
  function getUserLastUpdateTimestamp(
  ) external returns (uint256)
```

Returns the timestamp of the last update of the account


#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`The`| address | timestamp

### getDTokenData
```solidity
  function getDTokenData(
  ) external returns (uint256, uint256, uint256, uint256)
```

Returns the principal, the total supply and the average stable rate



### getTotalSupplyLastUpdated
```solidity
  function getTotalSupplyLastUpdated(
  ) external returns (uint256)
```

Returns the timestamp of the last update of the total supply


#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`The`|  | timestamp

### getTotalSupplyAndAvgRate
```solidity
  function getTotalSupplyAndAvgRate(
  ) external returns (uint256, uint256)
```

Returns the total supply and the average stable rate



### principalBalanceOf
```solidity
  function principalBalanceOf(
  ) external returns (uint256)
```

Returns the principal debt balance of the account


#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`The`| address | debt balance of the account since the last burn/mint action

## Events
### Mint
```solidity
  event Mint(
    address account,
    address receiver,
    uint256 amount,
    uint256 currentBalance,
    uint256 balanceIncrease,
    uint256 newRate,
    uint256 avgStableRate,
    uint256 newTotalSupply
  )
```

Emitted when new stable debt is minted

#### Parameters:
| Name                           | Type          | Description                                    |
| :----------------------------- | :------------ | :--------------------------------------------- |
|`account`| address | The address of the account who triggered the minting
|`receiver`| address | The recipient of stable debt tokens
|`amount`| uint256 | The amount minted
|`currentBalance`| uint256 | The current balance of the account
|`balanceIncrease`| uint256 | The increase in balance since the last action of the account
|`newRate`| uint256 | The rate of the debt after the minting
|`avgStableRate`| uint256 | The new average stable rate after the minting
|`newTotalSupply`| uint256 | The new total supply of the stable debt token after the action

### Burn
```solidity
  event Burn(
    address account,
    uint256 amount,
    uint256 currentBalance,
    uint256 balanceIncrease,
    uint256 avgStableRate,
    uint256 newTotalSupply
  )
```

Emitted when new stable debt is burned

#### Parameters:
| Name                           | Type          | Description                                    |
| :----------------------------- | :------------ | :--------------------------------------------- |
|`account`| address | The address of the account
|`amount`| uint256 | The amount being burned
|`currentBalance`| uint256 | The current balance of the account
|`balanceIncrease`| uint256 | The the increase in balance since the last action of the account
|`avgStableRate`| uint256 | The new average stable rate after the burning
|`newTotalSupply`| uint256 | The new total supply of the stable debt token after the action

