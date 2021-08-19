//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.6;

/**
    Utilitary contract used for testing
 */

import "./BadCacheBridgeRinkeby.sol";

contract BadCacheBridgeTest is BadCacheBridgeRinkeby {
  constructor() onlyOwner BadCacheBridgeRinkeby() {}

  function updateTransfersPublic(address _sender, uint256 _tokenId) public onlyOwner returns (uint256 count) {
    return onReceiveTransfer1155(_sender, _tokenId);
  }

  function mintBasedOnReceivingPublic(address _sender, uint256 _tokenId) public onlyOwner returns (bool) {
    return mintBasedOnReceiving(_sender, _tokenId);
  }

  function resetState() public onlyOwner {
    for (uint32 i = 0; i < totalTransfers; i++) {
      delete transfers[i][senders[i]];
    }
    delete senders;
    delete totalTransfers;
  }
}
