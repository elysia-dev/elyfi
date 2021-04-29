// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "./interfaces/ILToken.sol";
import "./interfaces/IDToken.sol";
import "./interfaces/IMoneyPool.sol";
import "./interfaces/ITokenizer.sol";
import "./MoneyPoolStorage.sol";
import "./logic/Index.sol";
import "./logic/Rate.sol";
import "./libraries/DataStruct.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

contract MoneyPool is IMoneyPool, MoneyPoolStorage {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using Index for DataStruct.ReserveData;
    using Rate for DataStruct.ReserveData;

    function initialize(uint256 maxReserveCount_) public initializer {
        _maxReserveCount = maxReserveCount_;
        _reserveCount += 1;
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
        reserve.updateRates(asset, lToken, amount, 0);

        // Mint ltoken
        ILToken(lToken).mint(account, amount, reserve.lTokenInterestIndex);

        // transfer underlying asset
        IERC20Upgradeable(asset).safeTransferFrom(msg.sender, lToken, amount);

        emit Invest(asset, account, amount);
    }

    function withdraw(
        address asset,
        address account,
        uint256 amount
    ) external override returns (uint256) {
        DataStruct.ReserveData storage reserve = _reserves[asset];

        address lToken = reserve.lTokenAddress;

        uint256 accountBalance = ILToken(lToken).balanceOf(msg.sender);

        uint256 amountToWithdraw = amount;

        if (amount == type(uint256).max) {
            amountToWithdraw == accountBalance;
        }

        // validation

        // update indexes and mintToReserve
        reserve.updateState();
        reserve.updateRates(asset, lToken, amount, 0);

        // Burn ltoken
        ILToken(lToken).burn(msg.sender, account, amount, reserve.lTokenInterestIndex);

        emit Withdraw(asset, msg.sender, account, amountToWithdraw);
    }



    function getLTokenInterestIndex(address asset)
        external
        view
        override
        returns (uint256)
    {
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

        if (_reserves[asset].id != 0) revert(); ////DigitalAssetAlreadyAdded(address asset);

        _reserves[asset].id = uint8(reserveCount);
        _reservesList[reserveCount] = asset;

        _reserveCount = reserveCount + 1;
    }
    
    // should be in MoneyPool
    function depositABToken(
        uint256 realAssetAPR,
        uint256 borrowAmount,
        uint256 id
    ) external {
        ITokenizer(_tokenizer).mintAToken(_moneyPool, amount);

        if (true) revert(); ////error UnverifiedABTokenDeposit(id);

        DataStruct.AssetBondData memory newAssetBond =
            DataStruct.AssetBondData({

            });

        // update indexes and mintToReserve
        reserve.updateState();
        reserve.updateRates(asset, lToken, amount, 0);
        
    }

    /**
     * @dev Returns the state and configuration of the reserve
     * @param asset The address of the underlying asset of the reserve
     * @return The state of the reserve
     **/
    function getReserveData(address asset)
        external
        view
        override
        returns (DataStruct.ReserveData memory)
    {
        return _reserves[asset];
    }
}
