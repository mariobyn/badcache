import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

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
