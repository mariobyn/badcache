import hre, { ethers, network } from "hardhat";
import { BigNumber, Signer, Wallet } from "ethers";
import { expect } from "chai";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { BadCacheBridgeTest__factory, OpenSeaERC1155__factory, BadCache721__factory } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("BadCache Bridge Test", () => {
  let Bridge: any;
  let BridgeFactory: any;

  let OpenSeaToken: any;
  let OpenSeaTokenFactory: any;

  let BadCache721: any;
  let BadCache721Factory: any;

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

    OpenSeaTokenFactory = (await ethers.getContractFactory("OpenSeaERC1155", owner)) as OpenSeaERC1155__factory;

    BadCache721Factory = (await ethers.getContractFactory("BadCache721", owner)) as BadCache721__factory;

    Bridge = await (await BridgeFactory).deploy();
    OpenSeaToken = await (await OpenSeaTokenFactory).deploy();
    BadCache721 = await (await BadCache721Factory).deploy("BadCache721", "BadCache721");

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
    expect(await OpenSeaToken.balanceOf(owner.address, 1)).to.equals(10);
    expect(await Bridge.checkBalance(owner.address, 1)).to.equals(10);
    expect(await Bridge.checkBalance(walletTo.address, 1)).to.equals(0);
  });

  it("It can use safeTransferFrom from ERC1155", async () => {
    expect(await OpenSeaToken.balanceOf(owner.address, 1)).to.equals(10);
    expect(await Bridge.checkBalance(owner.address, 1)).to.equals(10);
    expect(await Bridge.checkBalance(walletTo.address, 1)).to.equals(0);

    expect(await OpenSeaToken.connect(owner).safeTransferFrom(owner.address, Bridge.address, 1, 1, []))
      .to.emit(Bridge, "ReceivedTransferFromOpenSea")
      .withArgs(owner.address, owner.address, 1, 1)
      .to.emit(OpenSeaToken, "TransferSingle")
      .withArgs(owner.address, owner.address, Bridge.address, 1, 1);

    expect(await Bridge.checkBalance(owner.address, 1)).to.equals(9);
    expect(await Bridge.checkBalance(Bridge.address, 1)).to.equals(1);
  });

  it("It can update transfers number, senders array and transfers array", async () => {
    expect(await Bridge.callStatic.updateTransfersPublic(owner.address, 1)).to.equals(1);
  });

  it("It can not update transfers number, senders array and transfers array from address(0)", async () => {
    await expect(Bridge.callStatic.updateTransfersPublic("0x0000000000000000000000000000000000000000", 1)).to.be.revertedWith(
      "BadCacheBridge: can not update from the zero address"
    );
  });

  it("It can not update transfers number, senders array and transfers for a token id that does not exists", async () => {
    await expect(Bridge.callStatic.updateTransfersPublic(owner.address, 10000)).to.be.revertedWith(
      "BadCacheBridge: token id does not exists"
    );
  });

  it("It can not mint 721 from address 0", async () => {
    await expect(Bridge.mintBasedOnReceivingPublic("0x0000000000000000000000000000000000000000", 1)).to.be.revertedWith(
      "BadCacheBridge: can not mint a new token to the zero address"
    );
  });

  it("It will not mint a 721 because it was already minted", async () => {
    await Bridge.mintBasedOnReceivingPublic(walletTest1.address, 4);
    expect(await BadCache721.connect(owner).balanceOf(walletTest1.address)).to.equals(1);
    await expect(Bridge.mintBasedOnReceivingPublic(walletTest1.address, 4)).to.be.revertedWith(
      "BadCacheBridge: token already minted"
    );
  });

  it("It can not mint 721 for a token that does not exists", async () => {
    await expect(Bridge.mintBasedOnReceivingPublic(owner.address, 1000)).to.be.revertedWith(
      "BadCacheBridge: token id does not exists"
    );
  });

  it("It can validate a transfer being saved into the Bridge internal storage", async () => {
    expect(await OpenSeaToken.connect(owner).safeTransferFrom(owner.address, Bridge.address, 5, 1, []))
      .to.emit(Bridge, "ReceivedTransferFromOpenSea")
      .withArgs(owner.address, owner.address, 5, 1)
      .to.emit(OpenSeaToken, "TransferSingle")
      .withArgs(owner.address, owner.address, Bridge.address, 5, 1);

    expect(await OpenSeaToken.connect(owner).safeTransferFrom(owner.address, walletTest2.address, 6, 1, []))
      .to.emit(OpenSeaToken, "TransferSingle")
      .withArgs(owner.address, owner.address, walletTest2.address, 6, 1);

    await expect(OpenSeaToken.connect(walletTest2).safeTransferFrom(walletTest2.address, Bridge.address, 6, 1, []))
      .to.emit(Bridge, "ReceivedTransferFromOpenSea")
      .withArgs(walletTest2.address, walletTest2.address, 6, 1)
      .to.emit(OpenSeaToken, "TransferSingle")
      .withArgs(walletTest2.address, walletTest2.address, Bridge.address, 6, 1);

    expect(await Bridge.getTransferCount()).to.equals(2);
    expect(await Bridge.getAddressesThatTransferedIds()).to.eql([owner.address, walletTest2.address]);
  });

  it("It can not accept a token from not an owner", async () => {
    await expect(OpenSeaToken.connect(owner).safeTransferFrom(walletTo.address, Bridge.address, 1, 1, [])).to.be.revertedWith(
      "ERC1155: caller is not owner nor approved"
    );
  });

  it("It can not accept a token that is not allowed", async () => {
    await expect(OpenSeaToken.connect(owner).safeTransferFrom(owner.address, Bridge.address, 1000, 1, [])).to.be.revertedWith(
      "BadCacheBridge: token id does not exists"
    );
  });

  it("It can return ids", async () => {
    expect(await OpenSeaToken.connect(owner).safeTransferFrom(owner.address, Bridge.address, 7, 1, []))
      .to.emit(Bridge, "ReceivedTransferFromOpenSea")
      .withArgs(owner.address, owner.address, 7, 1)
      .to.emit(OpenSeaToken, "TransferSingle")
      .withArgs(owner.address, owner.address, Bridge.address, 7, 1);

    //There are 7 transfers done till here if you run all tests, otherwise you need to adjust accordingly
    let arr = [BigNumber.from("7")];
    expect(await Bridge.getTransferCount()).to.equals(1);

    expect(await Bridge.getIds()).to.eql(arr);
  });

  it("It can mint 721 based on receiving", async () => {
    expect(await OpenSeaToken.connect(owner).safeTransferFrom(owner.address, walletTest3.address, 2, 1, []))
      .to.emit(OpenSeaToken, "TransferSingle")
      .withArgs(owner.address, owner.address, walletTest3.address, 2, 1);

    expect(await OpenSeaToken.connect(walletTest3).safeTransferFrom(walletTest3.address, Bridge.address, 2, 1, []))
      .to.emit(Bridge, "ReceivedTransferFromOpenSea")
      .withArgs(walletTest3.address, walletTest3.address, 2, 1)
      .to.emit(OpenSeaToken, "TransferSingle")
      .withArgs(walletTest3.address, walletTest3.address, Bridge.address, 2, 1);

    expect(await BadCache721.connect(walletTest3).balanceOf(walletTest3.address)).to.equals(1);
  });

  it("Check the uri of a newly minted token", async () => {
    expect(await OpenSeaToken.connect(owner).safeTransferFrom(owner.address, Bridge.address, 3, 1, []))
      .to.emit(Bridge, "ReceivedTransferFromOpenSea")
      .withArgs(owner.address, owner.address, 3, 1)
      .to.emit(OpenSeaToken, "TransferSingle")
      .withArgs(owner.address, owner.address, Bridge.address, 3, 1);

    expect(await BadCache721.connect(owner).tokenURI(3)).to.equals(
      "https://ipfs.io/ipfs/QmPscS43EqfKpWTFSpSLqKi1W84NJrnfPqovfFqRQoyG7c?filename=3.png"
    );
  });

  xit("Check  transfer of new token", async () => {
    expect(
      await OpenSeaToken.connect(owner).safeTransferFrom(
        owner.address,
        owner.address,
        "85601406272210854214775655996269203562327957411057160318308680267934449270785",
        1,
        []
      )
    )
      .to.emit(Bridge, "ReceivedTransferFromOpenSea")
      .withArgs(owner.address, Bridge.address, "85601406272210854214775655996269203562327957411057160318308680267934449270785", 1)
      .to.emit(OpenSeaToken, "TransferSingle")
      .withArgs(
        owner.address,
        owner.address,
        Bridge.address,
        "85601406272210854214775655996269203562327957411057160318308680267934449270785",
        1
      );

    expect(
      await BadCache721.connect(owner).tokenURI("85601406272210854214775655996269203562327957411057160318308680267934449270785")
    ).to.equals("https://ipfs.io/ipfs/QmaNsZbtuJ66NUJMkhynTmjpjkkwy6BWhp4JvyjGginETN/60.png");
  });

  //This one should be used only with hardhat network cause hardhat network is forking the mainnate so the account and the opentoken from opensea
  // xit("It can check balance of impersonator", async () => {
  //   await hre.network.provider.request({
  //     method: "hardhat_impersonateAccount",
  //     params: ["0x358100c75A442a1A40D9aa0662269d320D7F0F2e"],
  //   });

  //   //OpenSea Shared Storefront (OPENSTORE) https://etherscan.io/address/0x495f947276749ce646f68ac8c248420045cb7b5e
  //   await Bridge.setProxiedToken("0x495f947276749Ce646f68AC8c248420045cb7b5e");
  //   //Owner of BadCache: https://opensea.io/assets/0x495f947276749ce646f68ac8c248420045cb7b5e/85601406272210854214775655996269203562327957411057160318308680236048612065281
  //   // https://etherscan.io/address/0x358100c75A442a1A40D9aa0662269d320D7F0F2e (zerobeta.eth)
  //   owner = await ethers.getSigner("0x358100c75A442a1A40D9aa0662269d320D7F0F2e");

  //   expect(
  //     await Bridge.checkBalance(owner.address, "85601406272210854214775655996269203562327957411057160318308680236048612065281")
  //   ).to.equals(1);

  //   await hre.network.provider.request({
  //     method: "hardhat_stopImpersonatingAccount",
  //     params: ["0x358100c75A442a1A40D9aa0662269d320D7F0F2e"],
  //   });
  // });
});
