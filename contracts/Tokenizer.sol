// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "./libraries/WadRayMath.sol";
import "./libraries/Errors.sol";
import "./libraries/DataStruct.sol";
import "./interfaces/IMoneyPool.sol";
import "./interfaces/ITokenizer.sol";

/**
 * @title ELYFI Tokenizer
 * @author ELYSIA
 */
contract Tokenizer is ITokenizer, ERC1155Upgradeable {
    using WadRayMath for uint256;

    IMoneyPool internal _moneyPool;
    address internal _underlyingAsset;

    mapping(uint256 => address) internal _minter;

    function initialize(
        IMoneyPool moneyPool,
        address underlyingAsset_,
        string memory uri_
    ) public initializer {
        _moneyPool = moneyPool;
        _underlyingAsset = underlyingAsset_;

        __ERC1155_init(uri_);
    }

    function getMinter(
        uint256 id
    ) external view returns (address) {
        return _minter[id];
    }

    // id : bitMask
    function mintABToken(
        address account, // Co address
        uint256 id // information about Co and borrower
    ) external override onlyMoneyPool {

        if (_minter[id] != address(0)) revert(); ////error TokenIDAlreadyExist(id)

        // validate Id :
        // if ()

        // mint ABToken to Co
        _mint(account, id, 1, "");

        _minter[id] = account;
    }

    function settleABToken(
        address asset,
        uint256 id,
        address borrower,
        address lawfirm,
        uint256 collateralValue,
        string memory ipfsHash
    ) external onlyMoneyPool {
    }

    function mintAToken(
        address account,
        uint256 id,
        uint256 amount,
        uint256 realAssetAPR
    ) external override onlyMoneyPool {

    }

    modifier onlyMoneyPool {
        if (_msgSender() != address(_moneyPool)) revert(); ////OnlyMoneyPool();
        _;
    }
}