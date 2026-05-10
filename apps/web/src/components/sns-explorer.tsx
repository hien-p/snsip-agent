"use client";

import { useState } from "react";
import { ALL_AGENT_RECORD_KEYS } from "@snsip/agent-sdk";
import { useResolveDomain } from "@/lib/use-sns";
import { isValidDomain, normalizeDomain, shortPubkey, explorerAddress } from "@/lib/format";
import { RecordCard } from "./record-card";

export function SnsExplorer() {
  const [input, setInput] = useState("bonfida.sol");
  const [resolving, setResolving] = useState<string | null>(null);
  const { owner, agent, records, loading, error } = useResolveDomain(resolving);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidDomain(input)) return;
    setResolving(normalizeDomain(input));
  };

  return (
    <section className="panel" style={{ display: "grid", gap: "1rem" }}>
      <header>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Resolve any .sol</h2>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
          Paste any Solana name. We render the owner and SNSIP-Agent records v2 live.
        </p>
      </header>

      <form onSubmit={submit} style={{ display: "flex", gap: "0.5rem" }}>
        <input
          className="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="alice.sol"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />
        <button type="submit" className="btn-accent" disabled={!isValidDomain(input)}>
          Resolve
        </button>
      </form>

      {resolving && (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <div style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
            Resolving <code style={{ color: "var(--text)" }}>{resolving}</code>
            {loading && " — loading…"}
            {error && (
              <span style={{ color: "var(--danger)" }}> — {error}</span>
            )}
          </div>

          {owner && (
            <div style={{ fontSize: "0.875rem" }}>
              <span style={{ color: "var(--muted)" }}>Owner: </span>
              <a
                href={explorerAddress(owner)}
                target="_blank"
                rel="noreferrer"
                style={{ color: "var(--accent)" }}
              >
                {shortPubkey(owner, 8, 8)}
              </a>
            </div>
          )}

          {agent && (
            <div className="panel" style={{ background: "var(--panel-2)" }}>
              <strong>✓ SNSIP-Agent bound</strong>
              <div style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>
                Registry: <code>{shortPubkey(agent.registry, 8, 8)}</code> · agentId: {agent.agentId.toString()}
              </div>
            </div>
          )}

          <div style={{ display: "grid", gap: "0.5rem" }}>
            {ALL_AGENT_RECORD_KEYS.map((k) => (
              <RecordCard key={k} recordKey={k} value={records[k] ?? null} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
