import hre from "hardhat";

async function main() {
  // Get Treasury address from environment
  const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS;
  
  // Recipient details - customize these
  const RECIPIENT_WALLET = "0x742d35cc6634c0532925a3b844bc9e7595f0beb0"; // Example address (lowercase)
  const DESTINATION_CHAIN_ID = 8453; // Base chain
  const AMOUNT = "1000000"; // 1 USDC (6 decimals)

  console.log("🔗 Connecting to Treasury at:", TREASURY_ADDRESS);
  
  // Get contract instance
  const treasury = await hre.ethers.getContractAt("Treasury", TREASURY_ADDRESS);

  console.log("➕ Adding recipient...");
  console.log("   Wallet:", RECIPIENT_WALLET);
  console.log("   Destination Chain:", DESTINATION_CHAIN_ID, "(Base)");
  console.log("   Amount:", AMOUNT, "(1 USDC)");
  
  // Add recipient
  const tx = await treasury.addRecipient(
    hre.ethers.getAddress(RECIPIENT_WALLET), // Normalize checksum
    DESTINATION_CHAIN_ID,
    AMOUNT
  );
  
  console.log("   Transaction submitted:", tx.hash);
  console.log("⏳ Waiting for confirmation...");
  
  // Wait for transaction to be mined
  const receipt = await tx.wait();
  
  // Get the recipient ID from the event
  const event = receipt.logs.find(
    log => log.fragment && log.fragment.name === "RecipientAdded"
  );
  
  const recipientId = event ? event.args.id : 0;
  
  console.log("✅ Recipient added successfully!");
  console.log("   Recipient ID:", recipientId.toString());
  console.log("   Block:", receipt.blockNumber);
  console.log("\n Now you can call executePayout with recipient ID:", recipientId.toString());
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exitCode = 1;
});
