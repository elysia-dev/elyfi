// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "./interfaces/ILToken.sol";
import "./interfaces/IDToken.sol";
import "./interfaces/IMoneyPool.sol";
import "./interfaces/ITokenizer.sol";
import "./MoneyPoolStorage.sol";
import "./logic/Index.sol";
import "./logic/Rate.sol";
import "./logic/AssetBond.sol";
import "./libraries/DataStruct.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

contract MoneyPool is IMoneyPool, MoneyPoolStorage {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using Index for DataStruct.ReserveData;
    using Rate for DataStruct.ReserveData;
    using AssetBond for DataStruct.AssetBondData;

    function initialize(
        uint256 maxReserveCount_,
        address connector
    ) public initializer {
        _connector = connector;
        _maxReserveCount = maxReserveCount_;
        _reserveCount += 1;
    }

    /* MoneyPool Investment Function */

    /**
     * @dev Invests an amount of underlying asset and receive corresponding LTokens.
     * @param asset The address of the underlying asset to invest
     * @param account The address that will receive the LToken
     * @param amount Investment amount
     **/
    function invest(
        address asset,
        address account,
        uint256 amount
    ) external override returns (bool) {
        DataStruct.ReserveData storage reserve = _reserves[asset];

        address lToken = reserve.lTokenAddress;
        address tokenizer = reserve.tokenizerAddress;

        // validation
        // Check pool activation

        // update indexes and mintToReserve
        reserve.updateState();

        // update rates
        reserve.updateRates(asset, tokenizer, amount, 0);

        // transfer underlying asset
        // If transfer fail, reverts
        IERC20Upgradeable(asset).safeTransferFrom(msg.sender, lToken, amount);

        // Mint ltoken
        ILToken(lToken).mint(account, amount, reserve.lTokenInterestIndex);

        emit Invest(asset, account, amount);
    }

    function withdraw(
        address asset,
        address account,
        uint256 amount
    ) external override returns (uint256) {
        DataStruct.ReserveData storage reserve = _reserves[asset];

        address lToken = reserve.lTokenAddress;
        address tokenizer = reserve.tokenizerAddress;

        uint256 accountBalance = ILToken(lToken).balanceOf(msg.sender);

        uint256 amountToWithdraw = amount;

        if (amount == type(uint256).max) {
            amountToWithdraw == accountBalance;
        }

        // validation
        // Without digital asset borrow, validation might be quite simple.

        // update indexes and mintToReserve
        reserve.updateState();

        // update rates
        reserve.updateRates(asset, tokenizer, 0, amount);

        // Burn ltoken
        ILToken(lToken).burn(
            msg.sender,
            account,
            amount,
            reserve.lTokenInterestIndex
        );

        emit Withdraw(asset, msg.sender, account, amountToWithdraw);
    }

    /* View Functions */

    /**
     * @dev Returns LToken Interest index of asset
     * @param asset The address of the underlying asset of the reserve
     * @return The LToken interest index of reserve
     */
    function getLTokenInterestIndex(
        address asset
    ) external view override returns (uint256) {
        return _reserves[asset].getLTokenInterestIndex();
    }

    /**
     * @dev Returns the state and configuration of the reserve
     * @param asset The address of the underlying asset of the reserve
     * @return The state of the reserve
     **/
    function getReserveData(
        address asset
    ) external view override returns (DataStruct.ReserveData memory) {
        return _reserves[asset];
    }

    /* ABToken Formation Functions */

    // Access control : only CO
    function mintABToken(
        address asset,
        address account, // ABToken owner address
        uint256 id // information about Co and borrower
    ) external {
        DataStruct.ReserveData storage reserve = _reserves[asset];

        address tokenizer = reserve.tokenizerAddress;

        // validate Id : Id should have information about minter.
        AssetBond.validateTokenId(id);

        ITokenizer(tokenizer).mintABToken(account, id);
    }

    // Access control : only minter
    function settleABToken(
        address asset,
        address borrower, // borrower address
        address lawfirm, // lawfirm address
        uint256 id, // Token Id
        uint256 collateralValue, // collateralValue in USD
        uint256 dueDate,
        string memory ipfsHash
    ) external {
        _assetBond[id].initAssetBond(
            asset,
            borrower,
            lawfirm,
            collateralValue,
            dueDate,
            ipfsHash
        );
    }

    // need access control signer: only lawfirm or asset owner
    function signABToken(
        uint256 id,
        address signer
        ) external {}

    // need access control : only minter
    function borrowAgainstABToken(
        uint256 borrowAmount,
        uint256 id
    ) external {
        DataStruct.AssetBondData storage assetBond = _assetBond[id];
        DataStruct.ReserveData storage reserve = _reserves[assetBond.asset];

        address lToken = reserve.lTokenAddress;
        address tokenizer = reserve.tokenizerAddress;

        // Check if borrow amount exceeds collateral value
        // Check if borrow amount exceeds liquidity available
        AssetBond.validateBorrowAgainstAssetBond(
            assetBond,
            reserve,
            borrowAmount,
            id
        );

        reserve.updateState();

        // update interest rate
        reserve.updateRates(assetBond.asset, tokenizer, 0, borrowAmount);

        // mintAToken to moneyPool
        ITokenizer(tokenizer).mintAToken(
            address(this),
            id,
            borrowAmount,
            reserve.realAssetAPR
        );

        // transfer asset bond
        // or lock NFT?

        // update deposited asset bond list and count
        // update totalAToken
        // calculate future interest
        (uint256 netAmount, uint256 futureInterest) =
            AssetBond.depositAssetBond(
                assetBond,
                reserve,
                borrowAmount,
                reserve.realAssetAPR
            );

        // transfer Underlying asset
        ILToken(lToken).transferUnderlyingTo(assetBond.borrower, netAmount);
        ILToken(lToken).transferUnderlyingTo(tokenizer, futureInterest);
    }

    // Need access control, onlyConfigurator can add new reserve.
    function addNewReserve(
        address asset,
        address lToken,
        address dToken,
        address interestModel,
        address tokenizer
    ) external override {
        DataStruct.ReserveData memory newReserveData =
            DataStruct.ReserveData({
                lTokenInterestIndex: WadRayMath.ray(),
                dTokenInterestIndex: WadRayMath.ray(),
                realAssetAPR: 0,
                digitalAssetAPR: 0,
                supplyAPR: 0,
                totalDepositedAssetBondCount: 0,
                maturedAssetBondCount: 0,
                totalDepositedATokenBalance: 0,
                lastUpdateTimestamp: uint40(block.timestamp),
                lTokenAddress: lToken,
                dTokenAddress: dToken,
                interestModelAddress: interestModel,
                tokenizerAddress: tokenizer,
                id: 0
            });

        _reserves[asset] = newReserveData;
        _addNewReserveToList(asset);
    }

    function _addNewReserveToList(
        address asset
    ) internal {
        uint256 reserveCount = _reserveCount;

        if (reserveCount >= _maxReserveCount) revert(); ////MaxReserveCountExceeded();

        if (_reserves[asset].id != 0) revert(); ////DigitalAssetAlreadyAdded(address asset);

        _reserves[asset].id = uint8(reserveCount);
        _reservesList[reserveCount] = asset;

        _reserveCount = reserveCount + 1;
    }
}
