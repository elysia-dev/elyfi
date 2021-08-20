Asset bond token is a type of token that records information about real asset-backed bonds
and acts as bonds on-chain. It complies with the NFT standard, ERC721 and this token can be deposited
in the Money Pool to execute a loan contract.



## Functions
### constructor
```solidity
  function constructor(
  ) public
```




### getAssetBondData
```solidity
  function getAssetBondData(
    uint256 tokenId
  ) external returns (struct DataStruct.AssetBondData)
```
Returns the state of the asset bond

The state of the asset bond is `LIQUIDATED` when the current timestamp is greater than
liquidation timestamp.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`tokenId` | uint256 | The asset bond tokenId

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`The`| uint256 | data struct of the asset bond

### getAssetBondDebtData
```solidity
  function getAssetBondDebtData(
    uint256 tokenId
  ) external returns (uint256, uint256)
```
When the borrower takes a loan, the repayment is the sum of two types of amounts:
debt on the money pool and fee on the collateral service provider. The former is the amount to be
repaid to the moneypool, and the latter is the amount to be paid to collateral service provider as a fee.

Returns the state debt of the asset bond

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`tokenId` | uint256 | The id of the asset bond

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`Accrued`| uint256 | debt on the moneypool and the fee on the collateral service provider.

### getMinter
```solidity
  function getMinter(
  ) external returns (address)
```




### getAssetBondIdData
```solidity
  function getAssetBondIdData(
  ) external returns (struct DataStruct.AssetBondIdData)
```




### mintAssetBond
```solidity
  function mintAssetBond(
    address account,
    uint256 tokenId
  ) external
```
This function can be called by collateral service providers when they want to sign a contract.
Borrowers who wants to take out a loan backed by real asset must enter into a contract
with a collateral service provider to obtain a loan. Borrowers should submit various documents necessary
for evaluating a loan secured by real assets to the collateral service provider.


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`account` | address | CollateralServiceProvider address
|`tokenId` | uint256 | Unique identifier for asset bond.

### settleAssetBond
```solidity
  function settleAssetBond(
    address borrower,
    address signer,
    uint256 tokenId,
    uint256 principal,
    uint256 couponRate,
    uint256 delinquencyRate,
    uint256 debtCeiling,
    uint16 loanDuration,
    uint16 loanStartTimeYear,
    uint8 loanStartTimeMonth,
    uint8 loanStartTimeDay,
    string ipfsHash
  ) external
```
This function is called after collateral service provider based on the documents submitted by the loan applicant,
risk analysis for the relevant asset is conducted, and the loan availability, maximum loanable amount and the interest
rate between collateral service provider and borrower are calculated.


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`borrower` | address | The address of the borrower who must repay and retrieve the asset bond
|`signer` | address | A third-party agency address that reviews entities listed on the asset bond data
|`tokenId` | uint256 | Token id to settle
|`principal` | uint256 | The borrow amount based on the contract between collateral service provider and borrower in reality
|`couponRate` | uint256 | The coupon rate of the bond
|`delinquencyRate` | uint256 | The overdue interest rate of the bond. After the loan duration, the borrower
|`debtCeiling` | uint256 | DebtCeiling, the available value of collateral asset when liquidated
|`loanDuration` | uint16 | LoanDuration
|`loanStartTimeYear` | uint16 | LoanStartTimeYear
|`loanStartTimeMonth` | uint8 | LoanStartTimeMonth
|`loanStartTimeDay` | uint8 | LoanStartTimeDay
|`ipfsHash` | string | IpfsHash which contract and collateral data stored
   The interest rate paid on a bond by its issuer for the term of the security

### signAssetBond
```solidity
  function signAssetBond(
    uint256 tokenId,
    string signerOpinionHash
  ) external
```
When the collateral service provider settled the informations based on the real world contract
in asset bond token, the third party connector such as lawfrim should review this and sign it.
The object for this process is to build trust in the token issuance in ELYFI.
This final verification process is carried out by reliable parties such as lawfirm.
The review is following four items.
Determination of the authenticity of collateral security details entered in real estate registration
Determination of the authenticity of the contract between a real estate owner and a collateral service provider
Determination of the value of principal and interest through certificates of seal impressions
of real estate owners and lenders
Determination of whether the important information entered in smart contracts match the contract content
This allows the asset bond tokens to be recognized as collateral on the blockchain.


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`tokenId` | uint256 | The token Id to release
|`signerOpinionHash` | string | The signer can upload their opinion as a form of official documents on IPFS server.

### collateralizeAssetBond
```solidity
  function collateralizeAssetBond(
    address account,
    uint256 tokenId,
    uint256 borrowAmount,
    uint256 interestRate
  ) external
```
The collateral service provider can take out a loan of value equivalent to the collateral
recored in asset bond tokens. The asset bond tokens are automatically transferred to the MoneyPool
by internal function of `borrow` function.

The collateralizing asset bond token should be only from the MoneyPool.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`account` | address | The owner of asset bond token
|`tokenId` | uint256 | The token Id to collateralize
|`borrowAmount` | uint256 | The borrow amount.
|`interestRate` | uint256 | The interest rate of the loan between MoneyPool and borrower.

### releaseAssetBond
```solidity
  function releaseAssetBond(
    address account,
    uint256 tokenId
  ) external
```
In the repayment scenario, the dTokens are destroyed and the collateral of the locked up
asset bond tokens in the MoneyPool is unlocked. The asset bond tokens are transfered to the
address of the borrower for terminating the collateral contract.

The releasing asset bond token should be only from the MoneyPool.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`account` | address | The borrower
|`tokenId` | uint256 | The token Id to release

### liquidateAssetBond
```solidity
  function liquidateAssetBond(
    address account,
    uint256 tokenId
  ) external
```
In the liquidation scenario, the dTokens are burned and the collateral of the locked up
asset bond tokens in the MoneyPool is transferred to liquidator.

The liquidating asset bond token should be only from the MoneyPool.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`account` | address | The liquidator
|`tokenId` | uint256 | The token Id to release

