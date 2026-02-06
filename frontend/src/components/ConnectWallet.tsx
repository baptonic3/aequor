import { useState, useEffect } from "react";
import { useWallet } from "../hooks/useWallet";
import { ethers } from "ethers";

// Map chain IDs to friendly names
function getChainName(chainId: bigint): string {
  const chainIdNum = Number(chainId);
  
  const chainNames: { [key: number]: string } = {
    1: "Ethereum",
    5: "Goerli",
    11155111: "Sepolia",
    137: "Polygon",
    8453: "Base",
    84531: "Base Goerli",
    5042002: "Arc Testnet", // Arc testnet chain ID
    42161: "Arbitrum",
    421613: "Arbitrum Goerli",
    10: "Optimism",
    420: "Optimism Goerli",
  };

  return chainNames[chainIdNum] || `Chain ${chainId}`;
}

export default function ConnectWallet() {
  const { address, provider, connect } = useWallet();
  const [network, setNetwork] = useState<string>("");
  const [usdcBalance, setUsdcBalance] = useState<string>("");

  useEffect(() => {
    async function fetchInfo() {
      if (!provider || !address) return;

      try {
        // Get network
        const net = await provider.getNetwork();
        const friendlyName = getChainName(net.chainId);
        setNetwork(friendlyName);

        // Get USDC balance
        const balance = await provider.getBalance(address);
        const formatted = ethers.formatEther(balance);
        setUsdcBalance(parseFloat(formatted).toFixed(4));
      } catch (error) {
        console.error("Error fetching wallet info:", error);
      }
    }

    fetchInfo();
  }, [provider, address]);

  return (
    <section className="wallet-section">
      {address ? (
        <div className="wallet-info">
          <div className="wallet-connected">
            <span className="wallet-label">Connected:</span>
            <span className="wallet-address">
              {address.slice(0, 6)}…{address.slice(-4)}
            </span>
          </div>
          <div className="wallet-details">
            <span>Network: <strong>{network || "Loading..."}</strong></span>
            {/* <span>Balance: <strong>{usdcBalance || "0.0000"} USDC</strong></span> */}
          </div>
        </div>
      ) : (
        <button onClick={connect} className="connect-btn">
          Connect Wallet
        </button>
      )}
    </section>
  );
}
