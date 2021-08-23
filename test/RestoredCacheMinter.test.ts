import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { expect } from "chai";

import { BadCache__factory, RestoredCacheMinterRinkeby__factory, RestoredCache__factory } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

xdescribe("ReversedCache Test", () => {
  let BadCache721: any;
  let BadCache721Factory: any;

  let RestoredCache: any;
  let RestoredCacheFactory: any;

  let RestoredCacheMinter: any;
  let RestoredCacheMinterFactory: any;

  let owner: SignerWithAddress;

  let provider: any;

  let wallet: any;

  before(async () => {
    [owner, wallet] = await ethers.getSigners();
    provider = await ethers.provider;

    BadCache721Factory = (await ethers.getContractFactory("BadCache", wallet)) as BadCache__factory;
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
    ).to.be.revertedWith("Can't set to the address 0");
  });

  it("It can not set RestoredCache Proxy Address to address zero", async () => {
    await expect(
      RestoredCacheMinter.connect(owner).setRestoredCacheProxiedAddress(ethers.constants.AddressZero)
    ).to.be.revertedWith("Can't set to the address 0");
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

  it("It can purchase a RestoredCache as BadCache 721 Holder", async () => {
    await RestoredCacheMinter.connect(owner).setAmountPerType(1, ethers.utils.parseEther("0.3"));
    expect(await RestoredCacheMinter.getAmountPerType(1)).to.equals(ethers.utils.parseEther("0.3"));

    await BadCache721.connect(wallet).mint(owner.address, 1);
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

  it("It can not purchase a RestoredCache due to not being a BadCache holder and pause = true", async () => {
    await RestoredCacheMinter.connect(owner).setAmountPerType(1, ethers.utils.parseEther("0.3"));
    expect(await RestoredCacheMinter.getAmountPerType(1)).to.equals(ethers.utils.parseEther("0.3"));

    await expect(
      RestoredCacheMinter.purchase(2, 1, "https://google.com", {
        from: owner.address,
        value: ethers.utils.parseEther("0.3"),
      })
    ).to.be.revertedWith("Sender has problems with BadCache721");
  });

  it("Checks the uri of a newly bought RestoredCache as BadCache 721 Holder", async () => {
    await RestoredCacheMinter.connect(owner).setAmountPerType(1, ethers.utils.parseEther("0.3"));
    expect(await RestoredCacheMinter.getAmountPerType(1)).to.equals(ethers.utils.parseEther("0.3"));

    await BadCache721.connect(wallet).mint(owner.address, 3);
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

  it("It can not purchase a RestoredCache due to not being the owner of a BadCache and pause = true", async () => {
    await RestoredCacheMinter.connect(owner).setAmountPerType(1, ethers.utils.parseEther("0.3"));
    expect(await RestoredCacheMinter.getAmountPerType(1)).to.equals(ethers.utils.parseEther("0.3"));

    await BadCache721.connect(wallet).mint(wallet.address, 4);
    expect(await BadCache721.ownerOf(4)).to.equals(wallet.address);

    await expect(
      RestoredCacheMinter.purchase(4, 1, "https://google.com", {
        from: owner.address,
        value: ethers.utils.parseEther("0.3"),
      })
    ).to.be.revertedWith("Sender has problems with BadCache721");
  });

  it("Only Owner can set paused", async () => {
    await expect(RestoredCacheMinter.connect(owner).setPaused(false)).to.not.be.reverted;
    await expect(RestoredCacheMinter.connect(wallet).setPaused(false)).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(RestoredCacheMinter.connect(owner).setPaused(true)).to.not.be.reverted;
  });

  it("It can purchase a RestoreCache even if it is not a holder of BadCache 721 because pause = false", async () => {
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

  it("Owner can withdraw", async () => {
    await BadCache721.connect(wallet).mint(owner.address, 6);
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
  });

  it("A Non-Owner can not withdraw", async () => {
    await BadCache721.connect(wallet).mint(owner.address, 7);
    expect(await BadCache721.ownerOf(7)).to.equals(owner.address);
    expect(
      await RestoredCacheMinter.purchase(7, 1, "https://google.com", {
        from: owner.address,
        value: ethers.utils.parseEther("0.3"),
      })
    )
      .to.emit(RestoredCacheMinter, "MintedRestoredCache")
      .withArgs(owner.address, 7);

    let balance: BigNumber = await RestoredCacheMinter.getBalance();

    await expect(RestoredCacheMinter.connect(wallet).withdraw(ethers.utils.parseEther("0.3"))).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
  });
});
