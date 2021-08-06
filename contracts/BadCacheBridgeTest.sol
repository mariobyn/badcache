//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.6;

/**
    This contracts bridges an OpenSea ERC1155 into the new Badcache ERC721.
    Only owners of BadCache from OpenSea can mint new tokens once they transfer their NFT ownership to the BadcacheBridge. 
    A NFT will be minted once the receipt of the transfer is being validated
 */

import "hardhat/console.sol";
import "./BadCacheBridge.sol";

contract BadCacheBridgeTest is BadCacheBridge {
  constructor() onlyOwner BadCacheBridge() {}

  function updateTransfersPublic(address _sender, uint256 _tokenId) public onlyOwner returns (uint256 count) {
    return updateTransfers(_sender, _tokenId);
  }

  function mintBasedOnReceivingPublic(address _sender, uint256 _tokenId) public onlyOwner returns (bool) {
    return mintBasedOnReceiving(_sender, _tokenId);
  }

  
}
