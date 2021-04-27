// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title ELYFI InterestRateModel
 * @author ELYSIA
 */
contract InterestRateModelStorage is Initializable {
    uint256 internal _optimalDigitalAssetUtilizationRate;

    uint256 internal _optimalRealAssetUtilizationRate;

    uint256 internal _digitalAssetBorrowRateBase;

    uint256 internal _digitalAssetBorrowRateOptimal;

    uint256 internal _digitalAssetBorrowRateMax;

    uint256 internal _realAssetBorrowRateBase;

    uint256 internal _realAssetBorrowRateOptimal;

    uint256 internal _realAssetBorrowRateMax;
}