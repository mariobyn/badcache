//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

/**
    This contracts bridges an OpenSea ERC1155 into the new Badcache ERC721.
    Only owners of BadCache from OpenSea can mint new tokens once they transfer their NFT ownership to the BadcacheBridge. 
    A NFT will be minted once the receipt of the transfer is being validated
 */

import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";
import "./OpenSeaIERC1155.sol";

contract BadCacheBridge is ReentrancyGuard, Ownable, ERC1155Holder {
  mapping(string => string) private allowedAssets;
  address public openseaToken = 0x495f947276749Ce646f68AC8c248420045cb7b5e;
  mapping(address => mapping(uint256 => uint256)) private tokensTransfered;

  constructor() onlyOwner {}

  function mintBasedOnReceiving() private returns (bool) {}

  fallback() external payable {
    _logData();
  }

  function _logData() internal view {
    console.logBytes(msg.data);
    console.logUint(msg.value);
    console.logAddress(tx.origin);
  }

  receive() external payable {
    _logData();
  }

  function transferFromOpenSea(
    address from,
    address to,
    uint256 id,
    uint256 amount,
    bytes memory data
  ) public returns (bool success) {
    (bool returnedValue, bytes memory resp) = openseaToken.call(
      abi.encodePacked(
        bytes4(keccak256("safeTransferFrom(address from,address to,uint256 id,uint256 amount,bytes data)")),
        from,
        to,
        id,
        amount,
        data
      )
    );
    console.logString("Transfer from OpenSea");
    console.logBool(success);
    console.logBytes(resp);
    if (returnedValue) return returnedValue;
    assembly {
      let returndata_size := mload(resp)
      revert(add(32, resp), returndata_size)
    }
  }

  // function transferFromOpenSea(
  //     address from,
  //     address to,
  //     uint256 id,
  //     uint256 amount,
  //     bytes memory data
  // ) public returns (bool) {
  //     console.logString("Sender");
  //     console.logAddress(msg.sender);
  //     (bool success, bytes memory resp) = openseaToken.delegatecall(
  //         abi.encodeWithSignature(
  //             "safeTransferFrom(address,address,uint256,uint256,bytes)",
  //             from,
  //             to,
  //             id,
  //             amount,
  //             data
  //         )
  //     );
  //     console.logString("Transfer from OpenSea");
  //     console.logBool(success);
  //     console.logBytes(resp);
  //     if (success) return success;
  //     assembly {
  //         let returndata_size := mload(resp)
  //         revert(add(32, resp), returndata_size)
  //     }
  // }

  function renounceOwnershipOfToken(
    address to,
    uint256 id,
    uint256 amount,
    bytes memory data
  ) public returns (bool) {
    console.logString("Sender");
    console.logAddress(msg.sender);
    // (bool success, bytes memory resp) = openseaToken.delegatecall(
    //     abi.encodeWithSignature(
    //         "safeTransferFrom(address,address,uint256,uint256,bytes)",
    //         msg.sender,
    //         to,
    //         id,
    //         amount,
    //         data
    //     )
    // );
    // //
    //   console.logString("Transfer from OpenSea");
    //   console.logBool(success);
    //   console.logBytes(resp);
    //   if (success) return success;
    //   assembly {
    //       let returndata_size := mload(resp)
    //       revert(add(32, resp), returndata_size)
    //   }
    OpenSeaIERC1155(openseaToken).safeTransferFrom(msg.sender, to, id, amount, data);
  }

  function checkBalance(address account, uint256 id) public view returns (uint256 count) {
    console.logString("Check balance");
    return OpenSeaIERC1155(openseaToken).balanceOf(account, id);
  }

  function setApprovalForAllOpenSea(address _operator, bool _approved) external {
    console.logString("setApprovalForAll");
    OpenSeaIERC1155(openseaToken).setApprovalForAll(_operator, _approved);
  }

  function setProxiedToken(address _token) public onlyOwner {
    //need to check for address 0
    console.logString("setProxiedToken");
    console.logAddress(_token);

    openseaToken = _token;
  }

  function ownerOf(uint256 id) public view returns (bool) {
    console.logString("ownerOf");
    return OpenSeaIERC1155(openseaToken).balanceOf(msg.sender, id) != 0;
  }

  function onERC1155Received(
    address sender,
    address receiver,
    uint256 id,
    uint256 amount,
    bytes memory data
  ) public override returns (bytes4) {
    tokensTransfered[sender][id] = amount;
    console.logString("Received token");
    console.logUint(id);
    console.logUint(amount);
    return super.onERC1155Received(sender, receiver, id, amount, data);
  }
}
