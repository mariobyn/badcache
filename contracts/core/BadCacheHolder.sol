//SPDX-License-Identifier: CC-BY-NC-ND-4.0
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

contract BadCacheHolder is ERC721Holder {
  function onERC721Received(
    address _sender,
    address _receiver,
    uint256 _tokenId,
    bytes memory _data
  ) public override returns (bytes4) {
    return super.onERC721Received(_sender, _receiver, _tokenId, _data);
  }
}
