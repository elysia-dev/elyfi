// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';

/**
 * @title ELYFI InterestRateModel
 * @author ELYSIA
 */
contract InterestRateModelStorage is Initializable {
  uint256 internal _optimalUtilizationRate;

  uint256 internal _borrowRateBase;

  uint256 internal _borrowRateOptimal;

  uint256 internal _borrowRateMax;
}
