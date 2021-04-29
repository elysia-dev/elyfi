// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "./libraries/WadRayMath.sol";
import "./libraries/Errors.sol";
import "./interfaces/IMoneyPool.sol";
import "./libraries/DataStruct.sol";

/**
 * @title ELYFI Tokenizer
 * @author ELYSIA
 */
contract Tokenizer is ERC1155Upgradeable {
    using WadRayMath for uint256;

    IMoneyPool internal _moneyPool;
    address internal _underlyingAsset;

    mapping(uint256 => string) internal _contract;

    function initialize(
        IMoneyPool moneyPool,
        address underlyingAsset_,
        string memory uri_
    ) public initializer {
        _moneyPool = moneyPool;
        _underlyingAsset = underlyingAsset_;

        __ERC1155_init(uri_);
    }


    // id : bitMask
    function mintABToken(
        address account,
        uint256 id, // information about Co and borrower
        string memory ipfsHash // Contract. refactor : gas need
    ) external onlyMoneyPool {

        if (_contract[id] != "") revert(); ////error ContractAlreadyExist(id)

        _mint(account, id, 1, "");

        _contract[id] = ipfsHash;
    }

    function verifyABToken(
        uint256 id
    ) external onlyMoneyPool {
        
    }

    function mintAToken(
        address account,
        uint256 amount
    ) external onlyMoneyPool {

    }

    modifier onlyMoneyPool {
        if (_msgSender() != address(_moneyPool)) revert(); ////OnlyMoneyPool();
        _;
    }
}