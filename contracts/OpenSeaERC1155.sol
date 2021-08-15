//SPDX-License-Identifier: CC-BY-NC-ND-4.0
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

contract OpenSeaERC1155 is ERC1155, ERC1155Holder {
  constructor() ERC1155("https://ipfs.io/ipfs/QmSgfaQ7sK8SguU4u1wTQrUzeoJ8KptAW2KgVmi6AZomBj?filename={id}.jpeg") {
    _mint(
      msg.sender,
      23206585376031660214193587638946525563951523460783169084504955421657694994433,
      1,
      "https://ipfs.io/ipfs/QmSgfaQ7sK8SguU4u1wTQrUzeoJ8KptAW2KgVmi6AZomBj?filename=1.jpeg"
    );
    _mint(
      msg.sender,
      23206585376031660214193587638946525563951523460783169084504955422757206622209,
      1,
      "https://ipfs.io/ipfs/QmSgfaQ7sK8SguU4u1wTQrUzeoJ8KptAW2KgVmi6AZomBj?filename=2.jpeg"
    );
    _mint(
      msg.sender,
      23206585376031660214193587638946525563951523460783169084504955423856718249985,
      1,
      "https://ipfs.io/ipfs/QmSgfaQ7sK8SguU4u1wTQrUzeoJ8KptAW2KgVmi6AZomBj?filename=3.jpeg"
    );
    _mint(
      msg.sender,
      23206585376031660214193587638946525563951523460783169084504955424956229877761,
      1,
      "https://ipfs.io/ipfs/QmSgfaQ7sK8SguU4u1wTQrUzeoJ8KptAW2KgVmi6AZomBj?filename=4.jpeg"
    );
    _mint(
      msg.sender,
      23206585376031660214193587638946525563951523460783169084504955426055741505537,
      1,
      "https://ipfs.io/ipfs/QmSgfaQ7sK8SguU4u1wTQrUzeoJ8KptAW2KgVmi6AZomBj?filename=5.jpeg"
    );
    _mint(
      msg.sender,
      23206585376031660214193587638946525563951523460783169084504955427155253133313,
      1,
      "https://ipfs.io/ipfs/QmSgfaQ7sK8SguU4u1wTQrUzeoJ8KptAW2KgVmi6AZomBj?filename=6.jpeg"
    );
    _mint(
      msg.sender,
      23206585376031660214193587638946525563951523460783169084504955428254764761089,
      1,
      "https://ipfs.io/ipfs/QmSgfaQ7sK8SguU4u1wTQrUzeoJ8KptAW2KgVmi6AZomBj?filename=7.jpeg"
    );
    _mint(
      msg.sender,
      23206585376031660214193587638946525563951523460783169084504955429354276388865,
      1,
      "https://ipfs.io/ipfs/QmSgfaQ7sK8SguU4u1wTQrUzeoJ8KptAW2KgVmi6AZomBj?filename=8.jpeg"
    );
    _mint(
      msg.sender,
      23206585376031660214193587638946525563951523460783169084504955430453788016641,
      1,
      "https://ipfs.io/ipfs/QmSgfaQ7sK8SguU4u1wTQrUzeoJ8KptAW2KgVmi6AZomBj?filename=9.jpeg"
    );
    _mint(
      msg.sender,
      23206585376031660214193587638946525563951523460783169084504955430453788016631,
      1,
      "https://ipfs.io/ipfs/QmSgfaQ7sK8SguU4u1wTQrUzeoJ8KptAW2KgVmi6AZomBj?filename=10.jpeg"
    );
    _mint(
      msg.sender,
      23206585376031660214193587638946525563951523460783169084504955428254764761011,
      1,
      "https://ipfs.io/ipfs/QmSgfaQ7sK8SguU4u1wTQrUzeoJ8KptAW2KgVmi6AZomBj?filename=11.jpeg"
    );
    _mint(msg.sender, 1000, 1, "");
  }

  function supportsInterface(bytes4 interfaceId) public view override(ERC1155, ERC1155Receiver) returns (bool) {
    return interfaceId == type(IERC1155Receiver).interfaceId || super.supportsInterface(interfaceId);
  }
}
