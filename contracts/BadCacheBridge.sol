//SPDX-License-Identifier: CC-BY-NC-ND-4.0
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./OpenSeaIERC1155.sol";
import "./BadCache721.sol";

/**
 * @dev This contracts bridges an OpenSea ERC1155 into the new Badcache ERC721.
 *      Only owners of BadCache from OpenSea can mint new tokens once they transfer their NFT ownership to the BadcacheBridge.
 *      An ERC721 will be minted once transfer is received
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

  // Maps an old token id with a new token id oldTokenId=>newTokenId
  mapping(uint256 => uint16) internal oldNewTokenIdPairs;

  // Keeps an array of new token ids that are allowed to be minted
  uint16[] internal newTokenIds;

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
    uint256 newTokenId = oldNewTokenIdPairs[_tokenId];
    require(!BadCache721(badCache721).exists(newTokenId), "BadCacheBridge: token already minted");
    require(newTokenId != 0, "BadCacheBridge: new token id does not exists");

    BadCache721(badCache721).mint(address(this), newTokenId);

    BadCache721(badCache721).setTokenUri(newTokenId, getURIById(newTokenId));

    BadCache721(badCache721).safeTransferFrom(address(this), _sender, newTokenId);
    emit MintedBadCache721(_sender, newTokenId);

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
    require(isNewTokenAllowed(_tokenId), "BadCacheBridge: token id does not exists");
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
   * @dev checks if it's part of the new allowed tokens
   */
  function isNewTokenAllowed(uint256 _tokenId) private view returns (bool) {
    for (uint128 i = 0; i < newTokenIds.length; i++) {
      if (newTokenIds[i] == _tokenId) return true;
    }
    return false;
  }

  /**
   * @dev initiation of the allowed tokens
   */
  function initAllowedTokens() private {
    addAllowedToken(
      23206585376031660214193587638946525563951523460783169084504955421657694994433,
      "https://ipfs.io/ipfs/QmSgfaQ7sK8SguU4u1wTQrUzeoJ8KptAW2KgVmi6AZomBj?filename=1.jpeg",
      1
    );
    addAllowedToken(
      23206585376031660214193587638946525563951523460783169084504955422757206622209,
      "https://ipfs.io/ipfs/QmSgfaQ7sK8SguU4u1wTQrUzeoJ8KptAW2KgVmi6AZomBj?filename=2.jpeg",
      2
    );
    addAllowedToken(
      23206585376031660214193587638946525563951523460783169084504955423856718249985,
      "https://ipfs.io/ipfs/QmSgfaQ7sK8SguU4u1wTQrUzeoJ8KptAW2KgVmi6AZomBj?filename=3.jpeg",
      3
    );
    addAllowedToken(
      23206585376031660214193587638946525563951523460783169084504955424956229877761,
      "https://ipfs.io/ipfs/QmSgfaQ7sK8SguU4u1wTQrUzeoJ8KptAW2KgVmi6AZomBj?filename=4.jpeg",
      4
    );
    addAllowedToken(
      23206585376031660214193587638946525563951523460783169084504955426055741505537,
      "https://ipfs.io/ipfs/QmSgfaQ7sK8SguU4u1wTQrUzeoJ8KptAW2KgVmi6AZomBj?filename=5.jpeg",
      5
    );
    addAllowedToken(
      23206585376031660214193587638946525563951523460783169084504955427155253133313,
      "https://ipfs.io/ipfs/QmSgfaQ7sK8SguU4u1wTQrUzeoJ8KptAW2KgVmi6AZomBj?filename=6.jpeg",
      6
    );
    addAllowedToken(
      23206585376031660214193587638946525563951523460783169084504955428254764761089,
      "https://ipfs.io/ipfs/QmSgfaQ7sK8SguU4u1wTQrUzeoJ8KptAW2KgVmi6AZomBj?filename=7.jpeg",
      7
    );
    addAllowedToken(
      23206585376031660214193587638946525563951523460783169084504955429354276388865,
      "https://ipfs.io/ipfs/QmSgfaQ7sK8SguU4u1wTQrUzeoJ8KptAW2KgVmi6AZomBj?filename=8.jpeg",
      8
    );
    addAllowedToken(
      23206585376031660214193587638946525563951523460783169084504955430453788016641,
      "https://ipfs.io/ipfs/QmSgfaQ7sK8SguU4u1wTQrUzeoJ8KptAW2KgVmi6AZomBj?filename=9.jpeg",
      9
    );
  }

  /**
   * @dev the owner can add new tokens into the allowed tokens list
   */
  function addAllowedToken(
    uint256 _tokenId,
    string memory _uri,
    uint16 _newTokenId
  ) public onlyOwner {
    allowedTokens.push(_tokenId);
    oldNewTokenIdPairs[_tokenId] = _newTokenId;
    newTokenIds.push(_newTokenId);
    tokenURIs[_newTokenId] = _uri;
  }
}
