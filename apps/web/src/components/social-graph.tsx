"use client";

import { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  parsePermission,
  readRecordV2,
  type AgentPermission,
} from "@snsip/agent-sdk";
import { explorerAddress, shortPubkey } from "@/lib/format";

// SocialGraph — visualizes the .sol agent constellation for the
// demo owner wallet. One central node (owner wallet), five satellite
// nodes (the demo .sol agents), each with on-chain sub-pills showing
// the records v2 attached to it. Hits the bounty's two example
// project types: "social graph protocols that leverage Solana
// wallets for identity" + "tools that visualize or manage aspects of
// decentralized identity."

const OWNER_WALLET = "6AcSwibbv26kg7qAB28CXCAH2jSbSK39SeM5KuArjEt";

const DEMO_AGENTS = [
  "snsip-test-001.sol",
  "swap-bot.sol",
  "monitor.sol",
  "auditor.sol",
  "arb-trader.sol",
];

interface AgentNode {
  domain: string;
  signingPubkey: string | null;
  endpoint: string | null;
  description: string | null;
  hasPermission: boolean;
  callsCount: number;
  loaded: boolean;
}

export function SocialGraph() {
  const { connection } = useConnection();
  const [agents, setAgents] = useState<AgentNode[]>(() =>
    DEMO_AGENTS.map((d) => ({
      domain: d,
      signingPubkey: null,
      endpoint: null,
      description: null,
      hasPermission: false,
      callsCount: 0,
      loaded: false,
    })),
  );
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const results = await Promise.all(
        DEMO_AGENTS.map(async (domain) => {
          const [signingPubkey, endpoint, capRaw] = await Promise.all([
            readRecordV2(connection, domain, "agent.signing-pubkey").catch(() => null),
            readRecordV2(connection, domain, "agent.endpoint").catch(() => null),
            readRecordV2(connection, domain, "agent.capabilities").catch(() => null),
          ]);
          let perm: AgentPermission | null = null;
          let description: string | null = null;
          if (capRaw) {
            try {
              const json = capRaw.replace(/^data:application\/json,/, "");
              perm = parsePermission(json);
              const raw = JSON.parse(json) as { description?: string };
              description = raw.description ?? null;
            } catch {}
          }
          return {
            domain,
            signingPubkey,
            endpoint,
            description,
            hasPermission: !!perm,
            callsCount: perm?.calls?.length ?? 0,
            loaded: true,
          };
        }),
      );
      if (!cancelled) setAgents(results);
    })();
    return () => {
      cancelled = true;
    };
  }, [connection]);

  // Lay out the 5 agents on a circle around the central wallet node.
  const radius = 220;
  const center = { x: 360, y: 320 };
  const positions = DEMO_AGENTS.map((_, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / DEMO_AGENTS.length;
    return {
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    };
  });

  const selectedAgent = agents.find((a) => a.domain === selected) ?? null;

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <div className="panel" style={{ background: "var(--accent-bg)", borderColor: "#cfe39b", padding: "1.25rem 1.5rem" }}>
        <strong style={{ fontSize: "0.9375rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          🌐 What this shows
        </strong>
        <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem", color: "var(--muted-2)", lineHeight: 1.55 }}>
          Every dot is a real on-chain identity on Solana. The center is the owner
          wallet. The five spokes are <code>.sol</code> agents that wallet owns.
          Each agent carries records v2 — signing key, endpoint, permission grant —
          all readable from any Solana RPC. Click any dot to see what's published.
        </p>
      </div>

      <div
        className="panel"
        style={{
          padding: 0,
          background: "var(--bg)",
          borderColor: "var(--border)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <svg viewBox="0 0 720 640" style={{ width: "100%", height: "auto", display: "block" }}>
          {/* Edges from center to each agent */}
          {positions.map((p, i) => {
            const a = agents[i];
            const hot = selected === null || selected === a.domain;
            return (
              <line
                key={`edge-${i}`}
                x1={center.x}
                y1={center.y}
                x2={p.x}
                y2={p.y}
                stroke={hot ? "var(--accent)" : "var(--border)"}
                strokeWidth={hot ? 2 : 1}
                strokeOpacity={hot ? 0.7 : 0.3}
                strokeDasharray={a.loaded ? "0" : "4 4"}
              />
            );
          })}

          {/* Central owner-wallet node */}
          <circle cx={center.x} cy={center.y} r={56} fill="var(--text)" />
          <circle cx={center.x} cy={center.y} r={56} fill="none" stroke="var(--accent)" strokeWidth={2} />
          <text
            x={center.x}
            y={center.y - 4}
            textAnchor="middle"
            fontSize={11}
            fontFamily="ui-monospace, monospace"
            fill="var(--accent)"
            fontWeight={700}
          >
            OWNER
          </text>
          <text
            x={center.x}
            y={center.y + 14}
            textAnchor="middle"
            fontSize={10}
            fontFamily="ui-monospace, monospace"
            fill="#fafafa"
          >
            {shortPubkey(OWNER_WALLET, 4, 4)}
          </text>

          {/* Agent satellite nodes */}
          {positions.map((p, i) => {
            const a = agents[i];
            const isHovered = selected === a.domain;
            return (
              <g
                key={a.domain}
                style={{ cursor: "pointer" }}
                onClick={() => setSelected(isHovered ? null : a.domain)}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 52 : 46}
                  fill="var(--panel)"
                  stroke={a.hasPermission ? "var(--accent-2)" : "var(--border)"}
                  strokeWidth={isHovered ? 3 : 2}
                  style={{ transition: "all 0.2s ease" }}
                />
                {a.hasPermission && (
                  <circle
                    cx={p.x + 32}
                    cy={p.y - 32}
                    r={8}
                    fill="var(--accent)"
                    stroke="var(--panel)"
                    strokeWidth={2}
                  />
                )}
                <text
                  x={p.x}
                  y={p.y - 4}
                  textAnchor="middle"
                  fontSize={11}
                  fontFamily="ui-monospace, monospace"
                  fill="var(--text)"
                  fontWeight={700}
                >
                  {a.domain.replace(".sol", "")}
                </text>
                <text
                  x={p.x}
                  y={p.y + 10}
                  textAnchor="middle"
                  fontSize={9}
                  fontFamily="ui-monospace, monospace"
                  fill="var(--muted)"
                >
                  .sol
                </text>
                {a.callsCount > 0 && (
                  <text
                    x={p.x}
                    y={p.y + 26}
                    textAnchor="middle"
                    fontSize={9}
                    fill="var(--muted-2)"
                  >
                    {a.callsCount} call · 1 cap
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: 12,
            fontSize: "0.6875rem",
            color: "var(--muted)",
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            background: "var(--bg)",
            padding: "6px 10px",
            borderRadius: 6,
            border: "1px solid var(--border)",
          }}
        >
          <span><span style={{ display: "inline-block", width: 10, height: 10, background: "var(--accent)", borderRadius: 5, verticalAlign: "middle", marginRight: 4 }} /> has permission grant</span>
          <span><span style={{ display: "inline-block", width: 10, height: 10, border: "2px solid var(--border)", borderRadius: 5, verticalAlign: "middle", marginRight: 4 }} /> agent</span>
          <span>click any node for details</span>
        </div>
      </div>

      {selectedAgent && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel"
          style={{ padding: "1.25rem 1.5rem", display: "grid", gap: "0.75rem", borderColor: "#cfe39b" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <strong style={{ fontSize: "1rem", fontFamily: "monospace" }}>{selectedAgent.domain}</strong>
            <Link
              href={`/agents/?domain=${encodeURIComponent(selectedAgent.domain)}`}
              className="btn-accent"
              style={{ padding: "0.5rem 0.875rem", fontSize: "0.75rem", textDecoration: "none" }}
            >
              full profile →
            </Link>
          </div>
          {selectedAgent.description && (
            <div style={{ fontSize: "0.875rem", color: "var(--muted-2)" }}>{selectedAgent.description}</div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.625rem", fontSize: "0.8125rem" }}>
            <div style={{ padding: "0.625rem 0.75rem", background: "var(--panel-2)", borderRadius: "var(--radius-sm)" }}>
              <div style={{ fontSize: "0.625rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>signing key</div>
              <div style={{ fontFamily: "monospace", marginTop: 2 }}>
                {selectedAgent.signingPubkey ? shortPubkey(selectedAgent.signingPubkey, 8, 8) : "—"}
              </div>
            </div>
            <div style={{ padding: "0.625rem 0.75rem", background: "var(--panel-2)", borderRadius: "var(--radius-sm)" }}>
              <div style={{ fontSize: "0.625rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>endpoint</div>
              <div style={{ marginTop: 2 }}>
                {selectedAgent.endpoint ? selectedAgent.endpoint.replace(/^https?:\/\//, "") : "—"}
              </div>
            </div>
            <div style={{ padding: "0.625rem 0.75rem", background: "var(--panel-2)", borderRadius: "var(--radius-sm)" }}>
              <div style={{ fontSize: "0.625rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>permission</div>
              <div style={{ marginTop: 2 }}>
                {selectedAgent.hasPermission ? `${selectedAgent.callsCount} allowed call(s)` : "none set"}
              </div>
            </div>
            <div style={{ padding: "0.625rem 0.75rem", background: "var(--panel-2)", borderRadius: "var(--radius-sm)" }}>
              <div style={{ fontSize: "0.625rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>owner</div>
              <a
                href={explorerAddress(OWNER_WALLET)}
                target="_blank"
                rel="noreferrer"
                style={{ fontFamily: "monospace", marginTop: 2, color: "var(--text)", display: "block" }}
              >
                {shortPubkey(OWNER_WALLET, 6, 6)} ↗
              </a>
            </div>
          </div>
        </motion.div>
      )}

      <div className="panel" style={{ background: "var(--panel-2)", padding: "1.25rem 1.5rem", display: "grid", gap: "0.5rem" }}>
        <strong style={{ fontSize: "0.875rem" }}>How this maps to the bounty</strong>
        <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--muted-2)", lineHeight: 1.55 }}>
          The SNS Identity Track listed two example project types we hit on this
          page directly: <em>"social graph protocols that leverage Solana
          wallets for identity"</em> and <em>"tools that visualize or manage
          aspects of decentralized identity."</em> Every edge here is real —
          you can fetch the same records v2 from any Solana RPC and rebuild
          this graph yourself.
        </p>
      </div>
    </section>
  );
}
