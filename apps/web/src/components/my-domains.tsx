"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useOwnedDomains } from "@/lib/use-sns";
import { CreateAgentWizard } from "./create-agent-wizard";

export function MyDomains() {
  const { connected } = useWallet();
  const { domains, loading, error, refresh } = useOwnedDomains();
  const [wizardParent, setWizardParent] = useState<string | null>(null);

  if (!connected) {
    return (
      <section className="panel">
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Your domains</h2>
        <p style={{ color: "var(--muted)", marginTop: "0.5rem" }}>
          Connect your wallet to see the .sol domains you own and create an agent subdomain.
        </p>
      </section>
    );
  }

  return (
    <section className="panel" style={{ display: "grid", gap: "1rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Your domains</h2>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
            Pick a parent .sol and create <code>myagent.your.sol</code>
          </p>
        </div>
        <button className="btn-ghost" onClick={() => void refresh()}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      {error && <div style={{ color: "var(--danger)" }}>{error}</div>}

      {!loading && domains.length === 0 && (
        <div style={{ color: "var(--muted)" }}>
          No .sol domains owned by this wallet on devnet. Register one at{" "}
          <a
            href="https://www.sns.id/"
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--accent)" }}
          >
            sns.id
          </a>{" "}
          (mainnet) or use the SNS devnet faucet path.
        </div>
      )}

      {domains.length > 0 && (
        <ul style={{ display: "grid", gap: "0.5rem", listStyle: "none", padding: 0, margin: 0 }}>
          {domains.map((d) => (
            <li
              key={d}
              className="panel"
              style={{
                background: "var(--panel-2)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.875rem 1rem",
              }}
            >
              <span style={{ fontFamily: "monospace" }}>{d}</span>
              <button className="btn-accent" onClick={() => setWizardParent(d)}>
                Create agent subdomain
              </button>
            </li>
          ))}
        </ul>
      )}

      {wizardParent && (
        <CreateAgentWizard
          parentDomain={wizardParent}
          onClose={() => setWizardParent(null)}
          onCreated={() => {
            setWizardParent(null);
            void refresh();
          }}
        />
      )}
    </section>
  );
}
