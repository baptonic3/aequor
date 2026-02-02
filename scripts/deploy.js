import hre from "hardhat";

async function main() {
  // Arc Testnet USDC address - UPDATE THIS with actual Arc testnet USDC
  const USDC_ADDRESS = process.env.ARC_USDC_ADDRESS;
  
  // Arc Testnet Chain ID - UPDATE THIS with actual Arc testnet chain ID
  const ARC_CHAIN_ID = process.env.ARC_CHAIN_ID;

  console.log("Deploying AequorTreasury...");
  console.log("USDC Address:", USDC_ADDRESS);
  console.log("Arc Chain ID:", ARC_CHAIN_ID);

  const Treasury = await hre.ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy(USDC_ADDRESS, ARC_CHAIN_ID);
  
  await treasury.waitForDeployment();

  const deployedAddress = await treasury.getAddress();
  
  console.log("✅ AequorTreasury deployed to:", deployedAddress);
  console.log("\nContract Details:");
  console.log("- Network: Arc Testnet");
  console.log("- Contract: Treasury");
  console.log("- Address:", deployedAddress);
  console.log("- USDC:", USDC_ADDRESS);
  console.log("- Chain ID:", ARC_CHAIN_ID);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});