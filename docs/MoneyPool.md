This is the first version of ELYFI. ELYFI has various contract interactions centered
on the Money Pool Contract. Several tokens are issued or destroyed to indicate the status of
participants, and all issuance and burn processes are carried out through the Money Pool Contract.
The depositor and borrower should approve the ELYFI moneypool contract to move their AssetBond token
or ERC20 tokens on their behalf.

Only admin can modify the variables and state of the moneypool.


## Functions
### constructor
```solidity
  function constructor(
  ) public
```




### deposit
```solidity
  function deposit(
    address asset,
    address account,
    uint256 amount
  ) external
```
By depositing virtual assets in the MoneyPool and supply liquidity, depositors can receive
interest accruing from the MoneyPool.The return on the deposit arises from the interest on real asset
backed loans. MoneyPool depositors who deposit certain cryptoassets receives LTokens equivalent to
the deposit amount. LTokens are backed by cryptoassets deposited in the MoneyPool in a 1:1 ratio.

Deposits an amount of underlying asset and receive corresponding LTokens.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`asset` | address | The address of the underlying asset to deposit
|`account` | address | The address that will receive the LToken
|`amount` | uint256 | Deposit amount


### withdraw
```solidity
  function withdraw(
    address asset,
    address account,
    uint256 amount
  ) external
```
The depositors can seize their virtual assets deposited in the MoneyPool whenever they wish.

Withdraws an amount of underlying asset from the reserve and burns the corresponding lTokens.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`asset` | address | The address of the underlying asset to withdraw
|`account` | address | The address that will receive the underlying asset
|`amount` | uint256 | Withdrawl amount


### borrow
```solidity
  function borrow(
    address asset,
    uint256 tokenId
  ) external
```
The collateral service provider can take out a loan of value equivalent to the principal
recorded in the asset bond data. As asset bonds are deposited as collateral in the Money Pool
and loans are made, financial services that link real assets and cryptoassets can be achieved.

Transfer asset bond from the collateral service provider to the moneypool and mint dTokens
corresponding to principal. After that, transfer the underlying asset

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`asset` | address | The address of the underlying asset to withdraw
|`tokenId` | uint256 | The id of the token to collateralize


### repay
```solidity
  function repay(
    address asset,
    uint256 tokenId
  ) external
```
repays an amount of underlying asset from the reserve and burns the corresponding lTokens.

Transfer total repayment of the underlying asset from msg.sender to the moneypool and
burn the corresponding amount of dTokens. Then release the asset bond token which is locked
in the moneypool and transfer it to the borrower. The total amount of transferred underlying asset
is the sum of the fee on the collateral service provider and debt on the moneypool

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`asset` | address | The address of the underlying asset to repay
|`tokenId` | uint256 | The id of the token to retrieve


### liquidate
```solidity
  function liquidate(
    address asset,
    uint256 tokenId
  ) external
```
Liquidate a non performed asset bond and retrieve asset bond token. The caller must be
the collateral service provider,

Transfer liquidation amount of the underlying asset from msg.sender to the moneypool and
burn the corresponding amount of dTokens. Then release the asset bond token which is locked in the
moneypool and transfer it to the liquidator. The total amount of transferred underlying asset is
the sum of the fee on the collateral service provider and debt on the moneypool. The fee on the
collateral service provider is paid as a form of minted corresponding lToken

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`asset` | address | The address of the underlying asset to liquidate
|`tokenId` | uint256 | The id of the token to liquidate


### getLTokenInterestIndex
```solidity
  function getLTokenInterestIndex(
    address asset
  ) external returns (uint256)
```
LToken Index is an indicator of interest occurring and accrued to liquidity providers
who have provided liquidity to the Money Pool. LToken Index is calculated every time user activities
occur in the Money Pool, such as loans and repayments by Money Pool participants.


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`asset` | address | The address of the underlying asset of the reserve

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`The`| address | LToken interest index of reserve
### getReserveData
```solidity
  function getReserveData(
    address asset
  ) external returns (struct DataStruct.ReserveData)
```

Returns the reserveData struct of underlying asset

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`asset` | address | The address of the underlying asset of the reserve

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`The`| address | state struct of the reserve

### addNewReserve
```solidity
  function addNewReserve(
    address asset,
    address lToken,
    address dToken,
    address interestModel,
    address tokenizer,
    address incentivePool,
    uint256 moneyPoolFactor_
  ) external
```
Initializes a new reserve and assign lToken, dToken, interestModel, tokenizer
and incentive pool.

Only admin can add new reserve. In the elyfi version 1, the initiation
of the new reserve will be in the limited circumstances.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`asset` | address | The address of the underlying asset of the reserve
|`lToken` | address | The address of the lToken of the reserve
|`dToken` | address | The address of the dToken of the reserve
|`interestModel` | address | The address of interestModel of the reserve
|`tokenizer` | address | The address of the tokenizer of the reserve
|`incentivePool` | address | The address of the incentivePool of the reserve
|`moneyPoolFactor_` | uint256 | The address of the moneyPoolFactor of the reserve


### _addNewReserveToList
```solidity
  function _addNewReserveToList(
  ) internal
```




### deactivateMoneyPool
```solidity
  function deactivateMoneyPool(
    address asset
  ) external
```
Set the isActivated state of a reserve

Only moneypool admin can deactivate the reserve

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`asset` | address | The address of the underlying asset of the reserve


### activateMoneyPool
```solidity
  function activateMoneyPool(
    address asset
  ) external
```
Set the isActivated state of a reserve

Only moneypool admin can activate the reserve

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`asset` | address | The address of the underlying asset of the reserve


### pauseMoneyPool
```solidity
  function pauseMoneyPool(
    address asset
  ) external
```
Set the isPaused state of a reserve

Only moneypool admin can pause the reserve

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`asset` | address | The address of the underlying asset of the reserve


### unPauseMoneyPool
```solidity
  function unPauseMoneyPool(
    address asset
  ) external
```
Set the isPaused state of a reserve

Only moneypool admin can uppause the reserve

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`asset` | address | The address of the underlying asset of the reserve


### updateIncentivePool
```solidity
  function updateIncentivePool(
    address asset,
    address newIncentivePool
  ) external
```
Update the incentive of the reserve

Only moneypool admin can update the incentive pool

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`asset` | address | The address of the underlying asset of the reserve
|`newIncentivePool` | address | The address of the new incentivepool of the reserve


