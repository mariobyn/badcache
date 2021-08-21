import hre, { ethers, network } from "hardhat";
import { BigNumber, Signer, Wallet } from "ethers";
import { expect } from "chai";

import { BadCache__factory, RestoredCacheMinterRinkeby__factory, RestoredCache__factory } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { exec } from "child_process";

describe("ReversedCache Test", () => {
  let BadCache721: any;
  let BadCache721Factory: any;

  let RestoredCache: any;
  let RestoredCacheFactory: any;

  let RestoredCacheMinter: any;
  let RestoredCacheMinterFactory: any;

  let owner: SignerWithAddress;

  let wallet: any;

  before(async () => {
    [owner, wallet] = await ethers.getSigners();

    BadCache721Factory = (await ethers.getContractFactory("BadCache", owner)) as BadCache__factory;
    BadCache721 = await (await BadCache721Factory).deploy("BadCache", "BadCache");

    RestoredCacheFactory = (await ethers.getContractFactory("RestoredCache", owner)) as RestoredCache__factory;
    RestoredCache = await (await RestoredCacheFactory).deploy("RestoredCache", "RestoredCache");

    RestoredCacheMinterFactory = (await ethers.getContractFactory(
      "RestoredCacheMinterRinkeby",
      owner
    )) as RestoredCacheMinterRinkeby__factory;
    RestoredCacheMinter = await (await RestoredCacheMinterFactory).deploy();

    expect(BadCache721.address).to.not.undefined;
    expect(RestoredCache.address).to.not.undefined;
    expect(RestoredCacheMinter.address).to.not.undefined;

    await RestoredCacheMinter.connect(owner).setBadCache721ProxiedAddress(BadCache721.address);
    await RestoredCacheMinter.connect(owner).setRestoredCacheProxiedAddress(RestoredCache.address);
    await RestoredCache.connect(owner).transferOwnership(RestoredCacheMinter.address);
  });

  it("It can not set BadCache721 Proxy Address to address zero", async () => {
    await expect(
      RestoredCacheMinter.connect(owner).setBadCache721ProxiedAddress(ethers.constants.AddressZero)
    ).to.be.revertedWith("BadCacheBridge: can not set as BadCache721 the address zero");
  });

  it("It can not set RestoredCache Proxy Address to address zero", async () => {
    await expect(
      RestoredCacheMinter.connect(owner).setRestoredCacheProxiedAddress(ethers.constants.AddressZero)
    ).to.be.revertedWith("BadCacheBridge: can not set as RestoredCache the address zero");
  });

  it("It can set amount of ETH per metadata type", async () => {
    await RestoredCacheMinter.connect(owner).setAmountPerType(1, ethers.utils.parseEther("0.3"));
    expect(await RestoredCacheMinter.getAmountPerType(1)).to.equals(ethers.utils.parseEther("0.3"));
  });

  it("It can not set amount of ETH per metadata type for a negative type", async () => {
    await expect(RestoredCacheMinter.connect(owner).setAmountPerType(257, ethers.utils.parseEther("0.3"))).to.be.reverted;
  });

  it("It can replace an amount of ETH of an already set metadata type", async () => {
    await RestoredCacheMinter.connect(owner).setAmountPerType(1, ethers.utils.parseEther("0.3"));
    expect(await RestoredCacheMinter.getAmountPerType(1)).to.equals(ethers.utils.parseEther("0.3"));

    await RestoredCacheMinter.connect(owner).setAmountPerType(1, ethers.utils.parseEther("0.4"));
    expect(await RestoredCacheMinter.getAmountPerType(1)).to.equals(ethers.utils.parseEther("0.4"));
  });

  it("Only Owner can set amount per type", async () => {
    await expect(RestoredCacheMinter.connect(wallet).setAmountPerType(1, ethers.utils.parseEther("0.3"))).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
  });

  it("It can purchase a RestorecCache as BadCache 721 Holder", async () => {
    await RestoredCacheMinter.connect(owner).setAmountPerType(1, ethers.utils.parseEther("0.3"));
    expect(await RestoredCacheMinter.getAmountPerType(1)).to.equals(ethers.utils.parseEther("0.3"));

    await BadCache721.connect(owner).mint(owner.address, 1);
    expect(await BadCache721.ownerOf(1)).to.equals(owner.address);

    expect(
      await RestoredCacheMinter.purchase(1, 1, "https://google.com", {
        from: owner.address,
        value: ethers.utils.parseEther("0.3"),
      })
    )
      .to.emit(RestoredCacheMinter, "MintedRestoredCache")
      .withArgs(owner.address, 1);

    expect(await RestoredCache.ownerOf(1)).to.equals(owner.address);
  });

  it("It can not purchase a RestorecCache due to not being a BadCache holder and pause = true", async () => {
    await RestoredCacheMinter.connect(owner).setAmountPerType(1, ethers.utils.parseEther("0.3"));
    expect(await RestoredCacheMinter.getAmountPerType(1)).to.equals(ethers.utils.parseEther("0.3"));

    await expect(
      RestoredCacheMinter.purchase(2, 1, "https://google.com", {
        from: owner.address,
        value: ethers.utils.parseEther("0.3"),
      })
    ).to.be.revertedWith("RestoredCacheMinter: BadCache 721 does not exists");
  });

  it("Checks the uri of a newly bought RestorecCache as BadCache 721 Holder", async () => {
    await RestoredCacheMinter.connect(owner).setAmountPerType(1, ethers.utils.parseEther("0.3"));
    expect(await RestoredCacheMinter.getAmountPerType(1)).to.equals(ethers.utils.parseEther("0.3"));

    await BadCache721.connect(owner).mint(owner.address, 3);
    expect(await BadCache721.ownerOf(3)).to.equals(owner.address);

    expect(
      await RestoredCacheMinter.purchase(3, 1, "https://facebook.com", {
        from: owner.address,
        value: ethers.utils.parseEther("0.3"),
      })
    )
      .to.emit(RestoredCacheMinter, "MintedRestoredCache")
      .withArgs(owner.address, 3);

    expect(await RestoredCache.ownerOf(3)).to.equals(owner.address);
    expect(await RestoredCache.tokenURI(3)).to.equals("https://facebook.com");
  });

  it("It can not purchase a RestorecCache due to not being the owner of a BadCache", async () => {
    await RestoredCacheMinter.connect(owner).setAmountPerType(1, ethers.utils.parseEther("0.3"));
    expect(await RestoredCacheMinter.getAmountPerType(1)).to.equals(ethers.utils.parseEther("0.3"));

    await BadCache721.connect(owner).mint(wallet.address, 4);
    expect(await BadCache721.ownerOf(4)).to.equals(wallet.address);

    await expect(
      RestoredCacheMinter.purchase(4, 1, "https://google.com", {
        from: owner.address,
        value: ethers.utils.parseEther("0.3"),
      })
    ).to.be.revertedWith("RestoredCacheMinter: You are not the owner of BadCache721");
  });

  it("Only Owner can set paused", async () => {
    await expect(RestoredCacheMinter.connect(owner).setPaused(false)).to.not.be.reverted;
    await expect(RestoredCacheMinter.connect(wallet).setPaused(false)).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(RestoredCacheMinter.connect(owner).setPaused(true)).to.not.be.reverted;
  });

  it("It can purchase a RestoreCache even if it is not a holder of BadCache 721 because pause=false", async () => {
    await RestoredCacheMinter.connect(owner).setAmountPerType(1, ethers.utils.parseEther("0.3"));
    expect(await RestoredCacheMinter.getAmountPerType(1)).to.equals(ethers.utils.parseEther("0.3"));

    await expect(RestoredCacheMinter.connect(owner).setPaused(false)).to.not.be.reverted;

    expect(
      await RestoredCacheMinter.purchase(5, 1, "https://google.com", {
        from: owner.address,
        value: ethers.utils.parseEther("0.3"),
      })
    )
      .to.emit(RestoredCacheMinter, "MintedRestoredCache")
      .withArgs(owner.address, 5);

    await expect(RestoredCacheMinter.connect(owner).setPaused(true)).to.not.be.reverted;
  });

  it("Only owner can withdraw", async () => {
    await BadCache721.connect(owner).mint(owner.address, 6);
    expect(await BadCache721.ownerOf(6)).to.equals(owner.address);
    expect(
      await RestoredCacheMinter.purchase(6, 1, "https://google.com", {
        from: owner.address,
        value: ethers.utils.parseEther("0.3"),
      })
    )
      .to.emit(RestoredCacheMinter, "MintedRestoredCache")
      .withArgs(owner.address, 6);

    let balance: BigNumber = await RestoredCacheMinter.getBalance();

    expect(await RestoredCacheMinter.withdraw(ethers.utils.parseEther("0.3")))
      .to.emit(RestoredCacheMinter, "Witdraw")
      .withArgs(owner.address, ethers.utils.parseEther("0.3"));

    expect(await RestoredCacheMinter.getBalance()).to.equals(balance.sub(ethers.utils.parseEther("0.3")));
    let prov = ethers.getDefaultProvider();
  });
});
