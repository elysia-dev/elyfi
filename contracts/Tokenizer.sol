// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "./libraries/WadRayMath.sol";
import "./libraries/Errors.sol";
import "./libraries/DataStruct.sol";
import "./logic/AssetBond.sol";
import "./interfaces/IMoneyPool.sol";
import "./interfaces/ITokenizer.sol";

/**
 * @title ELYFI Tokenizer
 * @author ELYSIA
 */
contract Tokenizer is ITokenizer, ERC1155Upgradeable {
    using WadRayMath for uint256;

    IMoneyPool internal _moneyPool;

    mapping(uint256 => address) internal _minter;

    uint256 internal _totalATokenSupply;

    uint256 internal _averageATokenAPR;

    function initialize(
        address moneyPool,
        string memory uri_
    ) public initializer {
        _moneyPool = IMoneyPool(moneyPool);
        __ERC1155_init(uri_);
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
    }

    struct MintLocalVars {
        uint256 aTokenId;
        uint256 currentAverageATokenRate;
        uint256 previousATokenSupply;
        uint256 futureInterestAmount;
        uint256 nextATokenSupply;
        uint256 amountInRay;
        uint256 newAverageATokenRate;
    }

    function mintAToken(
        address account,
        uint256 id,
        uint256 borrowAmount,
        uint256 realAssetAPR
    ) external override onlyMoneyPool {
        MintLocalVars memory vars;

        vars.aTokenId = _generateATokenId(id);

        // refactor use library considering gas consumption

        vars.currentAverageATokenRate = _averageATokenAPR;

        vars.previousATokenSupply = _totalATokenSupply;
        vars.futureInterestAmount = borrowAmount.rayMul(realAssetAPR);
        vars.nextATokenSupply = _totalATokenSupply + vars.futureInterestAmount;

        _totalATokenSupply = vars.nextATokenSupply;

        // calculate the updated averageATokenAPR
        vars.newAverageATokenRate = (vars.currentAverageATokenRate
            .rayMul(vars.previousATokenSupply.wadToRay())
            + (realAssetAPR.rayMul(borrowAmount.wadToRay())))
            .rayDiv(vars.nextATokenSupply.wadToRay());

        _averageATokenAPR = vars.newAverageATokenRate;

        _mint(account, vars.aTokenId, vars.futureInterestAmount, "");
    }

    function totalATokenSupply() external view override returns (uint256) {
        return _totalATokenSupply;
    }

    function getAverageATokenAPR() external view override returns (uint256) {
        return _averageATokenAPR;
    }

    // need logic : what is
    function _generateATokenId(uint256 assetBondId) internal pure returns (uint256) {
        return assetBondId;
    }

    modifier onlyMoneyPool {
        if (_msgSender() != address(_moneyPool)) revert(); ////OnlyMoneyPool();
        _;
    }
}