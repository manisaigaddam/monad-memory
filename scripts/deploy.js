const hre = require("hardhat");

async function main() {
  const CosmicMemory = await hre.ethers.getContractFactory("CosmicMemory");
  const game = await CosmicMemory.deploy();
  await game.deploymentTransaction().wait();
  console.log("Contract deployed to:", game.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });