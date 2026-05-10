"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import {
  readRecordV2,
  RECORD_AGENT_ENDPOINT,
  RECORD_AGENT_SIGNING_PUBKEY,
  RECORD_AVATAR,
} from "@snsip/agent-sdk";
import { shortPubkey } from "@/lib/format";

const PREVIEW_DOMAINS = ["snsip-test-001.sol", "swap-bot.sol", "monitor.sol"];

interface AgentPreview {
  domain: string;
  signingPubkey: string | null;
  endpoint: string | null;
  avatar: string | null;
}

export function LiveAgentsPreview() {
  const { connection } = useConnection();
  const [agents, setAgents] = useState<AgentPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const results = await Promise.all(
        PREVIEW_DOMAINS.map(async (domain) => {
          const [signingPubkey, endpoint, avatar] = await Promise.all([
            readRecordV2(connection, domain, RECORD_AGENT_SIGNING_PUBKEY).catch(() => null),
            readRecordV2(connection, domain, RECORD_AGENT_ENDPOINT).catch(() => null),
            readRecordV2(connection, domain, RECORD_AVATAR).catch(() => null),
          ]);
          return { domain, signingPubkey, endpoint, avatar };
        }),
      );
      if (!cancelled) {
        setAgents(results);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [connection]);

  return (
    <section style={{ display: "grid", gap: "0.875rem" }}>
      <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>Live agents on devnet</h2>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginTop: "0.25rem" }}>
            Real on-chain SNSIP-Agent records v2 — fetched live as you read this.
          </p>
        </div>
        <Link href="/agents" style={{ color: "var(--accent)", fontSize: "0.875rem", whiteSpace: "nowrap" }}>
          See all 5 →
        </Link>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "0.75rem",
        }}
      >
        {(loading ? PREVIEW_DOMAINS.map((d) => ({ domain: d, signingPubkey: null, endpoint: null, avatar: null })) : agents).map((a) => (
          <Link
            key={a.domain}
            href={`/agents?domain=${encodeURIComponent(a.domain)}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div
              className="panel"
              style={{
                background: "var(--panel-2)",
                display: "grid",
                gap: "0.5rem",
                cursor: "pointer",
                height: "100%",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "-1px",
                  left: "-1px",
                  right: "-1px",
                  height: "2px",
                  background: a.signingPubkey ? "var(--accent)" : "transparent",
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", overflow: "hidden" }}>
                  {a.avatar && (
                    <img
                      src={a.avatar}
                      alt=""
                      width={32}
                      height={32}
                      style={{ borderRadius: "999px", background: "var(--bg)", flexShrink: 0 }}
                    />
                  )}
                  <strong style={{ fontFamily: "monospace", fontSize: "0.9375rem", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {a.domain}
                  </strong>
                </div>
                {a.signingPubkey ? (
                  <span
                    className="tag"
                    style={{
                      background: "rgba(0,255,163,0.1)",
                      color: "var(--accent)",
                      borderColor: "var(--accent)",
                      fontSize: "0.6875rem",
                      flexShrink: 0,
                    }}
                  >
                    on-chain
                  </span>
                ) : (
                  <span className="tag" style={{ fontSize: "0.6875rem" }}>loading…</span>
                )}
              </div>
              {a.endpoint && (
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--muted)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={a.endpoint}
                >
                  endpoint · {a.endpoint.replace(/^https?:\/\//, "")}
                </div>
              )}
              {a.signingPubkey && (
                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                  pubkey · <code>{shortPubkey(a.signingPubkey, 5, 5)}</code>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
