import { ethers } from "ethers";
import dotenv from "dotenv";
import TreasuryABI from "./TreasuryABI.json" with { type: "json" };

dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.ARC_RPC_URL);

const treasury = new ethers.Contract(
  process.env.TREASURY_ADDRESS,
  TreasuryABI,
  provider
);

console.log(" Aequor Executor listening on Arc...");
console.log(" Treasury:", process.env.TREASURY_ADDRESS);
console.log(" RPC:", process.env.ARC_RPC_URL);
console.log(" Waiting for cross-chain settlement intents...\n");

treasury.on(
  "CrossChainSettlementRequested",
  async (recipientId, recipient, destChainId, amount, event) => {
    console.log("\n Intent detected:");
    console.log({
      recipientId: recipientId.toString(),
      recipient,
      destChainId: destChainId.toString(),
      amount: amount.toString(),
      txHash: event.log.transactionHash,
    });

    // Step 1: Resolve route (mock)
    const route = resolveRoute(destChainId);

    // Step 2: Simulate execution
    await simulateExecution(route, recipient, amount);

    console.log(" Settlement flow completed\n");
  }
);

function resolveRoute(destChainId) {
  console.log(" Resolving route for chain:", destChainId.toString());

  // Map chain IDs to chain names for better readability
  const chainNames = {
    1: "Ethereum",
    10: "Optimism",
    137: "Polygon",
    8453: "Base",
    42161: "Arbitrum",
    43114: "Avalanche",
  };

  const chainName = chainNames[Number(destChainId)] || `Chain ${destChainId}`;

  return {
    destination: chainName,
    provider: "LI.FI (simulated)",
    bridge: "MockBridge",
    estimatedTime: "45s",
    estimatedFee: "0.05 USDC",
  };
}

async function simulateExecution(route, recipient, amount) {
  console.log("Executing settlement:");
  console.log({
    destination: route.destination,
    provider: route.provider,
    recipient,
    amount: amount.toString(),
    estimatedTime: route.estimatedTime,
    estimatedFee: route.estimatedFee,
  });

  // Simulate processing time
  await new Promise((r) => setTimeout(r, 1000));

  console.log("USDC delivered (simulated)");
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n Shutting down Aequor Executor...");
  process.exit(0);
});
