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