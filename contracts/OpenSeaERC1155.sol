//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "hardhat/console.sol";

contract OpenSeaERC1155 is ERC1155, ERC1155Holder {
  constructor() ERC1155("https://game.example/api/item/{id}.json") {
    _mint(msg.sender, 1, 10, "");
    _mint(msg.sender, 2, 10, "");
    _mint(msg.sender, 3, 10, "");
    _mint(msg.sender, 4, 10, "");
    _mint(msg.sender, 5, 10, "");
    _mint(msg.sender, 6, 10, "");
    _mint(msg.sender, 7, 10, "");
    _mint(msg.sender, 8, 10, "");
    _mint(msg.sender, 9, 10, "");
    _mint(msg.sender, 1000, 10, "");
    _mint(msg.sender, 85601406272210854214775655996269203562327957411057160318308680267934449270785, 10, "");
    _mint(msg.sender, 85601406272210854214775655996269203562327957411057160318308680236048612065281, 10, "");
  }

  function supportsInterface(bytes4 interfaceId) public view override(ERC1155, ERC1155Receiver) returns (bool) {
    return interfaceId == type(IERC1155Receiver).interfaceId || super.supportsInterface(interfaceId);
  }
}
