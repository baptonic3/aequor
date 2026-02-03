import { ethers } from "ethers";
import dotenv from "dotenv";
import TreasuryABI from "./TreasuryABI.json" with { type: "json" };
import { settleUSDC } from "./circle.js";

dotenv.config({ path: '../.env' });

const provider = new ethers.JsonRpcProvider(process.env.ARC_RPC_URL);

const treasury = new ethers.Contract(
  process.env.TREASURY_ADDRESS,
  TreasuryABI,
  provider
);

console.log(" Aequor Executor listening on Arc...");
console.log(" Treasury:", process.env.TREASURY_ADDRESS);
console.log(" RPC:", process.env.ARC_RPC_URL);
console.log(" Circle Gateway:", process.env.CIRCLE_API_KEY ? "✅ connected" : "⚠️  not configured");
console.log("⏳ Waiting for cross-chain settlement intents...\n");

treasury.on(
  "CrossChainSettlementRequested",
  async (recipientId, recipient, destChainId, amount, event) => {
    console.log("\n Arc intent detected:");
    console.log({
      recipientId: recipientId.toString(),
      recipient,
      destChainId: destChainId.toString(),
      amount: amount.toString(),
      txHash: event.log.transactionHash,
    });

    try {
      // Execute cross-chain settlement via Circle Gateway
      const result = await settleUSDC({
        amount: amount.toString(),
        destinationChain: destChainId.toString(),
        destinationAddress: recipient,
      });

      if (result.success) {
        console.log("   USDC settlement triggered via Circle Gateway");
        console.log("   Settlement ID:", result.transferId);
        console.log("   Status:", result.status);
        if (result.simulation) {
          console.log("   ⚠️  Note: Running in simulation mode");
        }
      }

      console.log("✅ Settlement flow completed\n");
    } catch (error) {
      console.error("❌ Settlement failed:");
      console.error("   Error:", error.message);
      console.log("");
    }
  }
);

// Mock functions removed - now using real Circle Gateway settlement

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n Shutting down Aequor Executor...");
  process.exit(0);
});
