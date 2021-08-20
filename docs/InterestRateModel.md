Interest rates model in ELYFI. ELYFI's interest rates are determined by algorithms.
When borrowing demand increases, borrowing interest and MoneyPool ROI increase,
suppressing excessove borrowing demand and inducing depositors to supply liquidity.
Therefore, ELYFI's interest rates are influenced by the Money Pool `utilizationRatio`.
The Money Pool utilization ratio is a variable representing the current borrowing
and deposit status of the Money Pool. The interest rates of ELYFI exhibits some form of kink.
They sharply change at some defined threshold, `optimalUtilazationRate`.


## Functions
### constructor
```solidity
  function constructor(
    uint256 optimalUtilizationRate,
    uint256 borrowRateBase,
    uint256 borrowRateOptimal,
    uint256 borrowRateMax
  ) public
```


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`optimalUtilizationRate` | uint256 | When the MoneyPool utilization ratio exceeds this parameter,
`optimalUtilizationRate`, the kinked rates model adjusts interests.
|`borrowRateBase` | uint256 | The base interest rate.
|`borrowRateOptimal` | uint256 | Interest rate when the Money Pool utilization ratio is optimal
|`borrowRateMax` | uint256 | Interest rate when the Money Pool utilization ratio is 1

### calculateRates
```solidity
  function calculateRates(
    uint256 lTokenAssetBalance,
    uint256 totalDTokenBalance,
    uint256 depositAmount,
    uint256 borrowAmount,
    uint256 moneyPoolFactor
  ) public returns (uint256, uint256)
```
Calculates the interest rates.

Calculation Example
Case1: under optimal U
baseRate = 2%, util = 40%, optimalRate = 10%, optimalUtil = 80%
result = 2+40*(10-2)/80 = 4%
Case2: over optimal U
optimalRate = 10%, util = 90%, maxRate = 100%, optimalUtil = 80%
result = 10+(90-80)*(100-10)/(100-80) = 55%

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`lTokenAssetBalance` | uint256 | Total deposit amount
|`totalDTokenBalance` | uint256 | total loan amount
|`depositAmount` | uint256 | The liquidity added during the operation
|`borrowAmount` | uint256 | The liquidity taken during the operation
|`moneyPoolFactor` | uint256 | The moneypool factor. ununsed variable in version 1

