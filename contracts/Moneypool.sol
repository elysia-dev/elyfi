// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "./interfaces/ILToken.sol";
import "./interfaces/IDToken.sol";
import "./interfaces/IMoneyPool.sol";
import "./MoneyPoolStorage.sol";
import "./logic/Index.sol";
import "./libraries/DataStruct.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

contract MoneyPool is IMoneyPool, MoneyPoolStorage  {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using Index for DataStruct.ReserveData;

    function initialize(
        uint256 maxReserveCount_
    ) public initializer {
        _maxReserveCount = maxReserveCount_;
        _reserveCount +=1;
    }

    function invest(
        address asset,
        address account,
        uint256 amount
    ) external override returns (bool) {
        DataStruct.ReserveData storage reserve = _reserves[asset];

        address lToken = reserve.lTokenAddress;

        // validation

        // update indexes and mintToReserve
        reserve.updateState();

        // Mint ltoken
        ILToken(lToken).mint(account, amount, reserve.lTokenInterestIndex);

        // transfer underlying asset
        IERC20Upgradeable(asset).transferFrom(msg.sender, lToken, amount);
    }

    function getLTokenInterestIndex(address asset)
        external
        view
        override
        returns (uint256) {
            return _reserves[asset].getLTokenInterestIndex();
        }

    // Need access control, onlyConfigurator can add new reserve.
    function addNewReserve(
        address asset,
        address lToken,
        address dToken,
        address interestModel
    ) external override {

        DataStruct.ReserveData memory newReserveData =
            DataStruct.ReserveData({
                lTokenInterestIndex: WadRayMath.ray(),
                dTokenInterestIndex: WadRayMath.ray(),
                realAssetAPR: 0,
                digitalAssetAPR: 0,
                supplyAPR: 0,
                lastUpdateTimestamp: uint40(block.timestamp),
                lTokenAddress: lToken,
                dTokenAddress: dToken,
                interestModelAddress: interestModel,
                id: 0
            });

        _reserves[asset] = newReserveData;
        _addNewReserveToList(asset);
    }

    function _addNewReserveToList(address asset) internal {
        uint256 reserveCount = _reserveCount;

        if (reserveCount >= _maxReserveCount) revert(); ////MaxReserveCountExceeded();

        if (_reserves[asset].id != 0 ) revert(); ////DigitalAssetAlreadyAdded(address asset);

        _reserves[asset].id = uint8(reserveCount);
        _reservesList[reserveCount] = asset;

        _reserveCount = reserveCount + 1;
    }
}