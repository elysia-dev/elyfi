// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "./InterestRateModelStorage.sol";

/**
 * @title ELYFI InterestRateModel
 * @author ELYSIA
 */
contract InterestRateModel is InterestRateModelStorage {
    constructor(
        uint256 optimalDigitalAssetUtilizationRate,
        uint256 optimalRealAssetUtilizationRate,
        uint256 digitalAssetBorrowRateBase,
        uint256 digitalAssetBorrowRateOptimal,
        uint256 digitalAssetBorrowRateMax,
        uint256 realAssetBorrowRateBase,
        uint256 realAssetBorrowRateOptimal,
        uint256 realAssetBorrowRateMax
    ) {
        optimalDigitalAssetUtilizationRate = _optimalDigitalAssetUtilizationRate;
        optimalRealAssetUtilizationRate = _optimalRealAssetUtilizationRate;
        digitalAssetBorrowRateBase = _digitalAssetBorrowRateBase;
        digitalAssetBorrowRateOptimal = _digitalAssetBorrowRateOptimal;
        digitalAssetBorrowRateMax = _digitalAssetBorrowRateMax;
        realAssetBorrowRateBase = _realAssetBorrowRateBase;
        realAssetBorrowRateOptimal = _realAssetBorrowRateOptimal;
        realAssetBorrowRateMax = _realAssetBorrowRateMax;
    }
}
