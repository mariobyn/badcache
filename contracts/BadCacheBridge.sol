//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.6;

/**
    This contracts bridges an OpenSea ERC1155 into the new Badcache ERC721.
    Only owners of BadCache from OpenSea can mint new tokens once they transfer their NFT ownership to the BadcacheBridge. 
    A NFT will be minted once the receipt of the transfer is being validated
 */

import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";
import "./OpenSeaIERC1155.sol";
import "./BadCache721.sol";

contract BadCacheBridge is ReentrancyGuard, Ownable, ERC1155Holder, ERC721Holder {
  address private openseaToken = 0x495f947276749Ce646f68AC8c248420045cb7b5e;
  uint128 private totalTransfers = 0;
  address[] private senders;
  mapping(uint128 => mapping(address => uint256)) private transfers;
  address private badCache721 = 0x495f947276749Ce646f68AC8c248420045cb7b5e;
  mapping(uint256 => string) private tokenURIs;
  uint256[] private allowedTokens;

  constructor() onlyOwner {
    initExistingTokens();
  }

  function mintBasedOnReceiving(address _sender, uint256 _tokenId) internal returns (bool) {
    require(_sender != address(0), "BadCacheBridge: can not mint a new token to the zero address");
    require(isTokenAllowed(_tokenId), "BadCacheBridge: token id does not exists");

    require(!BadCache721(badCache721).exists(_tokenId), "BadCacheBridge: token already minted");
    BadCache721(badCache721).mint(address(this), _tokenId);
    BadCache721(badCache721).setTokenUri(_tokenId, getURIById(_tokenId));
    BadCache721(badCache721).safeTransferFrom(address(this), _sender, _tokenId);

    return true;
  }

  function checkBalance(address _account, uint256 _tokenId) public view returns (uint256) {
    require(_account != address(0), "BadCacheBridge: can not check balance for address zero");
    require(isTokenAllowed(_tokenId), "BadCacheBridge: token id does not exists");

    return OpenSeaIERC1155(openseaToken).balanceOf(_account, _tokenId);
  }

  function setProxiedToken(address _token) public onlyOwner {
    require(_token != address(0), "BadCacheBridge: can not set as proxy the address zero");

    openseaToken = _token;
  }

  function setBadCache721(address _token) public onlyOwner {
    require(_token != address(0), "BadCacheBridge: can not set as proxy the address zero");

    badCache721 = _token;
  }

  function ownerOf(uint256 _tokenId) public view returns (bool) {
    return OpenSeaIERC1155(openseaToken).balanceOf(msg.sender, _tokenId) != 0;
  }

  function onERC1155Received(
    address _sender,
    address _receiver,
    uint256 _tokenId,
    uint256 _amount,
    bytes memory _data
  ) public override returns (bytes4) {
    updateTransfers(_sender, _tokenId);
    mintBasedOnReceiving(_sender, _tokenId);
    return super.onERC1155Received(_sender, _receiver, _tokenId, _amount, _data);
  }

  function getTransferCount() public view returns (uint128) {
    return totalTransfers;
  }

  function getAddressesThatTransferedIds() public view returns (address[] memory) {
    return senders;
  }

  function resetState() public onlyOwner {
    for (uint128 i = 0; i < totalTransfers; i++) {
      delete transfers[i][senders[i]];
    }
    delete senders;
    delete totalTransfers;
  }

  function getIds() public view returns (uint256[] memory) {
    uint256[] memory ids = new uint256[](totalTransfers);
    for (uint128 i = 0; i < totalTransfers; i++) {
      ids[i] = transfers[i][senders[i]];
    }
    return ids;
  }

  function getURIById(uint256 _tokenId) private view returns (string memory) {
    require(isTokenAllowed(_tokenId), "BadCacheBridge: token id does not exists");
    return tokenURIs[_tokenId];
  }

  function updateTransfers(address _sender, uint256 _tokenId) internal returns (uint128 count) {
    require(_sender != address(0), "BadCacheBridge: can not update from the zero address");
    require(isTokenAllowed(_tokenId), "BadCacheBridge: token id does not exists");

    senders.push(_sender);
    transfers[totalTransfers][_sender] = _tokenId;
    totalTransfers++;
    return totalTransfers;
  }

  function isTokenAllowed(uint256 _tokenId) private view returns (bool) {
    for (uint128 i = 0; i < allowedTokens.length; i++) {
      if (allowedTokens[i] == _tokenId) return true;
    }
    return false;
  }

  function initExistingTokens() private {
    tokenURIs[1] = "https://ipfs.io/ipfs/QmPscS43EqfKpWTFSpSLqKi1W84NJrnfPqovfFqRQoyG7c?filename=1.png";
    tokenURIs[2] = "https://ipfs.io/ipfs/QmPscS43EqfKpWTFSpSLqKi1W84NJrnfPqovfFqRQoyG7c?filename=2.png";
    tokenURIs[3] = "https://ipfs.io/ipfs/QmPscS43EqfKpWTFSpSLqKi1W84NJrnfPqovfFqRQoyG7c?filename=3.png";
    tokenURIs[4] = "https://ipfs.io/ipfs/QmPscS43EqfKpWTFSpSLqKi1W84NJrnfPqovfFqRQoyG7c?filename=4.png";
    tokenURIs[5] = "https://ipfs.io/ipfs/QmPscS43EqfKpWTFSpSLqKi1W84NJrnfPqovfFqRQoyG7c?filename=5.png";
    tokenURIs[6] = "https://ipfs.io/ipfs/QmPscS43EqfKpWTFSpSLqKi1W84NJrnfPqovfFqRQoyG7c?filename=6.png";
    tokenURIs[7] = "https://ipfs.io/ipfs/QmPscS43EqfKpWTFSpSLqKi1W84NJrnfPqovfFqRQoyG7c?filename=7.png";
    tokenURIs[8] = "https://ipfs.io/ipfs/QmPscS43EqfKpWTFSpSLqKi1W84NJrnfPqovfFqRQoyG7c?filename=8.png";
    tokenURIs[9] = "https://ipfs.io/ipfs/QmPscS43EqfKpWTFSpSLqKi1W84NJrnfPqovfFqRQoyG7c?filename=9.png";
    allowedTokens.push(1);
    allowedTokens.push(2);
    allowedTokens.push(3);
    allowedTokens.push(4);
    allowedTokens.push(5);
    allowedTokens.push(6);
    allowedTokens.push(7);
    allowedTokens.push(8);
    allowedTokens.push(9);
  }
}
