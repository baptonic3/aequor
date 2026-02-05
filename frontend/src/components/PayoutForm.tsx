import { useState } from "react";

export default function PayoutForm() {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  async function authorizePayout() {
    // no real call yet
    console.log("Authorize payout:", recipient, amount);
    alert("USDC payout authorized on Arc");
  }

  return (
    <section>
      <h3>Authorize USDC Payout</h3>

      <input
        placeholder="Recipient address"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
      />

      <input
        placeholder="Amount (USDC)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <button onClick={authorizePayout}>
        Authorize Payout
      </button>

      <p className="hint">
        Destination chain and settlement are handled automatically.
      </p>
    </section>
  );
}
