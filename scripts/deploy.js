const hre = require("hardhat");

async function main() {
  console.log("Deploying CredentialRegistry to", hre.network.name, "...");

  const CredentialRegistry = await hre.ethers.getContractFactory("CredentialRegistry");
  const registry = await CredentialRegistry.deploy();

  await registry.waitForDeployment();
  const address = await registry.getAddress();

  console.log("\n✅ CredentialRegistry deployed to:", address);
  console.log("\n📝 Add this to your .env file:");
  console.log(`VITE_CONTRACT_ADDRESS=${address}`);
  
  console.log("\n🔍 Verify on Polygonscan:");
  console.log(`npx hardhat verify --network ${hre.network.name} ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
