pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";


contract DarkHall is ERC20("DarkHall", "xDARK"){
    using SafeMath for uint256;
    IERC20 public dark;

    constructor(IERC20 _dark) public {
        require(address(_dark) != address(0), "invalid address");
        dark = _dark;
    }

    // Enter the Hall. Pay some DARKs. Earn some shares.
    function enter(uint256 _amount) public {
        uint256 totalDark = dark.balanceOf(address(this));
        uint256 totalShares = totalSupply();
        if (totalShares == 0 || totalDark == 0) {
            _mint(msg.sender, _amount);
        } else {
            uint256 what = _amount.mul(totalShares).div(totalDark);
            _mint(msg.sender, what);
        }
        dark.transferFrom(msg.sender, address(this), _amount);
    }

    // Leave the Hall. Claim back your DARKs.
    function leave(uint256 _share) public {
        uint256 totalShares = totalSupply();
        uint256 what = _share.mul(dark.balanceOf(address(this))).div(totalShares);
        _burn(msg.sender, _share);
        dark.transfer(msg.sender, what);
    }
}
