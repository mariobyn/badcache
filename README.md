### Description

Contract that is waiting for an ERC1155 NFT from OpenSea (actually anywhere) and mints an ERC721 based on some mappings that are set on the contract

### Setup

You need to setup .env file where you need to set DEPLOYER_PRIVATE_KEY (a key used to deploy the contract to mainnet/rinkeby)

ALCHEMY_MAINNET_FORK key used to use ALCHEMY API

INFURA_RINKEBY key used to publish contract to Rinkeby

ETHERSCAN_API used for etherscan publish, doesn't work yet...

Do a npm install before running anything

Make sure you are running npx hardhat test before doing anything

Check the .env-example file (copy this file into a new .env file and complete the missing info)

### Deploy

To deploy on rinkeby, complete in the .env file, the deployer private key, with a private key to a rinkeby wallet that has some eth

Then, in order to deploy to rinkeby, checkout the deploy/deploy.ts file. there are 2 options, we need to deploy BadCacheBridge and
BadCache721. 

For rinkeby we will depoy the BadCacheBridgeRinkeby.sol and for mainnet we will deploy the BadCacheBridge.sol

Make sure you comment/uncomment the right parameters. 
How it should look like if you want to deploy the BadCache721 on Rinkeby or Mainnet
```
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  // await deploy("BadCacheBridgeRinkeby", {
  //   from: deployer,
  //   args: [],
  //   log: true,
  // });

  await deploy("BadCache721", {
    from: deployer,
    args: ["BadCache721", "BadCache721"],
    log: true,
  });
};
export default func;
// func.tags = ["BadCacheBridgeRinkeby"];
func.tags = ["BadCache721"];
```
How it should look like if you want to deploy the Bridge on Rinkeby
```
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  await deploy("BadCacheBridgeRinkeby", {
    from: deployer,
    args: [],
    log: true,
  });

  // await deploy("BadCache721", {
  //   from: deployer,
  //   args: ["BadCache721", "BadCache721"],
  //   log: true,
  // });
};
export default func;
func.tags = ["BadCacheBridgeRinkeby"];
// func.tags = ["BadCache721"];
```

How it should look like if you want to deploy the Bridge on Mainnet

```
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  await deploy("BadCacheBridge", {
    from: deployer,
    args: [],
    log: true,
  });

  // await deploy("BadCache721", {
  //   from: deployer,
  //   args: ["BadCache721", "BadCache721"],
  //   log: true,
  // });
};
export default func;
func.tags = ["BadCacheBridge"];
// func.tags = ["BadCache721"];
```

### WARNING
Deploying on mainnet will require a private key for the mainnet wallet that contains ETH.

### Verify contract on Etherscan
After a deploy of a contract is done, you need to verify it on etherscan, for that we will use the hardhat verify plugin.
https://hardhat.org/plugins/nomiclabs-hardhat-etherscan.html 

After the contract is deployed, you will receive an address after the hardhat command is finished. Next you need to run
```
npx hardhat verify --network rinkeby 0x0324324234...3424
```

Be careful, use --network rinkeby only if you deploy on rinkeby.

For the BadCache721 the verify is a little bit different, you will need to pass 2 arguments (Token name and Symbol)

```
npx hardhat verify --network rinkeby 0x0324324234...3424 "BadCache721" "BadCache721"
```
