import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "hardhat-deploy";
import * as dotenv from "dotenv";
import "@nomiclabs/hardhat-etherscan";
import "hardhat-gas-reporter";
import "solidity-coverage";

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (args, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(await account.address);
  }
});

const { DEPLOYER_PRIVATE_KEY, INFURA_RINKEBY, INFURA_MAINNET, ALCHEMY_MAINNET_FORK, ETHERSCAN_API, GAS_REPORTER } = process.env;

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
export default {
  solidity: {
    version: "0.8.6",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  defaultNetwork: "hardhat",
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
    alwaysGenerateOverloads: false, // should overloads with full signatures like deposit(uint256) be generated always, even if there are no overloads?
    externalArtifacts: ["externalArtifacts/*.json"], // optional array of glob patterns with external artifacts to process (for example external libs from node_modules)
  },
  mocha: {
    timeout: 30000,
  },
  namedAccounts: {
    deployer: 0,
    simpleBadCacheBeneficiary: 1,
  },
  networks: {
    hardhat: {
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_MAINNET_FORK}`,
      },
      gas: 8000000,
      gasPrice: 210000,
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${INFURA_RINKEBY}`,
      accounts: [`${DEPLOYER_PRIVATE_KEY}`],
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${INFURA_MAINNET}`,
      accounts: [`${DEPLOYER_PRIVATE_KEY}`],
    },
  },
  etherscan: {
    apiKey: `${ETHERSCAN_API}`,
  },

  gasReporter: {
    currency: "USD",
    gasPrice: 210000,
    enabled: GAS_REPORTER ? true : false,
  },
};
