import { useWallet } from "../hooks/useWallet";

export default function ConnectWallet() {
  const { address, connect } = useWallet();

  return (
    <section className="wallet-section">
      {address ? (
        <div className="wallet-connected">
          <span className="wallet-label">Connected:</span>
          <span className="wallet-address">
            {address.slice(0, 6)}…{address.slice(-4)}
          </span>
        </div>
      ) : (
        <button onClick={connect} className="connect-btn">
          Connect Wallet
        </button>
      )}
    </section>
  );
}
