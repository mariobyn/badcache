//SPDX-License-Identifier: CC-BY-NC-ND-4.0
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "../core/restored/RestoredCacheI.sol";
import "../core/BadCacheI.sol";
import "../core/restored/RestoredCacheI.sol";
import "hardhat/console.sol";

contract RestoredCacheMinterRinkeby is Ownable, ReentrancyGuard, ERC721Holder {
  address internal badCache721 = 0x0000000000000000000000000000000000000000;
  address internal restoredCache = 0x0000000000000000000000000000000000000000;
  bool internal paused = true;
  uint256 internal balance = 0;

  mapping(uint8 => uint256) internal amountPerType;
  event MintedRestoredCache(address indexed _sender, uint256 indexed _tokenId);
  event Witdraw(address indexed _receiver, uint256 indexed _amount);

  /**
   * @dev Purchase a RestoredCache based by a holder of a BadCache721. Also the _badCache721Id must be a BadCache721 token that has the sender as the owner
   *
   * Requirements:
   *
   * - `_type` - defines a type of metadata type (video or image) and must exists in allowed types.
   *             Also the amount of ETH sent must be equal with the amount of ETH required for this type
   */
  function purchase(
    uint256 _tokenId,
    uint8 _type,
    string memory uri
  ) public payable {
    require(amountPerType[_type] > 0, "RestoredCacheMinter: Type of metadata not found");
    require(amountPerType[_type] == msg.value, "RestoredCacheMinter: The amount of ETH for this metadata type is wrong");
    balance = balance + msg.value;
    mintRestoredCache(msg.sender, uri, _tokenId);
  }

  /**
   * @dev Minting a RestoredCache by a BadCache721 Holder
   *
   * Requirements:
   * - `_sender` - to not be the zero address`
   * - `_sender` - to be the owner of _badCache721Id on BadCache721
   *
   */
  function mintRestoredCache(
    address _sender,
    string memory uri,
    uint256 _tokenId
  ) internal {
    require(_sender != address(0), "RestoredCacheMinter: can not mint a new token to the zero address");
    require(!RestoredCacheI(restoredCache).exists(_tokenId), "RestoredCacheMinter: Token already exists");

    bool validPurchase = !paused;

    //if paused == true, means only BadCache 721 holders can mint
    if (paused) {
      require(BadCacheI(badCache721).balanceOf(_sender) > 0, "RestoredCacheMinter: Sender does not have any BadCache721");
      require(BadCacheI(badCache721).exists(_tokenId), "RestoredCacheMinter: BadCache 721 does not exists");
      require(BadCacheI(badCache721).ownerOf(_tokenId) == _sender, "RestoredCacheMinter: You are not the owner of BadCache721");

      validPurchase = true;
    }
    if (validPurchase) _mint721(_tokenId, _sender, uri);
  }

  /**
   * @dev minting RestoredCache function and transfer to the owner
   */
  function _mint721(
    uint256 _tokenId,
    address _owner,
    string memory _tokenURI
  ) private {
    RestoredCacheI(restoredCache).mint(_owner, _tokenId, _tokenURI);
    emit MintedRestoredCache(_owner, _tokenId);
  }

  /**
   * @dev Triggered when we receive an ERC1155 from OpenSea and calls {mintBasedOnReceiving}
   *
   * Requirements:
   *
   * - `_sender` cannot be the zero address.
   *
   * Emits a {Transfer} event.
   */
  function onERC721Received(
    address _sender,
    address _receiver,
    uint256 _tokenId,
    bytes memory _data
  ) public override returns (bytes4) {
    require(_sender != address(0), "BadCacheBridge: can not update from the zero address");
    return super.onERC721Received(_sender, _receiver, _tokenId, _data);
  }

  /**
   * @dev transfers the ownership of RestoredCache token from Bridge to _newOwner
   */
  function transferOwnershipOfRestored(address _newOwner) public onlyOwner {
    require(_newOwner != address(0), "RestoredCacheMinter: new owner can not be the zero address");
    RestoredCacheI(restoredCache).transferOwnership(_newOwner);
  }

  /**
   * @dev sets proxied token for BadCache721.
   * Requirements:
   *
   * - `_token` must not be address zero
   */
  function setBadCache721ProxiedAddress(address _token) public onlyOwner {
    require(_token != address(0), "BadCacheBridge: can not set as BadCache721 the address zero");
    badCache721 = _token;
  }

  /**
   * @dev get BadCache721 proxied token
   */
  function getBadCache721ProxiedAddress() public view returns (address) {
    return badCache721;
  }

  /**
   * @dev sets proxied token for RestoredCache. You need to transfer the ownership of the Restored to the Minter so the bridge can mint and transfer
   * Requirements:
   *
   * - `_token` must not be address zero
   */
  function setRestoredCacheProxiedAddress(address _token) public onlyOwner {
    require(_token != address(0), "BadCacheBridge: can not set as RestoredCache the address zero");
    restoredCache = _token;
  }

  /**
   * @dev get RestoredCache proxied token
   */
  function getRestoredCacheProxiedAddress() public view returns (address) {
    return restoredCache;
  }

  /**
   * @dev sets amount of ETH that a metadata type requires in order to purchase
   */
  function setAmountPerType(uint8 _type, uint256 _amount) public onlyOwner {
    amountPerType[_type] = _amount;
  }

  /**
   * @dev gets an amount of ETH per metadata type
   */
  function getAmountPerType(uint8 _type) public view returns (uint256) {
    return amountPerType[_type];
  }

  /**
   * @dev gets the balance of ETH of the contract
   */
  function getBalance() public view returns (uint256) {
    return balance;
  }

  /**
   * @dev sets paused
   */
  function setPaused(bool _paused) public onlyOwner {
    paused = _paused;
  }

  /**
   * @dev gets paused
   */
  function getPaused() public view returns (bool) {
    return paused;
  }

  /**
   * @dev withdraws contract balance
   */
  function withdraw(uint256 _amount) public onlyOwner {
    require(balance >= _amount, "BadCacheBridge: can not withdraw this amount");
    (bool succeed, ) = msg.sender.call{ value: _amount }("");
    require(succeed, "BadCacheBridge: Could not withdraw");
    balance = balance - _amount;
    emit Witdraw(msg.sender, _amount);
  }
}
