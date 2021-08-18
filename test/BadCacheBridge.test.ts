import hre, { ethers, network } from "hardhat";
import { BigNumber, Signer, Wallet } from "ethers";
import { expect } from "chai";

import {
  BadCacheBridgeTest__factory,
  OpenSeaERC1155__factory,
  BadCache__factory,
  BadCacheHolder__factory,
  OpenSeaERC1155Hack__factory,
} from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("BadCache Bridge Test", () => {
  let Bridge: any;
  let BridgeFactory: any;

  let OpenSeaToken: any;
  let OpenSeaTokenHack: any;
  let OpenSeaTokenFactory: any;
  let OpenSeaTokenFactoryHack: any;

  let BadCache721: any;
  let BadCache721Factory: any;
  let BadCacheHolder: any;
  let BadCacheHolderFactory: any;

  let owner: SignerWithAddress;

  let prov: any;

  let wallet: any;
  let walletTo: any;
  let walletTest1: any;
  let walletTest2: any;
  let walletTest3: any;

  before(async () => {
    [owner, wallet, walletTo, walletTest1, walletTest2, walletTest3] = await ethers.getSigners();
    prov = await ethers.getDefaultProvider();

    BridgeFactory = (await ethers.getContractFactory("BadCacheBridgeTest", owner)) as BadCacheBridgeTest__factory;

    // we mimic an ERC1155 from OpenSea just for testing purposes
    OpenSeaTokenFactoryHack = (await ethers.getContractFactory("OpenSeaERC1155Hack", owner)) as OpenSeaERC1155Hack__factory;
    OpenSeaTokenFactory = (await ethers.getContractFactory("OpenSeaERC1155", owner)) as OpenSeaERC1155__factory;

    BadCache721Factory = (await ethers.getContractFactory("BadCache", owner)) as BadCache__factory;

    Bridge = await (await BridgeFactory).deploy();
    OpenSeaToken = await (await OpenSeaTokenFactory).deploy();
    OpenSeaTokenHack = await (await OpenSeaTokenFactoryHack).deploy();
    BadCache721 = await (await BadCache721Factory).deploy("BadCache", "BadCache");

    expect(Bridge.address).to.not.undefined;
    expect(OpenSeaToken.address).to.not.undefined;
    expect(BadCache721.address).to.not.undefined;
    await BadCache721.connect(owner).transferOwnership(Bridge.address);
    console.log("Created OpenSea Custom ERC1155 Token: " + OpenSeaToken.address);
  });

  beforeEach(async () => {
    await Bridge.connect(owner).setProxiedToken(OpenSeaToken.address);
    await Bridge.connect(owner).setBadCache721(BadCache721.address);
    await Bridge.connect(owner).resetState();
  });

  it("It checks balances of the owner address and the wallet that we need to transfer to using the token and bridge", async () => {
    expect(
      await OpenSeaToken.balanceOf(owner.address, "23206585376031660214193587638946525563951523460783169084504955421657694994433")
    ).to.equals(1);
    expect(
      await Bridge.checkBalance(owner.address, "23206585376031660214193587638946525563951523460783169084504955421657694994433")
    ).to.equals(1);
    expect(
      await Bridge.checkBalance(walletTo.address, "23206585376031660214193587638946525563951523460783169084504955421657694994433")
    ).to.equals(0);
  });

  it("It can use safeTransferFrom from ERC1155", async () => {
    expect(
      await OpenSeaToken.balanceOf(owner.address, "23206585376031660214193587638946525563951523460783169084504955421657694994433")
    ).to.equals(1);
    expect(
      await Bridge.checkBalance(owner.address, "23206585376031660214193587638946525563951523460783169084504955421657694994433")
    ).to.equals(1);
    expect(
      await Bridge.checkBalance(walletTo.address, "23206585376031660214193587638946525563951523460783169084504955421657694994433")
    ).to.equals(0);

    expect(
      await OpenSeaToken.connect(owner).safeTransferFrom(
        owner.address,
        Bridge.address,
        "23206585376031660214193587638946525563951523460783169084504955421657694994433",
        1,
        []
      )
    )
      .to.emit(Bridge, "ReceivedTransferFromOpenSea")
      .withArgs(owner.address, owner.address, "23206585376031660214193587638946525563951523460783169084504955421657694994433", 1)
      .to.emit(OpenSeaToken, "TransferSingle")
      .withArgs(
        owner.address,
        owner.address,
        Bridge.address,
        "23206585376031660214193587638946525563951523460783169084504955421657694994433",
        1
      );

    expect(
      await Bridge.checkBalance(owner.address, "23206585376031660214193587638946525563951523460783169084504955421657694994433")
    ).to.equals(0);
    expect(
      await Bridge.checkBalance(Bridge.address, "23206585376031660214193587638946525563951523460783169084504955421657694994433")
    ).to.equals(1);
  });

  it("It can not safeTransferFrom from ERC1155 that is not OpenSea", async () => {
    expect(
      await OpenSeaTokenHack.balanceOf(
        owner.address,
        "23206585376031660214193587638946525563951523460783169084504955430453788016631"
      )
    ).to.equals(1);
    expect(
      await Bridge.checkBalance(owner.address, "23206585376031660214193587638946525563951523460783169084504955430453788016631")
    ).to.equals(1);
    expect(
      await Bridge.checkBalance(walletTo.address, "23206585376031660214193587638946525563951523460783169084504955430453788016631")
    ).to.equals(0);

    await expect(
      OpenSeaTokenHack.connect(owner).safeTransferFrom(
        owner.address,
        Bridge.address,
        "23206585376031660214193587638946525563951523460783169084504955430453788016631",
        1,
        []
      )
    ).to.be.revertedWith("BadCacheBridge: This is not an OpenSea token");

    expect(
      await Bridge.checkBalance(owner.address, "23206585376031660214193587638946525563951523460783169084504955430453788016631")
    ).to.equals(1);
    expect(
      await Bridge.checkBalance(Bridge.address, "23206585376031660214193587638946525563951523460783169084504955430453788016631")
    ).to.equals(0);
  });

  it("It can update transfers number, senders array and transfers array", async () => {
    expect(
      await Bridge.callStatic.updateTransfersPublic(
        owner.address,
        "23206585376031660214193587638946525563951523460783169084504955421657694994433"
      )
    ).to.equals(1);
  });

  it("It can not update transfers number, senders array and transfers array from address(0)", async () => {
    await expect(
      Bridge.callStatic.updateTransfersPublic(
        "0x0000000000000000000000000000000000000000",
        "23206585376031660214193587638946525563951523460783169084504955421657694994433"
      )
    ).to.be.revertedWith("BadCacheBridge: can not update from the zero address");
  });

  it("It can not update transfers number, senders array and transfers for a token id that does not exists", async () => {
    await expect(Bridge.callStatic.updateTransfersPublic(owner.address, 10000)).to.be.revertedWith(
      "BadCacheBridge: token id does not exists"
    );
  });

  it("It can not mint 721 from address 0", async () => {
    await expect(
      Bridge.mintBasedOnReceivingPublic(
        "0x0000000000000000000000000000000000000000",
        "23206585376031660214193587638946525563951523460783169084504955421657694994433"
      )
    ).to.be.revertedWith("BadCacheBridge: can not mint a new token to the zero address");
  });

  it("It will not mint a 721 because it was already minted", async () => {
    await Bridge.mintBasedOnReceivingPublic(
      walletTest1.address,
      "23206585376031660214193587638946525563951523460783169084504955429354276388865"
    );
    expect(await BadCache721.connect(owner).balanceOf(walletTest1.address)).to.equals(1);
    await expect(
      Bridge.mintBasedOnReceivingPublic(
        walletTest1.address,
        "23206585376031660214193587638946525563951523460783169084504955429354276388865"
      )
    ).to.be.revertedWith("BadCacheBridge: token already minted");
  });

  it("It can not mint 721 for a token that does not exists", async () => {
    await expect(Bridge.mintBasedOnReceivingPublic(owner.address, 1000)).to.be.revertedWith(
      "BadCacheBridge: token id does not exists"
    );
  });

  it("It can validate a transfer being saved into the Bridge internal storage", async () => {
    expect(
      await OpenSeaToken.connect(owner).safeTransferFrom(
        owner.address,
        Bridge.address,
        "23206585376031660214193587638946525563951523460783169084504955426055741505537",
        1,
        []
      )
    )
      .to.emit(Bridge, "ReceivedTransferFromOpenSea")
      .withArgs(owner.address, owner.address, "23206585376031660214193587638946525563951523460783169084504955426055741505537", 1)
      .to.emit(OpenSeaToken, "TransferSingle")
      .withArgs(
        owner.address,
        owner.address,
        Bridge.address,
        "23206585376031660214193587638946525563951523460783169084504955426055741505537",
        1
      );

    expect(
      await OpenSeaToken.connect(owner).safeTransferFrom(
        owner.address,
        walletTest2.address,
        "23206585376031660214193587638946525563951523460783169084504955427155253133313",
        1,
        []
      )
    )
      .to.emit(OpenSeaToken, "TransferSingle")
      .withArgs(
        owner.address,
        owner.address,
        walletTest2.address,
        "23206585376031660214193587638946525563951523460783169084504955427155253133313",
        1
      );

    await expect(
      OpenSeaToken.connect(walletTest2).safeTransferFrom(
        walletTest2.address,
        Bridge.address,
        "23206585376031660214193587638946525563951523460783169084504955427155253133313",
        1,
        []
      )
    )
      .to.emit(Bridge, "ReceivedTransferFromOpenSea")
      .withArgs(
        walletTest2.address,
        walletTest2.address,
        "23206585376031660214193587638946525563951523460783169084504955427155253133313",
        1
      )
      .to.emit(OpenSeaToken, "TransferSingle")
      .withArgs(
        walletTest2.address,
        walletTest2.address,
        Bridge.address,
        "23206585376031660214193587638946525563951523460783169084504955427155253133313",
        1
      );

    expect(await Bridge.getTransferCount()).to.equals(2);
    expect(await Bridge.getAddressesThatTransferedIds()).to.eql([owner.address, walletTest2.address]);
  });

  it("It can not accept a token from not an owner", async () => {
    await expect(
      OpenSeaToken.connect(owner).safeTransferFrom(
        walletTo.address,
        Bridge.address,
        "23206585376031660214193587638946525563951523460783169084504955421657694994433",
        1,
        []
      )
    ).to.be.revertedWith("ERC1155: caller is not owner nor approved");
  });

  //create a test to reverse transfer a 721 to 1155

  it("It can not accept a token that is not allowed", async () => {
    await expect(OpenSeaToken.connect(owner).safeTransferFrom(owner.address, Bridge.address, 1000, 1, [])).to.be.revertedWith(
      "BadCacheBridge: token id does not exists"
    );
  });

  it("It can return ids", async () => {
    expect(
      await OpenSeaToken.connect(owner).safeTransferFrom(
        owner.address,
        Bridge.address,
        "23206585376031660214193587638946525563951523460783169084504955428254764761089",
        1,
        []
      )
    )
      .to.emit(Bridge, "ReceivedTransferFromOpenSea")
      .withArgs(owner.address, owner.address, "23206585376031660214193587638946525563951523460783169084504955428254764761089", 1)
      .to.emit(OpenSeaToken, "TransferSingle")
      .withArgs(
        owner.address,
        owner.address,
        Bridge.address,
        "23206585376031660214193587638946525563951523460783169084504955428254764761089",
        1
      );

    //There are 7 transfers done till here if you run all tests, otherwise you need to adjust accordingly
    let arr = [BigNumber.from("23206585376031660214193587638946525563951523460783169084504955428254764761089")];
    expect(await Bridge.getTransferCount()).to.equals(1);

    expect(await Bridge.getIds()).to.eql(arr);
  });

  it("It can mint 721 based on receiving", async () => {
    expect(
      await OpenSeaToken.connect(owner).safeTransferFrom(
        owner.address,
        walletTest3.address,
        "23206585376031660214193587638946525563951523460783169084504955422757206622209",
        1,
        []
      )
    )
      .to.emit(OpenSeaToken, "TransferSingle")
      .withArgs(
        owner.address,
        owner.address,
        walletTest3.address,
        "23206585376031660214193587638946525563951523460783169084504955422757206622209",
        1
      );

    expect(
      await OpenSeaToken.connect(walletTest3).safeTransferFrom(
        walletTest3.address,
        Bridge.address,
        "23206585376031660214193587638946525563951523460783169084504955422757206622209",
        1,
        []
      )
    )
      .to.emit(Bridge, "ReceivedTransferFromOpenSea")
      .withArgs(
        walletTest3.address,
        walletTest3.address,
        "23206585376031660214193587638946525563951523460783169084504955422757206622209",
        1
      )
      .to.emit(OpenSeaToken, "TransferSingle")
      .withArgs(
        walletTest3.address,
        walletTest3.address,
        Bridge.address,
        "23206585376031660214193587638946525563951523460783169084504955422757206622209",
        1
      );

    expect(await BadCache721.connect(walletTest3).balanceOf(walletTest3.address)).to.equals(1);
  });

  it("Check the uri of a newly minted token", async () => {
    expect(
      await OpenSeaToken.connect(owner).safeTransferFrom(
        owner.address,
        Bridge.address,
        "23206585376031660214193587638946525563951523460783169084504955423856718249985",
        1,
        []
      )
    )
      .to.emit(Bridge, "ReceivedTransferFromOpenSea")
      .withArgs(owner.address, owner.address, "23206585376031660214193587638946525563951523460783169084504955423856718249985", 1)
      .to.emit(OpenSeaToken, "TransferSingle")
      .withArgs(
        owner.address,
        owner.address,
        Bridge.address,
        "23206585376031660214193587638946525563951523460783169084504955423856718249985",
        1
      );

    expect(await BadCache721.connect(owner).tokenURI(3)).to.equals(
      "https://ipfs.io/ipfs/QmSgfaQ7sK8SguU4u1wTQrUzeoJ8KptAW2KgVmi6AZomBj?filename=3.jpeg"
    );
  });

  it("Check the ID of a newly minted token", async () => {
    expect(
      await OpenSeaToken.connect(owner).safeTransferFrom(
        owner.address,
        Bridge.address,
        "23206585376031660214193587638946525563951523460783169084504955430453788016641",
        1,
        []
      )
    )
      .to.emit(Bridge, "ReceivedTransferFromOpenSea")
      .withArgs(owner.address, owner.address, "23206585376031660214193587638946525563951523460783169084504955430453788016641", 1)
      .to.emit(OpenSeaToken, "TransferSingle")
      .withArgs(
        owner.address,
        owner.address,
        Bridge.address,
        "23206585376031660214193587638946525563951523460783169084504955430453788016641",
        1
      );

    expect(await BadCache721.connect(owner).ownerOf(9)).to.equals(owner.address);
  });

  it("It verified max id for BadCache721", async () => {
    expect(
      await OpenSeaToken.connect(owner).safeTransferFrom(
        owner.address,
        Bridge.address,
        "23206585376031660214193587638946525563951523460783169084504955430453788016611",
        1,
        []
      )
    )
      .to.emit(Bridge, "ReceivedTransferFromOpenSea")
      .withArgs(owner.address, owner.address, "23206585376031660214193587638946525563951523460783169084504955430453788016611", 1)
      .to.emit(OpenSeaToken, "TransferSingle")
      .withArgs(
        owner.address,
        owner.address,
        Bridge.address,
        "23206585376031660214193587638946525563951523460783169084504955430453788016611",
        1
      );

    expect(await BadCache721.connect(owner).getMaxId()).to.equals(11);
  });

  it("It can mint custom 721", async () => {
    expect(
      await Bridge.connect(owner).mintBadCache721(
        100000,
        "https://ipfs.io/ipfs/QmSgfaQ7sK8SguU4u1wTQrUzeoJ8KptAW2KgVmi6AZomBj?filename=CUSTOM.jpeg",
        walletTest3.address
      )
    )
      .to.emit(Bridge, "MintedBadCache721")
      .withArgs(walletTest3.address, 100000);

    let arr = [BigNumber.from(100000)];
    expect(await Bridge.getCustomIds()).to.eql(arr);
  });

  it("It can not mint custom 721 that was already minted", async () => {
    expect(
      await Bridge.connect(owner).mintBadCache721(
        100001,
        "https://ipfs.io/ipfs/QmSgfaQ7sK8SguU4u1wTQrUzeoJ8KptAW2KgVmi6AZomBj?filename=CUSTOM.jpeg",
        walletTest3.address
      )
    )
      .to.emit(Bridge, "MintedBadCache721")
      .withArgs(walletTest3.address, 100001);

    await expect(
      Bridge.connect(owner).mintBadCache721(
        100001,
        "https://ipfs.io/ipfs/QmSgfaQ7sK8SguU4u1wTQrUzeoJ8KptAW2KgVmi6AZomBj?filename=CUSTOM.jpeg",
        walletTest3.address
      )
    ).to.be.revertedWith("BadCacheBridge: token already minted");
  });

  it("It can not mint custom 721 by not the bridge owner", async () => {
    await expect(
      Bridge.connect(walletTest3).mintBadCache721(
        100001,
        "https://ipfs.io/ipfs/QmSgfaQ7sK8SguU4u1wTQrUzeoJ8KptAW2KgVmi6AZomBj?filename=CUSTOM.jpeg",
        walletTest3.address
      )
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("It can not addAllowedTokens by not the birdge owner", async () => {
    await expect(
      Bridge.connect(walletTest3).addAllowedToken(
        100000,
        "https://ipfs.io/ipfs/QmSgfaQ7sK8SguU4u1wTQrUzeoJ8KptAW2KgVmi6AZomBj?filename=CUSTOM.jpeg",
        100
      )
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  //hardhat issue, this test needs to be solved
  // it("It can send BadCache721 and send back 1155", async () => {
  //   expect(
  //     await OpenSeaToken.connect(owner).safeTransferFrom(
  //       owner.address,
  //       Bridge.address,
  //       "23206585376031660214193587638946525563951523460783169084504955428254764761089",
  //       1,
  //       []
  //     )
  //   )
  //     .to.emit(Bridge, "ReceivedTransferFromOpenSea")
  //     .withArgs(owner.address, owner.address, "23206585376031660214193587638946525563951523460783169084504955428254764761089", 1)
  //     .to.emit(OpenSeaToken, "TransferSingle")
  //     .withArgs(
  //       owner.address,
  //       owner.address,
  //       Bridge.address,
  //       "23206585376031660214193587638946525563951523460783169084504955428254764761089",
  //       1
  //     );

  //   expect(await BadCache721.connect(owner).ownerOf(7)).to.equals(owner.address);
  //   console.log("Sender " + owner.address);
  //   console.log("bridge " + Bridge.address);
  //   expect(await BadCache721.connect(owner).safeTransferFrom(owner.address, Bridge.address, 7))
  //     .to.emit(Bridge, "ReceivedTransferFromBadCache721")
  //     .withArgs(owner.address, Bridge.address, 7);
  //   expect(
  //     await OpenSeaToken.connect(owner).balanceOf(
  //       owner.address,
  //       "23206585376031660214193587638946525563951523460783169084504955428254764761089"
  //     )
  //   ).to.equals(1);
  // });

  // it("It test", async () => {
  //   await BadCache721.connect(owner).mint(owner.address, 100);
  //   console.log("Bridge " + Bridge.address);
  //   console.log("Owner Of " + (await BadCache721.ownerOf(100)));
  //   console.log("Owner " + owner.address);

  //   await BadCache721.safeTransferFrom(owner.address, BadCacheHolder.address, 100);
  //   // expect(await BadCache721.safeTransferFrom(owner.address, BadCacheHolder.address, 100))
  //   //   .to.emit(BadCacheHolder, "ReceivedTransferFromBadCache721")
  //   //   .withArgs(owner.address, BadCacheHolder.address, 100);
  //   // expect(await BadCache721.connect(owner).ownerOf(100)).to.equals(BadCacheHolder.address);
  // });

  it("It can transfer ownership of BadCache721", async () => {
    await Bridge.connect(owner).transferOwnershipOf721(walletTest3.address);
    expect(await BadCache721.connect(walletTest3).owner()).to.equals(walletTest3.address);
  });

  it("It can not transfer ownership of BadCache721 to the zero address", async () => {
    await expect(Bridge.connect(owner).transferOwnershipOf721("0x0000000000000000000000000000000000000000")).to.be.revertedWith(
      "BadCacheBridge: new owner can not be the zero address"
    );
  });
});
