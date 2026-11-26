import { useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import votingArtifact from "./contracts/Voting.json";
import "./App.css";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const ABI = votingArtifact.abi;

function App() {
  const [account, setAccount] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [message, setMessage] = useState("Connect your wallet to view candidates.");
  const [busy, setBusy] = useState(false);

  async function connectWallet() {
    try {
      if (!window.ethereum) {
        setMessage("MetaMask is not detected. Please install it first.");
        return;
      }

      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();

      if (network.chainId !== 31337n) {
        setMessage("Please switch MetaMask to Hardhat Local (Chain ID 31337).");
        return;
      }

      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
      await loadCandidates(provider);
      setMessage("Wallet connected successfully.");
    } catch (error) {
      setMessage(error.shortMessage || error.message);
    }
  }

  async function loadCandidates(existingProvider) {
    try {
      const provider = existingProvider || new BrowserProvider(window.ethereum);
      const voting = new Contract(CONTRACT_ADDRESS, ABI, provider);

      const count = await voting.candidateCount();
      const result = [];

      for (let id = 1n; id <= count; id++) {
        const candidate = await voting.candidates(id);
        result.push({
          id: Number(candidate.id),
          name: candidate.name,
          voteCount: candidate.voteCount.toString(),
        });
      }

      setCandidates(result);
    } catch (error) {
      setMessage(error.shortMessage || error.message);
    }
  }

  async function castVote(candidateId) {
    if (!window.ethereum) {
      setMessage("Please install MetaMask first.");
      return;
    }

    try {
      setBusy(true);
      setMessage("Please approve the transaction in MetaMask.");

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const voting = new Contract(CONTRACT_ADDRESS, ABI, signer);

      const alreadyVoted = await voting.hasVoted(await signer.getAddress());
      if (alreadyVoted) {
        setMessage("This wallet has already voted.");
        return;
      }

      const tx = await voting.vote(candidateId);
      setMessage(`Transaction submitted: ${tx.hash.slice(0, 10)}...`);
      await tx.wait();
      setMessage("Vote confirmed successfully!");
      await loadCandidates(provider);
    } catch (error) {
      setMessage(
        error.shortMessage || error.reason || error.message || "The transaction failed."
      );
    } finally {
      setBusy(false);
    }
  }

  const shortAddress = account
    ? `${account.slice(0, 6)}...${account.slice(-4)}`
    : "";

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <span className="logo-icon">🗳️</span>
          <h1>Blockchain Voting</h1>
        </div>
        <p className="subtitle">Secure • Transparent • Decentralized</p>
      </header>

      <div className="card connect-card">
        <button
          className={`btn ${account ? "btn-connected" : "btn-primary"}`}
          onClick={connectWallet}
          disabled={busy}
        >
          {account ? `Connected: ${shortAddress}` : "Connect MetaMask"}
        </button>

        {message && (
          <p className={`message ${message.includes("successfully") || message.includes("confirmed") ? "success" : ""}`}>
            {message}
          </p>
        )}
      </div>

      <div className="actions">
        <button
          className="btn btn-secondary"
          onClick={() => loadCandidates()}
          disabled={busy || !account}
        >
          ↻ Refresh Results
        </button>
      </div>

      <section className="candidates">
        {candidates.length === 0 ? (
          <p className="empty">No candidates loaded yet. Connect your wallet.</p>
        ) : (
          candidates.map((candidate) => (
            <article className="candidate-card" key={candidate.id}>
              <div className="candidate-info">
                <h2>{candidate.name}</h2>
                <p className="candidate-id">ID: {candidate.id}</p>
              </div>
              <div className="vote-count">
                <span className="count">{candidate.voteCount}</span>
                <span className="label">votes</span>
              </div>
              <button
                className="btn btn-vote"
                onClick={() => castVote(candidate.id)}
                disabled={!account || busy}
              >
                Vote for {candidate.name}
              </button>
            </article>
          ))
        )}
      </section>

      <footer className="footer">
        <small>Local Hardhat Network · Chain ID 31337</small>
      </footer>
    </div>
  );
}

export default App;
