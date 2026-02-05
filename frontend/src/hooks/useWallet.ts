import { useState } from "react";
import { ethers } from "ethers";

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

  async function connect() {
    if (!window.ethereum) {
      alert("MetaMask not found. Please install MetaMask to continue.");
      return;
    }

    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      await browserProvider.send("eth_requestAccounts", []);
      const signer = await browserProvider.getSigner();

      setAddress(await signer.getAddress());
      setProvider(browserProvider);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      alert("Failed to connect wallet. Please try again.");
    }
  }

  return { address, provider, connect };
}
