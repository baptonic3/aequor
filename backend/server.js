import express from "express";
import cors from "cors";
import { ethers } from "ethers";
import dotenv from "dotenv";
import TreasuryABI from "./TreasuryABI.json" with { type: "json" };

dotenv.config({ path: '../.env' });

const app = express();
app.use(cors());
app.use(express.json());

// Initialize provider and wallet
const provider = new ethers.JsonRpcProvider(process.env.ARC_RPC_URL);
const wallet = new ethers.Wallet(
  process.env.EXECUTOR_WALLET_PRIVATE_KEY,
  provider
);

// Initialize Treasury contract
const treasury = new ethers.Contract(
  process.env.TREASURY_ADDRESS,
  TreasuryABI,
  wallet
);

console.log(" Aequor Backend API Server");
console.log(" Treasury:", process.env.TREASURY_ADDRESS);
console.log(" Arc RPC:", process.env.ARC_RPC_URL);
console.log(" Executor:", wallet.address);
console.log("");

/**
 * POST /payout
 * Simplified endpoint that adds recipient and executes payout in one transaction
 */
app.post("/payout", async (req, res) => {
  try {
    const { recipient, amount, destinationChainId } = req.body;

    if (!recipient || !amount) {
      return res.status(400).json({
        error: "Missing required fields: recipient, amount"
      });
    }

    console.log("\n💰 Payout request received:");
    console.log("  Recipient:", recipient);
    console.log("  Amount:", amount, "USDC");
    console.log("  Destination Chain:", destinationChainId || "Arc (same-chain)");

    // Convert amount to proper format (USDC has 6 decimals)
    const amountInSmallestUnit = ethers.parseUnits(amount.toString(), 6);

    // Default to cross-chain (different from Arc) to trigger Circle Gateway
    const destChain = destinationChainId || 8453; // Base as default destination

    // Step 1: Add recipient
    console.log("\n Adding recipient to treasury...");
    const addTx = await treasury.addRecipient(
      recipient,
      destChain,
      amountInSmallestUnit
    );
    await addTx.wait();
    console.log("✅ Recipient added, tx:", addTx.hash);

    // Get the recipientId (it's recipientCount - 1)
    const recipientCount = await treasury.recipientCount();
    const recipientId = recipientCount - 1n;

    // Step 2: Execute payout
    console.log("\n⚡ Executing payout...");
    const payoutTx = await treasury.executePayout(recipientId);
    const receipt = await payoutTx.wait();
    
    console.log("✅ Payout authorized on Arc!");
    console.log("   Tx Hash:", payoutTx.hash);
    console.log("   Recipient ID:", recipientId.toString());
    console.log("   Settlement intent emitted\n");

    // Backend listener (index.js) will pick up the event and call Circle Gateway

    res.json({
      status: "authorized",
      txHash: payoutTx.hash,
      recipientId: recipientId.toString(),
      amount: amount,
      destinationChain: destChain,
      message: "Payout authorized on Arc. Settlement in progress via Circle Gateway."
    });

  } catch (error) {
    console.error("\n❌ Payout failed:");
    console.error("   Error:", error.message);
    console.log("");

    res.status(500).json({
      error: "Payout failed",
      message: error.message
    });
  }
});

/**
 * GET /status/:txHash
 * Check status of a payout transaction
 */
app.get("/status/:txHash", async (req, res) => {
  try {
    const { txHash } = req.params;
    
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      return res.json({ status: "pending" });
    }

    res.json({
      status: receipt.status === 1 ? "completed" : "failed",
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    });

  } catch (error) {
    res.status(500).json({
      error: "Status check failed",
      message: error.message
    });
  }
});

/**
 * GET /treasury/balance
 * Get treasury USDC balance
 */
app.get("/treasury/balance", async (req, res) => {
  try {
    const balance = await treasury.getTreasuryBalance();
    const formattedBalance = ethers.formatUnits(balance, 6);

    res.json({
      balance: formattedBalance,
      balanceRaw: balance.toString()
    });

  } catch (error) {
    res.status(500).json({
      error: "Balance check failed",
      message: error.message
    });
  }
});

/**
 * Health check endpoint
 */
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    treasury: process.env.TREASURY_ADDRESS,
    executor: wallet.address
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(` Backend API listening on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`\n⏳ Ready to receive payout requests...\n`);
});
