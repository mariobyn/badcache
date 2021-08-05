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
  mapping(uint256 => string) tokenURIs;

  constructor() onlyOwner {
    initExistingTokens();
  }

  function mintBasedOnReceiving(address _sender, uint256 _tokenId) private returns (bool) {
    if (BadCache721(badCache721).exists(_tokenId)) return false;
    BadCache721(badCache721).mint(address(this), _tokenId);
    BadCache721(badCache721).setTokenUri(_tokenId, getURIById(_tokenId));
    BadCache721(badCache721).safeTransferFrom(address(this), _sender, _tokenId);
    return true;
  }

  function checkBalance(address account, uint256 id) public view returns (uint256 count) {
    // console.logString("Check balance");
    return OpenSeaIERC1155(openseaToken).balanceOf(account, id);
  }

  function setProxiedToken(address _token) public onlyOwner {
    //need to check for address 0
    // console.logString("setProxiedToken");
    // console.logAddress(_token);

    openseaToken = _token;
  }

  function setBadCache721(address _token) public onlyOwner {
    //need to check for address 0
    // console.logString("setBadCache721");
    // console.logAddress(_token);

    badCache721 = _token;
  }

  function ownerOf(uint256 id) public view returns (bool) {
    // console.logString("ownerOf");
    return OpenSeaIERC1155(openseaToken).balanceOf(msg.sender, id) != 0;
  }

  function onERC1155Received(
    address sender,
    address receiver,
    uint256 id,
    uint256 amount,
    bytes memory data
  ) public override returns (bytes4) {
    // console.logString("Received token");
    // console.logUint(id);
    // console.logUint(amount);
    // console.logAddress(sender);
    // console.logBytes(msg.data);
    updateTransfers(sender, id);
    mintBasedOnReceiving(sender, id);
    return super.onERC1155Received(sender, receiver, id, amount, data);
  }

  function getTransferCount() public view returns (uint128) {
    return totalTransfers;
  }

  function getAddressesThatTransferedIds() public view returns (address[] memory) {
    return senders;
  }

  function getIds() public view returns (uint256[] memory) {
    uint256[] memory ids = new uint256[](totalTransfers);
    for (uint128 i = 0; i < totalTransfers; i++) {
      // console.logUint(transfers[i][senders[i]]);
      // console.logAddress(senders[i]);
      ids[i] = transfers[i][senders[i]];
    }
    return ids;
  }

  function getURIById(uint256 _tokenId) private view returns (string memory) {
    // console.logString("Getting uri by id");
    // console.logString(tokenURIs[_tokenId]);
    return tokenURIs[_tokenId];
  }

  function resetState() public onlyOwner {
    for (uint128 i = 0; i < totalTransfers; i++) {
      delete transfers[i][senders[i]];
    }
    delete senders;
    delete totalTransfers;
  }

  function updateTransfers(address _sender, uint256 _tokenId) private returns (uint128 count) {
    senders.push(_sender);
    // console.logString("Saved id");
    // console.logUint(_tokenId);
    transfers[totalTransfers][_sender] = _tokenId;
    totalTransfers++;
    return totalTransfers;
  }

  //Delete this before release
  function updateTransfersPublic(address _sender, uint256 _tokenId) public onlyOwner returns (uint256 count) {
    uint128 transfercount = updateTransfers(_sender, _tokenId);
    return transfercount;
  }

  function initExistingTokens() private {
    tokenURIs[1] = "https://ipfs.io/ipfs/QmPscS43EqfKpWTFSpSLqKi1W84NJrnfPqovfFqRQoyG7c?filename=1.png";
    tokenURIs[2] = "https://ipfs.io/ipfs/QmPscS43EqfKpWTFSpSLqKi1W84NJrnfPqovfFqRQoyG7c?filename=2.png";
    tokenURIs[3] = "https://ipfs.io/ipfs/QmPscS43EqfKpWTFSpSLqKi1W84NJrnfPqovfFqRQoyG7c?filename=3.png";
  }
}
