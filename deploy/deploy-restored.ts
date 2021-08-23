import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  await deploy("RestoredCache", {
    from: deployer,
    args: [],
    log: true,
  });

  // await deploy("RestoredCache", {
  //   from: deployer,
  //   args: ["RestoredCache", "RestoredCache"],
  //   log: true,
  // });
};
export default func;
func.tags = ["RestoredCache"];
// func.tags = ["RestoredCache"];
