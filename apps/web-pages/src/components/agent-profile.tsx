"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import {
  ALL_AGENT_RECORD_KEYS,
  readRecordV2,
  resolveAgent,
  resolveDomainOwner,
  type ResolvedAgent,
} from "@snsip/agent-sdk";
import { explorerAddress, shortPubkey } from "@/lib/format";
import { RecordCard } from "./record-card";
import { TalkToAgent } from "./talk-to-agent";

type Tab = "overview" | "reputation" | "validations" | "verify";

export function AgentProfile({ domain }: { domain: string }) {
  const { connection } = useConnection();
  const [agent, setAgent] = useState<ResolvedAgent | null>(null);
  const [owner, setOwner] = useState<string | null>(null);
  const [records, setRecords] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const [a, o, recordEntries] = await Promise.all([
        resolveAgent(connection, domain),
        resolveDomainOwner(connection, domain).catch(() => null),
        Promise.all(
          ALL_AGENT_RECORD_KEYS.map(async (k) => [k, await readRecordV2(connection, domain, k)] as const),
        ),
      ]);
      if (cancelled) return;
      setAgent(a);
      setOwner(o?.toBase58() ?? null);
      setRecords(Object.fromEntries(recordEntries));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [connection, domain]);

  if (loading) {
    return <div className="panel">Loading {domain}…</div>;
  }

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <div className="panel" style={{ display: "grid", gap: "0.75rem", padding: "1.5rem" }}>
        <Link href="/agents" style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
          ← back to gallery
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "0.5rem" }}>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, margin: 0, fontFamily: "monospace" }}>{domain}</h1>
          {agent ? (
            <span className="tag" style={{ background: "rgba(0,255,163,0.1)", color: "var(--accent)", borderColor: "var(--accent)" }}>
              ✓ SNSIP-Agent bound
            </span>
          ) : (
            <span className="tag">no agent record</span>
          )}
        </div>
        {owner && (
          <div style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
            owner:{" "}
            <a href={explorerAddress(owner)} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>
              {shortPubkey(owner, 8, 8)}
            </a>
          </div>
        )}
        {agent && (
          <div style={{ fontSize: "0.875rem" }}>
            registry <code>{shortPubkey(agent.registry, 8, 8)}</code> · agentId {agent.agentId.toString()}
          </div>
        )}
      </div>

      <div className="panel" style={{ padding: "0", display: "flex", borderRadius: "0.75rem", overflow: "hidden" }}>
        {(["overview", "reputation", "validations", "verify"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: "0.875rem 1rem",
              background: tab === t ? "var(--panel-2)" : "transparent",
              color: tab === t ? "var(--text)" : "var(--muted)",
              border: "none",
              borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent",
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div style={{ display: "grid", gap: "1rem" }}>
          <div style={{ display: "grid", gap: "0.5rem" }}>
            {ALL_AGENT_RECORD_KEYS.map((k) => (
              <RecordCard key={k} recordKey={k} value={records[k] ?? null} />
            ))}
          </div>
          {records["agent.endpoint"] && (
            <TalkToAgent
              domain={domain}
              endpoint={records["agent.endpoint"] ?? undefined}
              expectedPubkey={records["agent.signing-pubkey"] ?? undefined}
            />
          )}
        </div>
      )}

      {tab === "reputation" && (
        <div className="panel" style={{ color: "var(--muted)" }}>
          Reputation timeline will render once <code>reputation-registry</code> is deployed and indexed.{" "}
          See <code>plans/sns-identity-hackathon/PLAN.md</code> Day 5 for the design.
        </div>
      )}

      {tab === "validations" && (
        <div className="panel" style={{ color: "var(--muted)" }}>
          ValidationRecord list will render once <code>validation-registry</code> is deployed.{" "}
          Each record links to the validator's address and the audit URI.
        </div>
      )}

      {tab === "verify" && (
        <div className="panel">
          <p style={{ color: "var(--muted)", marginTop: 0 }}>
            Embedded verifier — same flow as the dedicated{" "}
            <Link href={`/playground/verify`} style={{ color: "var(--accent)" }}>
              Verifier Playground
            </Link>
            , scoped to this agent. Open the playground for the full sign + tamper UI.
          </p>
        </div>
      )}
    </section>
  );
}
