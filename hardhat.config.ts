import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "hardhat-deploy-ethers";
import "hardhat-abi-exporter";


// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (args, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(await account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
export default {
  solidity: "0.8.6",
  defaultNetwork: "rinkeby",
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
    alwaysGenerateOverloads: false, // should overloads with full signatures like deposit(uint256) be generated always, even if there are no overloads?
    externalArtifacts: ["externalArtifacts/*.json"], // optional array of glob patterns with external artifacts to process (for example external libs from node_modules)
  },
  namedAccounts: {
    deployer: 0,
    simpleBadCacheBeneficiary: 1,
  },
  networks: {
    hardhat: {
      forking: {
        url: "https://eth-mainnet.alchemyapi.io/v2/4HyDsDjcbn39V7U2P5MdIA-eC3z3Ds11"
      },
      gas: 2100000,
      gasPrice: 8000000000
    },
    rinkeby: {
      url: "https://eth-mainnet.alchemyapi.io/v2/g_49Z5DLJiwnEBnjisKeXpiR1GAI31Xo",
      accounts: ['15ee17a4c89bdfbbb1fac582b09f343b7aff95a4f08d7f6bd8f6320eeb61a54f']
    }
  },
  abiExporter: {
    path: './data/abi',
    clear: true,
    flat: true,
    only: [':ERC20$'],
    spacing: 2
  }
};
