import ConnectWallet from "./components/ConnectWallet";
import TreasuryPanel from "./components/TreasuryPanel";
import PayoutForm from "./components/PayoutForm";
import StatusPanel from "./components/StatusPanel";
import "./styles.css";

export default function App() {
  return (
    <main>
      <header>
        <h1>Aequor</h1>
        <p className="subtitle">
          Chain-abstracted USDC treasury using Arc and Circle Gateway
        </p>
      </header>

      <ConnectWallet />
      <TreasuryPanel />
      <PayoutForm />
      <StatusPanel />
    </main>
  );
}
