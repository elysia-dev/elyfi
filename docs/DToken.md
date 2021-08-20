The DToken balance of borrower is the amount of money that the borrower
would be required to repay and seize the collateralized asset bond token.




## Functions
### constructor
```solidity
  function constructor(
  ) public
```




### name
```solidity
  function name(
  ) public returns (string)
```

Returns the name of the token.


### symbol
```solidity
  function symbol(
  ) public returns (string)
```

Returns the symbol of the token, usually a shorter version of the
name.


### decimals
```solidity
  function decimals(
  ) public returns (uint8)
```

Returns the decimals of the token.


### transfer
```solidity
  function transfer(
  ) public returns (bool)
```




### transferFrom
```solidity
  function transferFrom(
  ) public returns (bool)
```




### allowance
```solidity
  function allowance(
  ) public returns (uint256)
```




### approve
```solidity
  function approve(
  ) public returns (bool)
```




### getTotalAverageRealAssetBorrowRate
```solidity
  function getTotalAverageRealAssetBorrowRate(
  ) external returns (uint256)
```

Returns the average stable rate across all the stable rate debt


#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`the`|  | average stable rate

### getUserLastUpdateTimestamp
```solidity
  function getUserLastUpdateTimestamp(
  ) external returns (uint256)
```

Returns the timestamp of the last account action


#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`The`| address | last update timestamp

### getUserAverageRealAssetBorrowRate
```solidity
  function getUserAverageRealAssetBorrowRate(
    address account
  ) external returns (uint256)
```

Returns the stable rate of the account

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`account` | address | The address of the account

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`The`| address | stable rate of account

### balanceOf
```solidity
  function balanceOf(
  ) public returns (uint256)
```

Calculates the current account debt balance


#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`The`| address | accumulated debt of the account

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
-  Only callable by the LendingPool
- The resulting rate is the weighted average between the rate of the new debt
and the rate of the principal debt

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

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`account` | address | The address of the account getting his debt burned
|`amount` | uint256 | The amount of debt tokens getting burned


### _calculateBalanceIncrease
```solidity
  function _calculateBalanceIncrease(
    address account
  ) internal returns (uint256, uint256, uint256)
```

Calculates the increase in balance since the last account interaction

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`account` | address | The address of the account for which the interest is being accumulated

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`The`| address | principal principal balance, the new principal balance and the balance increase

### getDTokenData
```solidity
  function getDTokenData(
  ) public returns (uint256, uint256, uint256, uint256)
```

Returns the principal and total supply, the average borrow rate and the last supply update timestamp



### getTotalSupplyAndAvgRate
```solidity
  function getTotalSupplyAndAvgRate(
  ) public returns (uint256, uint256)
```

Returns the the total supply and the average stable rate



### totalSupply
```solidity
  function totalSupply(
  ) public returns (uint256)
```

Returns the total supply



### getTotalSupplyLastUpdated
```solidity
  function getTotalSupplyLastUpdated(
  ) public returns (uint256)
```

Returns the timestamp at which the total supply was updated



### principalBalanceOf
```solidity
  function principalBalanceOf(
    address account
  ) external returns (uint256)
```

Returns the principal debt balance of the account from

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`account` | address | The account's address

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`The`| address | debt balance of the account since the last burn/mint action

### POOL
```solidity
  function POOL(
  ) public returns (contract IMoneyPool)
```

Returns the address of the lending pool where this aToken is used



### _getMoneyPool
```solidity
  function _getMoneyPool(
  ) internal returns (contract IMoneyPool)
```

For internal usage in the logic of the parent contracts



### _calcTotalSupply
```solidity
  function _calcTotalSupply(
    uint256 avgRate
  ) internal returns (uint256)
```

Calculates the total supply

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`avgRate` | uint256 | The average rate at which the total supply increases

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`The`| uint256 | debt balance of the account since the last burn/mint action

### _mint
```solidity
  function _mint(
    address account,
    uint256 amount
  ) internal
```

Mints stable debt tokens to an account

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`account` | address | The account receiving the debt tokens
|`amount` | uint256 | The amount being minted


### _burn
```solidity
  function _burn(
    address account,
    uint256 amount
  ) internal
```

Burns stable debt tokens of an account

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`account` | address | The account getting his debt burned
|`amount` | uint256 | The amount being burned


