ELYFI functions through continual interaction among the various participants.
In order to link the real assets and the blockchain, unlike the existing DeFi platform,
ELYFI has a group of participants in charge of actual legal contracts and maintenance.
1. Collateral service providers are a group of users who sign a collateral contract with
a borrower who takes out a real asset-backed loan and borrows cryptocurrencies from the
Money Pool based on this contract.
2. The council, such as legal service provider is a corporation that provides
legal services such as document review in the context of legal proceedings, consulting,
and the provision of documents necessary in the process of taking out loans secured by real assets,
In the future, the types of participant groups will be diversified and subdivided.

Only admin can add or revoke roles of the ELYFI. The admin account of the connector is strictly
managed, and it is to be managed by governance of ELYFI.

## Functions
### addCouncil
```solidity
  function addCouncil(
  ) external
```




### addCollateralServiceProvider
```solidity
  function addCollateralServiceProvider(
  ) external
```




### revokeCouncil
```solidity
  function revokeCouncil(
  ) external
```




### revokeCollateralServiceProvider
```solidity
  function revokeCollateralServiceProvider(
  ) external
```




### _grantRole
```solidity
  function _grantRole(
  ) internal
```




### _revokeRole
```solidity
  function _revokeRole(
  ) internal
```




### _hasRole
```solidity
  function _hasRole(
  ) internal returns (bool)
```




### isCollateralServiceProvider
```solidity
  function isCollateralServiceProvider(
  ) external returns (bool)
```




### isCouncil
```solidity
  function isCouncil(
  ) external returns (bool)
```




### isMoneyPoolAdmin
```solidity
  function isMoneyPoolAdmin(
  ) external returns (bool)
```




