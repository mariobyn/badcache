//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

/**
    This contracts bridges an OpenSea ERC1155 into the new Badcache ERC721.
    Only owners of BadCache from OpenSea can mint new tokens once they transfer their NFT ownership to the BadcacheBridge. 
    A NFT will be minted once the receipt of the transfer is being validated
 */

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BadCache is ERC721Enumerable, ReentrancyGuard, Ownable {
    constructor(string memory name, string memory symbol)
        ERC721(name, symbol)
        onlyOwner
    {}

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721Enumerable) {}

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable)
        returns (bool)
    {}
}
