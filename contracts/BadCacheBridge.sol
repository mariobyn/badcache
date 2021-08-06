//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";
import "./OpenSeaIERC1155.sol";
import "./BadCache721.sol";

/**
 * @dev This contracts bridges an OpenSea ERC1155 into the new Badcache ERC721.
 *      Only owners of BadCache from OpenSea can mint new tokens once they transfer their NFT ownership to the BadcacheBridge.
 *      A NFT will be minted once transfer is received
 */

contract BadCacheBridge is ReentrancyGuard, Ownable, ERC1155Holder, ERC721Holder {
  // OpenSea token that can be proxied to check for balance
  address internal openseaToken = 0x495f947276749Ce646f68AC8c248420045cb7b5e;

  // Total transfered tokens to our bridge
  uint128 internal totalTransfers = 0;

  // A list of senders, that sent tokens to our bridge
  address[] internal senders;

  // Storing a transfer count -> sender -> tokenId
  mapping(uint128 => mapping(address => uint256)) internal transfers;

  // BadCache721 token that it will be minted based on receiving
  address internal badCache721 = 0x495f947276749Ce646f68AC8c248420045cb7b5e;

  // Storing token URIs for allowed tokens id->tokeUri
  mapping(uint256 => string) internal tokenURIs;

  // Allowed tokens ids (from OpenSea)
  uint256[] internal allowedTokens;

  event ReceivedTransferFromOpenSea(
    address indexed _sender,
    address indexed _receiver,
    uint256 indexed _tokenId,
    uint256 _amount
  );

  event MintedBadCache721(address indexed _sender, uint256 indexed _tokenId);

  /**
   * @dev Initiating the tokens allowed to be received
   */
  constructor() onlyOwner {
    initAllowedTokens();
  }

  /**
   * @dev Mint a ERC721 token based on the receiving of the OpenSea token.
   *
   * Requirements:
   *
   * - `_sender` cannot be the zero address.
   * - `_tokenId` needs to be part of our allowedIds.
   * - `_tokenId` must not be minted before.
   *
   * Emits a {Transfer} event.
   */
  function mintBasedOnReceiving(address _sender, uint256 _tokenId) internal returns (bool) {
    require(_sender != address(0), "BadCacheBridge: can not mint a new token to the zero address");
    require(isTokenAllowed(_tokenId), "BadCacheBridge: token id does not exists");

    require(!BadCache721(badCache721).exists(_tokenId), "BadCacheBridge: token already minted");
    BadCache721(badCache721).mint(address(this), _tokenId);
    BadCache721(badCache721).setTokenUri(_tokenId, getURIById(_tokenId));
    BadCache721(badCache721).safeTransferFrom(address(this), _sender, _tokenId);
    emit MintedBadCache721(_sender, _tokenId);

    return true;
  }

  /**
   * @dev check balance of an account and an id for the OpenSea ERC1155
   */
  function checkBalance(address _account, uint256 _tokenId) public view returns (uint256) {
    require(_account != address(0), "BadCacheBridge: can not check balance for address zero");
    require(isTokenAllowed(_tokenId), "BadCacheBridge: token id does not exists");

    return OpenSeaIERC1155(openseaToken).balanceOf(_account, _tokenId);
  }

  /**
   * @dev sets proxied token for OpenSea. You need to get it from the mainnet https://etherscan.io/address/0x495f947276749ce646f68ac8c248420045cb7b5e
   * Requirements:
   *
   * - `_token` must not be address zero
   */
  function setProxiedToken(address _token) public onlyOwner {
    require(_token != address(0), "BadCacheBridge: can not set as proxy the address zero");

    openseaToken = _token;
  }

  /**
   * @dev sets proxied token for BadCache721. You need to transfer the ownership of the 721 to the Bridge so the bridge can mint and transfer
   * Requirements:
   *
   * - `_token` must not be address zero
   */
  function setBadCache721(address _token) public onlyOwner {
    require(_token != address(0), "BadCacheBridge: can not set as proxy the address zero");

    badCache721 = _token;
  }

  /**
   * @dev check owner of a token on OpenSea token
   */
  function ownerOf(uint256 _tokenId) public view returns (bool) {
    return OpenSeaIERC1155(openseaToken).balanceOf(msg.sender, _tokenId) != 0;
  }

  /**
   * @dev Triggered when we receive an ERC1155 from OpenSea and calls {mintBasedOnReceiving}
   *
   * Requirements:
   *
   * - `_sender` cannot be the zero address.
   * - `_tokenId` needs to be part of our allowedIds.
   * - `_tokenId` must not be minted before.
   *
   * Emits a {Transfer} event.
   */
  function onERC1155Received(
    address _sender,
    address _receiver,
    uint256 _tokenId,
    uint256 _amount,
    bytes memory _data
  ) public override returns (bytes4) {
    onReceiveTransfer(_sender, _tokenId);
    mintBasedOnReceiving(_sender, _tokenId);
    emit ReceivedTransferFromOpenSea(_sender, _receiver, _tokenId, _amount);
    return super.onERC1155Received(_sender, _receiver, _tokenId, _amount, _data);
  }

  /**
   * @dev get total transfer count
   */
  function getTransferCount() public view returns (uint128) {
    return totalTransfers;
  }

  /**
   * @dev get addreses that already sent a token to us
   */
  function getAddressesThatTransferedIds() public view returns (address[] memory) {
    return senders;
  }

  /**
   * @dev get ids of tokens that were transfered
   */
  function getIds() public view returns (uint256[] memory) {
    uint256[] memory ids = new uint256[](totalTransfers);
    for (uint128 i = 0; i < totalTransfers; i++) {
      ids[i] = transfers[i][senders[i]];
    }
    return ids;
  }

  /**
   * @dev get URI by token id from allowed tokens
   *
   * Requirements:
   *
   * - `_tokenId` needs to be part of our allowedIds.
   */
  function getURIById(uint256 _tokenId) private view returns (string memory) {
    require(isTokenAllowed(_tokenId), "BadCacheBridge: token id does not exists");
    return tokenURIs[_tokenId];
  }

  /**
   * @dev update params once we receive a transfer
   *
   * Requirements:
   *
   * - `_sender` cannot be the zero address.
   * - `_tokenId` needs to be part of our allowedIds.
   */
  function onReceiveTransfer(address _sender, uint256 _tokenId) internal returns (uint128 count) {
    require(_sender != address(0), "BadCacheBridge: can not update from the zero address");
    require(isTokenAllowed(_tokenId), "BadCacheBridge: token id does not exists");

    senders.push(_sender);
    transfers[totalTransfers][_sender] = _tokenId;
    totalTransfers++;
    return totalTransfers;
  }

  /**
   * @dev checks if it's part of the allowed tokens
   */
  function isTokenAllowed(uint256 _tokenId) private view returns (bool) {
    for (uint128 i = 0; i < allowedTokens.length; i++) {
      if (allowedTokens[i] == _tokenId) return true;
    }
    return false;
  }

  /**
   * @dev initiation of the allowed tokens
   */
  function initAllowedTokens() private {
    addAllowedToken(1, "https://ipfs.io/ipfs/QmPscS43EqfKpWTFSpSLqKi1W84NJrnfPqovfFqRQoyG7c?filename=1.png");
    addAllowedToken(2, "https://ipfs.io/ipfs/QmPscS43EqfKpWTFSpSLqKi1W84NJrnfPqovfFqRQoyG7c?filename=2.png");
    addAllowedToken(3, "https://ipfs.io/ipfs/QmPscS43EqfKpWTFSpSLqKi1W84NJrnfPqovfFqRQoyG7c?filename=3.png");
    addAllowedToken(4, "https://ipfs.io/ipfs/QmPscS43EqfKpWTFSpSLqKi1W84NJrnfPqovfFqRQoyG7c?filename=4.png");
    addAllowedToken(5, "https://ipfs.io/ipfs/QmPscS43EqfKpWTFSpSLqKi1W84NJrnfPqovfFqRQoyG7c?filename=5.png");
    addAllowedToken(6, "https://ipfs.io/ipfs/QmPscS43EqfKpWTFSpSLqKi1W84NJrnfPqovfFqRQoyG7c?filename=6.png");
    addAllowedToken(7, "https://ipfs.io/ipfs/QmPscS43EqfKpWTFSpSLqKi1W84NJrnfPqovfFqRQoyG7c?filename=7.png");
    addAllowedToken(8, "https://ipfs.io/ipfs/QmPscS43EqfKpWTFSpSLqKi1W84NJrnfPqovfFqRQoyG7c?filename=8.png");
    addAllowedToken(9, "https://ipfs.io/ipfs/QmPscS43EqfKpWTFSpSLqKi1W84NJrnfPqovfFqRQoyG7c?filename=9.png");
    // addAllowedToken(
    //   85601406272210854214775655996269203562327957411057160318308680236048612065281,
    //   "https://ipfs.io/ipfs/QmaNsZbtuJ66NUJMkhynTmjpjkkwy6BWhp4JvyjGginETN/31.png"
    // );
    // addAllowedToken(
    //   85601406272210854214775655996269203562327957411057160318308680267934449270785,
    //   "https://ipfs.io/ipfs/QmaNsZbtuJ66NUJMkhynTmjpjkkwy6BWhp4JvyjGginETN/60.png"
    // );
  }

  function addAllowedToken(uint256 _tokenId, string memory _uri) public onlyOwner {
    tokenURIs[_tokenId] = _uri;
    allowedTokens.push(_tokenId);
  }
}
