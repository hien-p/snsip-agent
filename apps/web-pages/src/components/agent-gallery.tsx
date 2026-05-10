"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { resolveAgent, type ResolvedAgent } from "@snsip/agent-sdk";
import { shortPubkey } from "@/lib/format";

// Demo seed list. Replace with `program.account.agent.all()` once the
// identity-registry program is deployed (D2). For pre-deploy demos, we
// resolve each domain via SNS records v2 — agents that have set their
// records will render with full data; others render as "no agent bound."
const DEMO_DOMAINS = [
  "alice.sol",
  "bob.sol",
  "charlie.sol",
  "research.sol",
  "trading.sol",
  "support.sol",
];

interface GalleryEntry {
  domain: string;
  resolved: ResolvedAgent | null;
}

export function AgentGallery() {
  const { connection } = useConnection();
  const [entries, setEntries] = useState<GalleryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "alpha">("alpha");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const results = await Promise.all(
        DEMO_DOMAINS.map(async (domain) => ({
          domain,
          resolved: await resolveAgent(connection, domain).catch(() => null),
        })),
      );
      if (!cancelled) {
        setEntries(results);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [connection]);

  const filtered = useMemo(() => {
    let out = entries;
    if (filter) {
      out = out.filter((e) => e.domain.includes(filter.toLowerCase()));
    }
    if (sortBy === "alpha") {
      out = [...out].sort((a, b) => a.domain.localeCompare(b.domain));
    }
    return out;
  }, [entries, filter, sortBy]);

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <div className="panel" style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <input
          className="input"
          placeholder="Filter by .sol…"
          value={filter}
          onChange={(e) => setFilter(e.target.value.toLowerCase())}
          style={{ maxWidth: "320px" }}
        />
        <select
          className="input"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "recent" | "alpha")}
          style={{ maxWidth: "160px" }}
        >
          <option value="alpha">Alphabetical</option>
          <option value="recent">Most recent</option>
        </select>
        <span style={{ marginLeft: "auto", color: "var(--muted)", fontSize: "0.875rem" }}>
          {loading ? "loading…" : `${filtered.length} agent(s)`}
        </span>
      </div>

      {!loading && filtered.length === 0 && (
        <div className="panel" style={{ color: "var(--muted)" }}>
          No agents matched. Once the identity-registry program is deployed,
          this list pulls from <code>program.account.agent.all()</code>.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.75rem" }}>
        {filtered.map((e) => (
          <GalleryCard key={e.domain} entry={e} />
        ))}
      </div>
    </section>
  );
}

function GalleryCard({ entry }: { entry: GalleryEntry }) {
  const r = entry.resolved;
  const has = r !== null;

  return (
    <Link
      href={`/agents?domain=${encodeURIComponent(entry.domain)}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div
        className="panel"
        style={{
          background: "var(--panel-2)",
          display: "grid",
          gap: "0.5rem",
          height: "100%",
          cursor: "pointer",
          transition: "border-color 0.15s",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <strong style={{ fontFamily: "monospace" }}>{entry.domain}</strong>
          {has ? (
            <span className="tag" style={{ background: "rgba(0,255,163,0.1)", color: "var(--accent)", borderColor: "var(--accent)" }}>
              SNSIP-Agent
            </span>
          ) : (
            <span className="tag">no agent</span>
          )}
        </div>
        {r?.records.controller && (
          <div style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
            controlled by <code>{r.records.controller}</code>
          </div>
        )}
        {r?.records.signingPubkey && (
          <div style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
            signing-pubkey: <code>{shortPubkey(r.records.signingPubkey, 6, 6)}</code>
          </div>
        )}
        {r && (
          <div style={{ fontSize: "0.8125rem" }}>
            registry: <code>{shortPubkey(r.registry, 6, 6)}</code> · agentId {r.agentId.toString()}
          </div>
        )}
      </div>
    </Link>
  );
}
