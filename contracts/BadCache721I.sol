//SPDX-License-Identifier: CC-BY-NC-ND-4.0
pragma solidity ^0.8.6;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract BadCache721I is IERC721, Ownable {
  function setTokenUri(uint256 _tokenId, string memory _tokenURI) public virtual;

  function mint(address _owner, uint256 _tokenId) public virtual;

  function exists(uint256 _tokenId) public view virtual returns (bool);
}
