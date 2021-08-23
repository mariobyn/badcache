//SPDX-License-Identifier: CC-BY-NC-ND-4.0
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../core/BadCacheI.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract RestoredCache is ERC721URIStorage, Ownable {
  address internal badCache721 = 0x0000000000000000000000000000000000000000;
  bool internal paused = true;
  uint256 internal balance = 0;

  mapping(uint8 => uint256) internal amountPerType;
  event MintedRestoredCache(address indexed _sender, uint256 indexed _tokenId);
  event Witdraw(address indexed _receiver, uint256 indexed _amount);

  constructor() onlyOwner ERC721("RestoredCache", "RestoredCache") {}

  function exists(uint256 _tokenId) public view returns (bool) {
    return _exists(_tokenId);
  }

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
    require(amountPerType[_type] > 0, "Type of metadata not found");
    require(amountPerType[_type] == msg.value, "Amount of ETH <> Meta type");
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
    require(_sender != address(0), "Can not mint to address 0");
    require(!this.exists(_tokenId), "Token already exists");

    bool validPurchase = !paused;

    //if paused == true, means only BadCache 721 holders can mint
    if (paused) {
      require(
        BadCacheI(badCache721).balanceOf(_sender) > 0 &&
          BadCacheI(badCache721).exists(_tokenId) &&
          BadCacheI(badCache721).ownerOf(_tokenId) == _sender,
        "Sender has problems with BadCache721"
      );

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
    _safeMint(_owner, _tokenId);
    _setTokenURI(_tokenId, _tokenURI);
    emit MintedRestoredCache(_owner, _tokenId);
  }

  /**
   * @dev sets proxied token for BadCache721.
   * Requirements:
   *
   * - `_token` must not be address zero
   */
  function setBadCache721ProxiedAddress(address _token) public onlyOwner {
    require(_token != address(0), "Can't set to the address 0");
    badCache721 = _token;
  }

  /**
   * @dev get BadCache721 proxied token
   */
  function getBadCache721ProxiedAddress() public view returns (address) {
    return badCache721;
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
    require(balance >= _amount, "Can not withdraw this amount");
    balance = balance - _amount;
    (bool succeed, ) = msg.sender.call{ value: _amount }("");
    require(succeed, "Could not withdraw");
    emit Witdraw(msg.sender, _amount);
  }
}
