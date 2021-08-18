//SPDX-License-Identifier: CC-BY-NC-ND-4.0
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../core/restored/RestoredCacheI.sol";
import "../core/BadCacheI.sol";
import "hardhat/console.sol";

contract BadCacheV2Minter is Ownable, ReentrancyGuard {
  uint256[] private mintedIds;
  address[] private minters;
  address internal badCache721 = 0x0000000000000000000000000000000000000000;

  function receiveEth() public payable {
    console.logUint(msg.value);
  }

  function mintBasedOnReceiving(address _sender, uint256 _tokenId) internal returns (bool) {
    require(_sender != address(0), "BadCacheV2Minter: can not mint a new token to the zero address");

    require(BadCacheI(badCache721).balanceOf(_sender) > 0, "BadCacheV2Minter: Sender does not have any BadCache721");

    uint256 maxId = BadCacheI(badCache721).getMaxId();

    // string memory uri = getURIById(newTokenId);
    // _mint721(newTokenId, _sender, uri);

    return true;
  }

  /**
   * @dev sets proxied token for BadCache721. You need to transfer the ownership of the 721 to the Bridge so the bridge can mint and transfer
   * Requirements:
   *
   * - `_token` must not be address zero
   */
  function setBadCache721(address _token) public onlyOwner {
    require(_token != address(0), "BadCacheBridge: can not set as BadCache721 the address zero");
    badCache721 = _token;
  }

  /**
   * @dev get BadCache721 proxied token
   */
  function getBadCache721Proxiedtoken() public view returns (address) {
    return badCache721;
  }
}
