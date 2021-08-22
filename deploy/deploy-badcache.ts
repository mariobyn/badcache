import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  // await deploy("BadCacheBridge", {
  //   from: deployer,
  //   args: [],
  //   log: true,
  // });

  // await deploy("BadCache", {
  //   from: deployer,
  //   args: ["BadCache", "BadCache"],
  //   log: true,
  // });
};
export default func;
// func.tags = ["BadCacheBridge"];
// func.tags = ["BadCache"];
