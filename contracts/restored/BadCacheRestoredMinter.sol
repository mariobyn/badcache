//SPDX-License-Identifier: CC-BY-NC-ND-4.0
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../core/restored/RestoredCacheI.sol";
import "../core/BadCacheI.sol";
import "../core/restored/RestoredCacheI.sol";
import "hardhat/console.sol";

contract BadCacheRestoredMinter is Ownable, ReentrancyGuard {
  uint256[] private mintedIds;
  address[] private minters;
  address internal badCache721 = 0x0000000000000000000000000000000000000000;
  address internal badCacheRestored = 0x0000000000000000000000000000000000000000;
  event MintedBadCacheRestored(address indexed _sender, uint256 indexed _tokenId);

  function receiveEth() public payable {
    console.logUint(msg.value);
  }

  function mintBasedOnReceiving(address _sender, string memory uri) internal returns (bool) {
    require(_sender != address(0), "BadCacheRestoredMinter: can not mint a new token to the zero address");

    require(BadCacheI(badCache721).balanceOf(_sender) > 0, "BadCacheRestoredMinter: Sender does not have any BadCache721");

    uint256 maxId = BadCacheI(badCache721).getMaxId();
    for (uint256 i = 1; i <= maxId; i++) {
      if (BadCacheI(badCache721).ownerOf(i) == _sender) {
        _mint721(i, _sender, uri);
        return true;
      }
    }
    return false;
  }

  /**
   * @dev minting BadCacheRestored function and transfer to the owner
   */
  function _mint721(
    uint256 _tokenId,
    address _owner,
    string memory _tokenURI
  ) private {
    RestoredCacheI(badCacheRestored).mint(address(this), _tokenId);

    RestoredCacheI(badCacheRestored).setTokenUri(_tokenId, _tokenURI);
    RestoredCacheI(badCacheRestored).safeTransferFrom(address(this), _owner, _tokenId);
    emit MintedBadCacheRestored(_owner, _tokenId);
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
   * @dev sets proxied token for BadCacheRestored. You need to transfer the ownership of the 721 to the Bridge so the bridge can mint and transfer
   * Requirements:
   *
   * - `_token` must not be address zero
   */
  function setBadCacheRestored(address _token) public onlyOwner {
    require(_token != address(0), "BadCacheBridge: can not set as BadCacheRestored the address zero");
    badCacheRestored = _token;
  }

  /**
   * @dev get BadCache721 proxied token
   */
  function getBadCache721Proxiedtoken() public view returns (address) {
    return badCache721;
  }

  /**
   * @dev get BadCacheRestored proxied token
   */
  function getBadCacheRestoredProxiedtoken() public view returns (address) {
    return badCacheRestored;
  }
}
