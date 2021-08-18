//SPDX-License-Identifier: CC-BY-NC-ND-4.0
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BadCache is ERC721URIStorage, Ownable {
  // max token id
  uint256 private maxId = 0;

  constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {}

  function setTokenUri(uint256 _tokenId, string memory _tokenURI) public onlyOwner {
    _setTokenURI(_tokenId, _tokenURI);
  }

  function mint(address _owner, uint256 _tokenId) public onlyOwner {
    if (_tokenId > maxId) maxId = _tokenId;
    _safeMint(_owner, _tokenId);
  }

  function exists(uint256 _tokenId) public view returns (bool) {
    return _exists(_tokenId);
  }

  function setMaxId(uint256 _newMaxId) public onlyOwner {
    maxId = _newMaxId;
  }

  function getMaxId() public view returns (uint256) {
    return maxId;
  }
}
