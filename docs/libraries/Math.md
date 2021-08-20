


## Functions
### calculateLinearInterest
```solidity
  function calculateLinearInterest(
  ) internal returns (uint256)
```




### calculateCompoundedInterest
```solidity
  function calculateCompoundedInterest(
    uint256 rate,
    uint256 lastUpdateTimestamp
  ) internal returns (uint256)
```
Author : AAVE

Function to calculate the interest using a compounded interest rate formula
To avoid expensive exponentiation, the calculation is performed using a binomial approximation:
 (1+x)^n = 1+n*x+[n/2*(n-1)]*x^2+[n/6*(n-1)*(n-2)*x^3...

The approximation slightly underpays liquidity providers and undercharges borrowers, with the advantage of great gas cost reductions
The whitepaper contains reference to the approximation and a table showing the margin of error per different time periods


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`rate` | uint256 | The interest rate, in ray
|`lastUpdateTimestamp` | uint256 | The timestamp of the last update of the interest

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`The`| uint256 | interest rate compounded during the timeDelta, in ray

### calculateRateInIncreasingBalance
```solidity
  function calculateRateInIncreasingBalance(
  ) internal returns (uint256, uint256)
```




### calculateRateInDecreasingBalance
```solidity
  function calculateRateInDecreasingBalance(
  ) internal returns (uint256, uint256)
```




