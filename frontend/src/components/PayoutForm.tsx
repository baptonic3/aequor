import { useState } from "react";
import { config } from "../config";

export default function PayoutForm() {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function authorizePayout() {
    if (!recipient || !amount) {
      setError("Please enter both recipient and amount");
      return;
    }

    setLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const response = await fetch(`${config.backendUrl}/payout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient,
          amount,
          destinationChainId: 8453, // Base as destination
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Payout failed");
      }

      setTxHash(data.txHash);
      console.log("✅ Payout authorized:", data);

      // Clear form
      setRecipient("");
      setAmount("");

    } catch (err: any) {
      console.error("❌ Payout error:", err);
      setError(err.message || "Failed to authorize payout");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h3>Authorize USDC Payout</h3>

      <input
        placeholder="Recipient address"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        disabled={loading}
      />

      <input
        placeholder="Amount (USDC)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        disabled={loading}
      />

      <button onClick={authorizePayout} disabled={loading}>
        {loading ? "Authorizing..." : "Authorize Payout"}
      </button>

      {error && (
        <p className="error">
          ❌ {error}
        </p>
      )}

      {txHash && (
        <div className="success">
          <p>✅ <strong>Payout Authorized on Arc!</strong></p>
          <p className="tx-hash">
            Transaction: <code>{txHash.slice(0, 10)}...{txHash.slice(-8)}</code>
            Txn Hash: {txHash}
          </p>
          <p className="status-msg">Settlement in progress via Circle Gateway</p>
        </div>
      )}

      <p className="hint">
        Destination chain and settlement are handled automatically.
      </p>
    </section>
  );
}
