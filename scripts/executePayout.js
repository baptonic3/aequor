import hre from "hardhat";

async function main() {
  // Get Treasury address from environment
  const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS;
  
  // Recipient ID to trigger payout for
  const RECIPIENT_ID = 0;

  console.log("🔗 Connecting to Treasury at:", TREASURY_ADDRESS);
  
  // Get contract instance
  const treasury = await hre.ethers.getContractAt("Treasury", TREASURY_ADDRESS);

  console.log(" Calling executePayout...");
  console.log(" Recipient ID:", RECIPIENT_ID);
  
  // Execute payout transaction
  const tx = await treasury.executePayout(RECIPIENT_ID);
  
  console.log(" Transaction submitted:", tx.hash);
  console.log("⏳ Waiting for confirmation...");
  
  // Wait for transaction to be mined
  const receipt = await tx.wait();
  
  console.log("✅ executePayout mined!");
  console.log("   Block:", receipt.blockNumber);
  console.log("   Gas used:", receipt.gasUsed.toString());
  console.log("\n Check your backend terminal for the settlement flow execution");
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exitCode = 1;
});
