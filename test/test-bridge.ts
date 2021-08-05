import hre, { ethers, network } from "hardhat";
import { BigNumber, Signer, Wallet } from "ethers";
import { expect } from "chai";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { BadCacheBridge__factory, OpenSeaERC1155__factory, BadCache721__factory } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { MockProvider } from "ethereum-waffle";

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
  // let hre: HardhatRuntimeEnvironment

  before(async () => {
    [owner, wallet, walletTo] = await ethers.getSigners();
    prov = await ethers.getDefaultProvider();

    BridgeFactory = (await ethers.getContractFactory("BadCacheBridge", owner)) as BadCacheBridge__factory;

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
    await Bridge.setProxiedToken(OpenSeaToken.address);
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
      .to.emit(OpenSeaToken, "TransferSingle")
      .withArgs(owner.address, owner.address, Bridge.address, 1, 1);

    expect(await Bridge.checkBalance(owner.address, 1)).to.equals(9);
    expect(await Bridge.checkBalance(Bridge.address, 1)).to.equals(1);
  });

  it("It can update transfers number, senders array and transfers array", async () => {
    expect(await Bridge.callStatic.updateTransfersPublic(owner.address, 1)).to.equals(1);
  });

  it("It can validate a transfer being saved into the Bridge internal storage", async () => {
    expect(await OpenSeaToken.connect(owner).safeTransferFrom(owner.address, Bridge.address, 1, 1, []))
      .to.emit(OpenSeaToken, "TransferSingle")
      .withArgs(owner.address, owner.address, Bridge.address, 1, 1);

    expect(await OpenSeaToken.connect(owner).safeTransferFrom(owner.address, walletTo.address, 1, 1, []))
      .to.emit(OpenSeaToken, "TransferSingle")
      .withArgs(owner.address, owner.address, walletTo.address, 1, 1);

    expect(await OpenSeaToken.connect(walletTo).safeTransferFrom(walletTo.address, Bridge.address, 1, 1, []))
      .to.emit(OpenSeaToken, "TransferSingle")
      .withArgs(walletTo.address, walletTo.address, Bridge.address, 1, 1);

    expect(await Bridge.getTransferCount()).to.equals(2);
    expect(await Bridge.getAddressesThatTransferedIds()).to.eql([owner.address, walletTo.address]);
  });

  it("It can return ids", async () => {
    expect(await OpenSeaToken.connect(owner).safeTransferFrom(owner.address, Bridge.address, 1, 1, []))
      .to.emit(OpenSeaToken, "TransferSingle")
      .withArgs(owner.address, owner.address, Bridge.address, 1, 1);

    let arr = [BigNumber.from("1")];
    expect(await Bridge.getTransferCount()).to.equals(1);

    expect(await Bridge.getIds()).to.eql(arr);
  });

  it("It can mint 721 based on receiving", async () => {
    expect(await OpenSeaToken.connect(owner).safeTransferFrom(owner.address, Bridge.address, 2, 1, []))
      .to.emit(OpenSeaToken, "TransferSingle")
      .withArgs(owner.address, owner.address, Bridge.address, 2, 1);

    expect(await BadCache721.connect(owner).balanceOf(owner.address)).to.equals(2);
  });

  it("Check the uri of a newly minted token", async () => {
    expect(await OpenSeaToken.connect(owner).safeTransferFrom(owner.address, Bridge.address, 3, 1, []))
      .to.emit(OpenSeaToken, "TransferSingle")
      .withArgs(owner.address, owner.address, Bridge.address, 3, 1);

    expect(await BadCache721.connect(owner).tokenURI(3)).to.equals(
      "https://ipfs.io/ipfs/QmPscS43EqfKpWTFSpSLqKi1W84NJrnfPqovfFqRQoyG7c?filename=3.png"
    );
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
