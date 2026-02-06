// Bypass SSL certificate validation for Arc testnet (development only)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { ethers, FetchRequest } from "ethers";
import dotenv from "dotenv";
dotenv.config();

async function checkBalance() {
  console.log("🔍 Checking Treasury balance...\n");
  
  try {
    // Create custom fetch request with longer timeout
    const fetchReq = new FetchRequest(process.env.ARC_RPC_URL);
    fetchReq.timeout = 30000; // 30 second timeout
    
    const provider = new ethers.JsonRpcProvider(fetchReq, undefined, {
      staticNetwork: ethers.Network.from({
        name: "arc-testnet",
        chainId: parseInt(process.env.ARC_CHAIN_ID)
      })
    });
    
    const treasury = new ethers.Contract(
      process.env.TREASURY_ADDRESS,
      ["function getTreasuryBalance() external view returns (uint256)"],
      provider
    );

    const balance = await treasury.getTreasuryBalance();
    const usdcBalance = ethers.formatUnits(balance, 6);
    console.log("✅ Treasury USDC Balance:", usdcBalance, "USDC\n");
    
    if (parseFloat(usdcBalance) >= 10) {
      console.log("✅ Treasury has sufficient funds for testing!");
    } else {
      console.log("⚠️  Treasury needs more USDC");
    }
  } catch (error) {
    console.error("❌ Error checking balance:", error.message);
    console.log("\n💡 If connection fails, the RPC endpoint might be unreachable from your network");
  }
}

checkBalance();
