import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { expect } from "chai";

import { BadCache__factory, RestoredCache__factory } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("ReversedCache All in one Test", () => {
  let BadCache721: any;
  let BadCache721Factory: any;

  let RestoredCache: any;
  let RestoredCacheFactory: any;

  let owner: SignerWithAddress;

  let provider: any;

  let wallet: any;

  before(async () => {
    [owner, wallet] = await ethers.getSigners();
    provider = await ethers.provider;

    BadCache721Factory = (await ethers.getContractFactory("BadCache", wallet)) as BadCache__factory;
    BadCache721 = await (await BadCache721Factory).deploy("BadCache", "BadCache");

    RestoredCacheFactory = (await ethers.getContractFactory("RestoredCache", owner)) as RestoredCache__factory;
    RestoredCache = await (await RestoredCacheFactory).deploy();

    expect(BadCache721.address).to.not.undefined;
    expect(RestoredCache.address).to.not.undefined;

    await RestoredCache.changeBaseTokenURI("https://facebook.com/");
    await RestoredCache.connect(owner).setBadCache721ProxiedAddress(BadCache721.address);
  });

  it("It can not set BadCache721 Proxy Address to address zero", async () => {
    await expect(RestoredCache.connect(owner).setBadCache721ProxiedAddress(ethers.constants.AddressZero)).to.be.revertedWith(
      "Can't set to the address 0"
    );
  });

  it("It can purchase a RestoredCache as BadCache 721 Holder", async () => {
    await BadCache721.connect(wallet).mint(owner.address, 1);
    expect(await BadCache721.ownerOf(1)).to.equals(owner.address);

    expect(
      await RestoredCache.purchase(1, 1, {
        from: owner.address,
        value: ethers.utils.parseEther("0.1"),
      })
    )
      .to.emit(RestoredCache, "MintedRestoredCache")
      .withArgs(owner.address, 1);
  });

  it("It can not purchase a RestoredCache due to not being a BadCache holder and pause = true", async () => {
    await expect(
      RestoredCache.purchase(2, 1, {
        from: owner.address,
        value: ethers.utils.parseEther("0.1"),
      })
    ).to.be.revertedWith("Sender has problems with BadCache721");
  });

  it("Checks the uri of a newly bought RestoredCache as BadCache 721 Holder", async () => {
    await RestoredCache.changeBaseTokenURI("https://facebook.com/");

    await BadCache721.connect(wallet).mint(owner.address, 3);
    expect(await BadCache721.ownerOf(3)).to.equals(owner.address);

    expect(
      await RestoredCache.purchase(3, 1, {
        from: owner.address,
        value: ethers.utils.parseEther("0.1"),
      })
    )
      .to.emit(RestoredCache, "MintedRestoredCache")
      .withArgs(owner.address, 3);

    expect(await RestoredCache.ownerOf(3)).to.equals(owner.address);
    expect(await RestoredCache.tokenURI(3)).to.equals("https://facebook.com/3");
  });

  it("It can not purchase a RestoredCache due to not being the owner of a BadCache and pause = true", async () => {
    await BadCache721.connect(wallet).mint(wallet.address, 4);
    expect(await BadCache721.ownerOf(4)).to.equals(wallet.address);

    await expect(
      RestoredCache.purchase(4, 1, {
        from: owner.address,
        value: ethers.utils.parseEther("0.1"),
      })
    ).to.be.revertedWith("Sender has problems with BadCache721");
  });

  it("Only Owner can set paused", async () => {
    await expect(RestoredCache.connect(owner).setPaused(false)).to.not.be.reverted;
    await expect(RestoredCache.connect(wallet).setPaused(false)).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(RestoredCache.connect(owner).setPaused(true)).to.not.be.reverted;
  });
  it("Only Owner can set bank", async () => {
    await expect(RestoredCache.connect(owner).setBank(wallet.address)).to.not.be.reverted;
    await expect(RestoredCache.connect(wallet).setPaused(false)).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(RestoredCache.connect(owner).setPaused(true)).to.not.be.reverted;
  });

  it("It can purchase a RestoreCache even if it is not a holder of BadCache 721 because pause = false", async () => {
    await expect(RestoredCache.connect(owner).setPaused(false)).to.not.be.reverted;

    expect(
      await RestoredCache.purchase(5, 1, {
        from: owner.address,
        value: ethers.utils.parseEther("0.1"),
      })
    )
      .to.emit(RestoredCache, "MintedRestoredCache")
      .withArgs(owner.address, 5);

    await expect(RestoredCache.connect(owner).setPaused(true)).to.not.be.reverted;
  });
});
