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

    IMoneyPool internal _moneyPool;

    mapping(uint256 => bytes32) internal _tokenType;

    mapping(uint256 => address) internal _minter;

    // Account rewards
    // Decimals: 18
    mapping(address => uint256) private _accruedInterest;

    // Account block numbers
    mapping(address => uint256) private _blockNumbers;

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
        _tokenType[id] = Role.ABTOKEN;
    }

    struct MintLocalVars {
        uint256 aTokenId;
        uint256 futureInterestAmount;
        uint256 newAverageATokenRate;
        uint256 newTotalATokenSupply;
    }

    function mintAToken(
        address account,
        uint256 id,
        uint256 borrowAmount,
        uint256 realAssetAPR
    ) external override onlyMoneyPool {
        MintLocalVars memory vars;

        vars.aTokenId = _generateATokenId(id);

        vars.futureInterestAmount = borrowAmount.rayMul(realAssetAPR);

        (vars.newAverageATokenRate, vars.newTotalATokenSupply) = Math.calculateAverageAPR(
            _averageATokenAPR,
            _totalATokenSupply,
            borrowAmount,
            realAssetAPR
        );

        _totalATokenSupply = vars.newTotalATokenSupply;
        _averageATokenAPR = vars.newAverageATokenRate;

        _mint(account, vars.aTokenId, vars.futureInterestAmount, "");

        _tokenType[id] = Role.ATOKEN;

        emit MintAToken(
            account,
            vars.aTokenId,
            borrowAmount,
            vars.newAverageATokenRate,
            vars.newTotalATokenSupply
        );
    }

    /************ Interest Manage Functions ************/

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);

        for (uint256 i = 0; i < ids.length; ++i) {
            uint256 id = ids[i];
            uint256 amount = amounts[i];

            if(_tokenType[id] == Role.ATOKEN) {
                AssetBond.saveATokenInterest(from);
                AssetBond.saveATokenInterest(to);
            }
        }
    }

    /**
     * @notice Get reward
     * @param account Addresss
     * @return saved reward + new reward
     */
    function _getInterest(address account) internal view returns (uint256) {

        uint256 blockNumber = block.number;

        if (_tokenMatured()) {
            blockNumber = initialBlocknumber + blockRemaining;
        }

        AssetTokenLibrary.RewardLocalVars memory vars =
            AssetTokenLibrary.RewardLocalVars({
                newReward: 0,
                accountReward: _rewards[account],
                accountBalance: balanceOf(account),
                rewardBlockNumber: _blockNumbers[account],
                blockNumber: blockNumber,
                diffBlock: 0,
                rewardPerBlock: rewardPerBlock,
                totalSupply: totalSupply()
            });

        return vars.getReward();
    }

    function totalATokenSupply() external view override returns (uint256) {
        return _totalATokenSupply;
    }

    function getAverageATokenAPR() external view override returns (uint256) {
        return _averageATokenAPR;
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