import hre, { ethers, network } from "hardhat";
import { BigNumber, Signer, Wallet } from "ethers";
import { expect } from "chai";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import {
  BadCacheBridge__factory,
  BadCache__factory,
  OpenSeaERC1155,
  OpenSeaERC1155__factory,
  OpenSeaIERC1155__factory,
  TestToken__factory,
} from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { MockProvider } from "ethereum-waffle";

describe("BadCache Bridge Test", () => {
  let Bridge: any;
  let BridgeFactory: any;

  let BadCache: any;
  let BadCacheFactory: any;

  let OpenSeaToken: any;
  let OpenSeaTokenFactory: any;

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

    BadCacheFactory = (await ethers.getContractFactory("BadCache", owner)) as BadCache__factory;

    Bridge = await (await BridgeFactory).deploy();
    BadCache = await (await BadCacheFactory).deploy("BadCache", "BadCache");
    OpenSeaToken = await (await OpenSeaTokenFactory).deploy();

    expect(Bridge.address).to.not.undefined;
    expect(BadCache.address).to.not.undefined;
    expect(OpenSeaToken.address).to.not.undefined;
    console.log("Created OpenSea Custom ERC1155 Token: " + OpenSeaToken.address);
  });

  xit("It checks balances of the owner address and the wallet that we need to transfer too using the token and bridge", async () => {
    await Bridge.setProxiedToken(OpenSeaToken.address);

    expect(await OpenSeaToken.balanceOf(owner.address, 1)).to.equals(10);
    expect(await Bridge.checkBalance(owner.address, 1)).to.equals(10);
    expect(await Bridge.checkBalance(walletTo.address, 1)).to.equals(0);
  });

  xit("It can use safeTransferFrom from ERC1155", async () => {
    await Bridge.setProxiedToken(OpenSeaToken.address);

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
    await Bridge.setProxiedToken(OpenSeaToken.address);
    await Bridge.connect(owner).resetState();
    expect(await Bridge.callStatic.updateTransfersPublic(owner.address, 1)).to.equals(1);
  });

  it("It can validate a transfer being saved into the Bridge internal storage", async () => {
    await Bridge.setProxiedToken(OpenSeaToken.address);
    await Bridge.connect(owner).resetState();
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

  //This one should be used only with hardhat network cause hardhat network is forking the mainnate so the account and the opentoken from opensea
  xit("It can check balance of impersonator", async () => {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0x358100c75A442a1A40D9aa0662269d320D7F0F2e"],
    });

    //OpenSea Shared Storefront (OPENSTORE) https://etherscan.io/address/0x495f947276749ce646f68ac8c248420045cb7b5e
    await Bridge.setProxiedToken("0x495f947276749Ce646f68AC8c248420045cb7b5e");
    //Owner of BadCache: https://opensea.io/assets/0x495f947276749ce646f68ac8c248420045cb7b5e/85601406272210854214775655996269203562327957411057160318308680236048612065281
    // https://etherscan.io/address/0x358100c75A442a1A40D9aa0662269d320D7F0F2e (zerobeta.eth)
    owner = await ethers.getSigner("0x358100c75A442a1A40D9aa0662269d320D7F0F2e");

    expect(
      await Bridge.checkBalance(owner.address, "85601406272210854214775655996269203562327957411057160318308680236048612065281")
    ).to.equals(1);

    await hre.network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: ["0x358100c75A442a1A40D9aa0662269d320D7F0F2e"],
    });
  });
});
