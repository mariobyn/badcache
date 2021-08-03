//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    constructor(uint256 initialBalance) ERC20("TestToken", "Tkn") {
        _mint(msg.sender, initialBalance);
    }
}
