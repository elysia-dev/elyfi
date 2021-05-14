// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "./libraries/WadRayMath.sol";
import "./libraries/Errors.sol";
import "./libraries/DataStruct.sol";
import "./libraries/Math.sol";
import "./libraries/Role.sol";
import "./logic/AssetBond.sol";
import "./interfaces/IMoneyPool.sol";
import "./interfaces/ITokenizer.sol";

/**
 * @title ELYFI Tokenizer
 * @author ELYSIA
 */
contract Tokenizer is ITokenizer, ERC1155Upgradeable {
    using WadRayMath for uint256;
    using AssetBond for DataStruct.TokenizerData;

    IMoneyPool internal _moneyPool;

    mapping (uint256 => bytes32) internal _tokenType;

    mapping (uint256 => address) internal _minter;

    // account supply APR and timestamp for each AToken
    mapping (uint256 => mapping (address => DataStruct.UserAssetBondInvestData)) internal _userData;

    DataStruct.TokenizerData internal _tokenizer;

    /************ Initial Functions ************/

    function initialize(
        address moneyPool,
        string memory uri_
    ) public initializer {
        _moneyPool = IMoneyPool(moneyPool);
        __ERC1155_init(uri_);
    }

    /************ View Functions ************/

    /**
     * @dev Returns sum of previous balance and accrued interest of account
     * @param account Account address
     * @param tokenId Token Id
     * @return The sum of previous balance and accrued interest
     */
    function balanceOf(
        address account,
        uint256 tokenId
    ) public view virtual override(ERC1155Upgradeable, IERC1155Upgradeable) returns (uint256) {
        uint256 userPreviousBalance = super.balanceOf(account, tokenId);
        if (userPreviousBalance == 0) {
            return 0;
        }

        // need calculation after maturity
        uint256 accruedInterest =
            Math.calculateLinearInterest(
                _userData[tokenId][account].averageSupplyAPR,
                _userData[tokenId][account].updateTimestamp,
                block.timestamp);

        return userPreviousBalance.rayMul(accruedInterest);
    }

    /**
     * @dev Returns sum of previous balance and accrued interest of moneypool
     * @return The sum of previous balance and accrued interest of moneypool
     */
    function totalATokenBalanceOfMoneyPool() public view override returns (uint256) {
        uint256 accruedInterest =
            Math.calculateLinearInterest(
                _tokenizer.averageMoneyPoolAPR,
                _tokenizer.lastUpdateTimestamp,
                block.timestamp);

        return _tokenizer.totalATokenBalanceOfMoneyPool.rayMul(accruedInterest);
    }

    /**
     * @dev Returns total AToken supply which is sum of previous balance and accrued interest
     * @return The sum of previous balance and accrued interest
     */
    function totalATokenSupply() public view override returns (uint256) {
        uint256 accruedInterest =
            Math.calculateLinearInterest(
                _tokenizer.averageATokenAPR,
                _tokenizer.lastUpdateTimestamp,
                block.timestamp);

        return _tokenizer.totalATokenSupply.rayMul(accruedInterest);
    }

    // function burnAToken(
    //     address account,
    //     uint256 assetBondId,
    //     uint256 amount
    // ) external {

    //     // validation : only after maturation

    //     Math.calculateRateInDecreasingBalance(
    //         _tokenizer.averageMoneyPoolAPR,
    //         _tokenizer.totalATokenBalanceOfMoneyPool,
    //         amount,
    //         );
    // }

    struct MintLocalVars {
        uint256 aTokenId;
        uint256 futureInterestAmount;
        uint256 newAverageATokenRate;
        uint256 newTotalATokenSupply;
    }

    function mintAToken(
        address account,
        uint256 assetBondId,
        uint256 borrowAmount,
        uint256 realAssetAPR
    ) external override onlyMoneyPool {
        MintLocalVars memory vars;

        // generate AToken Id based on the Id of asset bond
        vars.aTokenId = _generateATokenId(assetBondId);

        // update total Atoken supply and average AToken rate
        AssetBond.increaseTotalAToken(
            _tokenizer,
            borrowAmount,
            realAssetAPR);

        // update moneyPool AToken supply and average AToken rate
        AssetBond.increaseATokenBalanceOfMoneyPool(
            _tokenizer,
            vars.aTokenId,
            borrowAmount,
            realAssetAPR);

        _mint(address(_moneyPool), vars.aTokenId, vars.futureInterestAmount, "");

        _tokenType[assetBondId] = Role.ATOKEN;

        emit MintAToken(
            account,
            vars.aTokenId,
            borrowAmount,
            vars.newAverageATokenRate,
            vars.newTotalATokenSupply
        );
    }

    function getMinter(
        uint256 id
    ) external view returns (address) {
        return _minter[id];
    }

    // id : bitMask
    function mintABToken(
        address account, // CO address
        uint256 id // information about CO and borrower
    ) external override onlyMoneyPool {

        if (_minter[id] != address(0)) revert(); ////error ABTokenIDAlreadyExist(id)

        // mint ABToken to CO
        _mint(account, id, 1, "");

        _minter[id] = account;
        _tokenType[id] = Role.ABTOKEN;
    }

    /************ Interest Manage Functions ************/

    function increaseATokenBalanceOfMoneyPool(
        uint256 id,
        uint256 amount,
        uint256 rate
    ) external override {
        uint256 aTokenId = _generateATokenId(id);

        AssetBond.increaseATokenBalanceOfMoneyPool(
            _tokenizer,
            aTokenId,
            amount,
            rate);
    }

    function decreaseATokenBalanceOfMoneyPool(
        uint256 id,
        uint256 amount,
        uint256 rate
    ) external override {
        uint256 aTokenId = _generateATokenId(id);

        AssetBond.decreaseATokenBalanceOfMoneyPool(
            _tokenizer,
            aTokenId,
            amount,
            rate);
    }

    function getAverageATokenAPR() external view override returns (uint256) {
        return _tokenizer.averageATokenAPR;
    }

    // need logic : generate token id
    function _generateATokenId(uint256 assetBondId) internal pure returns (uint256) {
        return assetBondId;
    }

    modifier onlyMoneyPool {
        if (_msgSender() != address(_moneyPool)) revert(); ////OnlyMoneyPool();
        _;
    }
}