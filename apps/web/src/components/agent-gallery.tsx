"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import {
  readRecordV2,
  RECORD_AGENT_CONTROLLER,
  RECORD_AGENT_ENDPOINT,
  RECORD_AGENT_SIGNING_PUBKEY,
} from "@snsip/agent-sdk";
import { shortPubkey } from "@/lib/format";

// Real on-chain devnet domains seeded via scripts/seed-many.cts. The
// gallery's read path is cluster-aware via @snsip/agent-sdk, so these
// resolve against devnet and render with full records v2 +
// permission JSON.
const DEMO_DOMAINS = [
  "snsip-test-001.sol",
  "swap-bot.sol",
  "monitor.sol",
  "auditor.sol",
  "arb-trader.sol",
];

interface GalleryEntry {
  domain: string;
  signingPubkey: string | null;
  controller: string | null;
  endpoint: string | null;
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
        DEMO_DOMAINS.map(async (domain) => {
          const [signingPubkey, controller, endpoint] = await Promise.all([
            readRecordV2(connection, domain, RECORD_AGENT_SIGNING_PUBKEY).catch(() => null),
            readRecordV2(connection, domain, RECORD_AGENT_CONTROLLER).catch(() => null),
            readRecordV2(connection, domain, RECORD_AGENT_ENDPOINT).catch(() => null),
          ]);
          return { domain, signingPubkey, controller, endpoint };
        }),
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
  const has = entry.signingPubkey !== null;

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
        {entry.controller && (
          <div style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
            controlled by <code>{shortPubkey(entry.controller, 6, 6)}</code>
          </div>
        )}
        {entry.signingPubkey && (
          <div style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
            signing-pubkey: <code>{shortPubkey(entry.signingPubkey, 6, 6)}</code>
          </div>
        )}
        {entry.endpoint && (
          <div style={{ fontSize: "0.8125rem", color: "var(--muted)", wordBreak: "break-all" }}>
            endpoint: <code>{entry.endpoint}</code>
          </div>
        )}
      </div>
    </Link>
  );
}
