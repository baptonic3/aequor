import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = "https://gateway-api-testnet.circle.com/v1";

// Map chain IDs to Circle chain identifiers
const CHAIN_ID_TO_CIRCLE = {
  1: "Ethereum",
  5: "Goerli",
  11155111: "Sepolia",
  137: "Polygon",
  80001: "Mumbai",
  8453: "Base",
  84531: "Base Goerli",
  5042002: "Arc Testnet", // Arc testnet chain ID
  42161: "Arbitrum",
  421613: "Arbitrum Goerli",
  10: "Optimism",
  420: "Optimism Goerli",
};

/**
 * Settle USDC cross-chain using Circle Gateway
 * @param {Object} params - Settlement parameters
 * @param {string} params.amount - Amount in USDC smallest units (6 decimals)
 * @param {number|string} params.destinationChain - Chain ID
 * @param {string} params.destinationAddress - Recipient address
 * @returns {Promise<Object>} Circle Gateway transfer response
 */
export async function settleUSDC({ amount, destinationChain, destinationAddress }) {
  console.log(" Settling USDC via Circle Gateway...");
  
  const circleChain = CHAIN_ID_TO_CIRCLE[Number(destinationChain)];
  
  if (!circleChain) {
    throw new Error(`Unsupported destination chain: ${destinationChain}`);
  }

  console.log("   Amount:", amount, "USDC (raw)");
  console.log("   Destination Chain:", circleChain);
  console.log("   Recipient:", destinationAddress);

  try {
    // Circle Gateway API call
    const response = await axios.post(
      `${BASE_URL}/transfers`,
      {
        source: {
          type: "wallet",
          id: process.env.CIRCLE_WALLET_ID || "default", // Configure based on Circle setup
        },
        destination: {
          type: "blockchain",
          chain: circleChain,
          address: destinationAddress,
        },
        amount: {
          amount: formatAmount(amount),
          currency: "USD",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.CIRCLE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Gateway transfer initiated");
    console.log("   Transfer ID:", response.data.data?.id || "pending");
    console.log("   Status:", response.data.data?.status || "submitted");

    return {
      success: true,
      transferId: response.data.data?.id,
      status: response.data.data?.status,
      rawResponse: response.data,
    };
  } catch (error) {
    console.error("❌ Circle Gateway error:");
    console.error("   Message:", error.response?.data?.message || error.message);
    console.error("   Code:", error.response?.data?.code || "UNKNOWN");
    
    throw error;
  }
}

/**
 * Format amount from smallest units (6 decimals) to Circle API format
 * @param {string|number} amount - Amount in smallest units
 * @returns {string} Formatted amount
 */
function formatAmount(amount) {
  const amountNum = Number(amount);
  const formatted = (amountNum / 1_000_000).toFixed(2);
  return formatted;
}

/**
 * Get transfer status from Circle Gateway
 * @param {string} transferId - Circle transfer ID
 * @returns {Promise<Object>} Transfer status
 */
export async function getTransferStatus(transferId) {
  try {
    const response = await axios.get(
      `${BASE_URL}/transfers/${transferId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CIRCLE_API_KEY}`,
        },
      }
    );

    return response.data.data;
  } catch (error) {
    console.error("❌ Failed to fetch transfer status:", error.message);
    throw error;
  }
}
