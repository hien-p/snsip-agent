"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { Calendar, Globe, KeyRound, ShieldCheck, Wallet, Zap } from "lucide-react";
import {
  ALL_AGENT_RECORD_KEYS,
  parsePermission,
  readRecordV2,
  resolveDomainOwner,
  type AgentPermission,
} from "@snsip/agent-sdk";
import { explorerAddress, shortPubkey } from "@/lib/format";
import { RecordCard } from "./record-card";
import { PermissionEditor } from "./permission-editor";
import { ReputationTimeline } from "./reputation-timeline";
import { ValidationsList } from "./validations-list";

type Tab = "overview" | "permissions" | "reputation" | "validations";

// Friendly labels for well-known program IDs and token mints. Anything not in
// the table falls back to the truncated pubkey.
const KNOWN_PROGRAMS: Record<string, { name: string; tag?: string }> = {
  JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4: { name: "Jupiter Aggregator", tag: "DEX router" },
  TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA: { name: "SPL Token", tag: "Solana standard" },
};
const KNOWN_TOKENS: Record<string, { symbol: string; decimals: number }> = {
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: { symbol: "USDC", decimals: 6 },
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: { symbol: "USDT", decimals: 6 },
  So11111111111111111111111111111111111111112: { symbol: "SOL", decimals: 9 },
};

export function AgentProfile({ domain }: { domain: string }) {
  const { connection } = useConnection();
  const [owner, setOwner] = useState<string | null>(null);
  const [records, setRecords] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const [o, recordEntries] = await Promise.all([
        resolveDomainOwner(connection, domain).catch(() => null),
        Promise.all(
          ALL_AGENT_RECORD_KEYS.map(async (k) => [k, await readRecordV2(connection, domain, k)] as const),
        ),
      ]);
      if (cancelled) return;
      setOwner(o?.toBase58() ?? null);
      setRecords(Object.fromEntries(recordEntries));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [connection, domain]);

  const capabilitiesRaw = records["agent.capabilities"] ?? null;
  const permission = useMemo<AgentPermission | null>(() => {
    if (!capabilitiesRaw) return null;
    try {
      const json = capabilitiesRaw.replace(/^data:application\/json,/, "");
      return parsePermission(json);
    } catch {
      return null;
    }
  }, [capabilitiesRaw]);

  const description = (permission as (AgentPermission & { description?: string }) | null)?.description ?? null;
  const signingPubkey = records["agent.signing-pubkey"];
  const endpoint = records["agent.endpoint"];
  const avatar = records["avatar"];
  const hasAgent = signingPubkey !== null;

  if (loading) {
    return <div className="panel">Loading {domain}…</div>;
  }

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      {/* Profile header — avatar + name + description + status */}
      <div className="panel" style={{ display: "grid", gap: "1rem", padding: "1.5rem" }}>
        <Link href="/agents" style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
          ← back to gallery
        </Link>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          {avatar && (
            <img
              src={avatar}
              alt={`${domain} avatar`}
              width={64}
              height={64}
              style={{
                borderRadius: "999px",
                background: "var(--panel-2)",
                border: "1px solid var(--border)",
                flexShrink: 0,
              }}
            />
          )}
          <div style={{ display: "grid", gap: "0.25rem", flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", gap: "0.625rem", alignItems: "center", flexWrap: "wrap" }}>
              <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700, margin: 0, fontFamily: "monospace", letterSpacing: "-0.02em" }}>
                {domain}
              </h1>
              {hasAgent ? (
                <span className="tag" style={{ background: "var(--accent-bg)", color: "var(--text)", borderColor: "var(--accent)" }}>
                  ✓ SNSIP-Agent
                </span>
              ) : (
                <span className="tag">no agent record</span>
              )}
            </div>
            {description && <p style={{ margin: 0, color: "var(--muted-2)", fontSize: "0.9375rem" }}>{description}</p>}
            {owner && (
              <div style={{ fontSize: "0.8125rem", color: "var(--muted)", marginTop: "0.125rem" }}>
                Owned by{" "}
                <a href={explorerAddress(owner)} target="_blank" rel="noreferrer" style={{ color: "var(--text)", fontWeight: 500 }}>
                  {shortPubkey(owner, 6, 6)} ↗
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div className="panel" style={{ padding: "0", display: "flex", overflow: "hidden", flexWrap: "wrap" }}>
        {(["overview", "permissions", "reputation", "validations"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              minWidth: "120px",
              padding: "0.875rem 1rem",
              background: tab === t ? "var(--panel-2)" : "transparent",
              color: tab === t ? "var(--text)" : "var(--muted)",
              border: "none",
              borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent",
              cursor: "pointer",
              textTransform: "capitalize",
              fontWeight: tab === t ? 600 : 400,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div style={{ display: "grid", gap: "1rem" }}>
          <QuickFacts
            endpoint={endpoint ?? null}
            signingPubkey={signingPubkey ?? null}
            permission={permission}
          />
          {permission && <PermissionView permission={permission} />}
          <TalkToAgentCallout domain={domain} />


          {/* Optional: raw on-chain records, hidden behind a toggle */}
          <button
            onClick={() => setShowRaw((v) => !v)}
            className="btn-ghost"
            style={{ alignSelf: "start", padding: "0.5rem 0.875rem", fontSize: "0.8125rem" }}
          >
            {showRaw ? "Hide" : "Show"} raw on-chain records
          </button>
          {showRaw && (
            <div style={{ display: "grid", gap: "0.5rem" }}>
              {ALL_AGENT_RECORD_KEYS.map((k) => (
                <RecordCard key={k} recordKey={k} value={records[k] ?? null} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "permissions" && <PermissionEditor domain={domain} />}

      {tab === "reputation" && <ReputationTimeline domain={domain} ownerWallet={owner} />}

      {tab === "validations" && <ValidationsList domain={domain} />}
    </section>
  );
}

function QuickFacts({
  endpoint,
  signingPubkey,
  permission,
}: {
  endpoint: string | null;
  signingPubkey: string | null;
  permission: AgentPermission | null;
}) {
  const expiresAt = permission?.expiresAt;
  const daysLeft =
    expiresAt !== undefined ? Math.max(0, Math.round((expiresAt - Date.now() / 1000) / 86400)) : null;

  const facts: { Icon: typeof Globe; label: string; value: React.ReactNode }[] = [];

  if (endpoint) {
    const display = endpoint.replace(/^https?:\/\//, "");
    facts.push({
      Icon: Globe,
      label: "Talks at",
      value: (
        <a href={endpoint} target="_blank" rel="noreferrer" style={{ color: "var(--text)", fontWeight: 500 }}>
          {display} ↗
        </a>
      ),
    });
  }
  if (signingPubkey) {
    facts.push({
      Icon: KeyRound,
      label: "Signs with",
      value: (
        <a
          href={explorerAddress(signingPubkey)}
          target="_blank"
          rel="noreferrer"
          style={{ color: "var(--text)", fontWeight: 500, fontFamily: "monospace" }}
        >
          {shortPubkey(signingPubkey, 6, 6)} ↗
        </a>
      ),
    });
  }
  if (daysLeft !== null) {
    facts.push({
      Icon: Calendar,
      label: "Permissions",
      value: (
        <span style={{ color: daysLeft > 0 ? "var(--text)" : "var(--danger)", fontWeight: 500 }}>
          {daysLeft > 0 ? `expire in ${daysLeft} days` : "expired"}
        </span>
      ),
    });
  }

  if (facts.length === 0) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "0.75rem",
      }}
    >
      {facts.map((f) => (
        <div key={f.label} className="panel" style={{ display: "flex", gap: "0.75rem", alignItems: "center", padding: "1rem" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "2rem",
              height: "2rem",
              borderRadius: "999px",
              background: "var(--accent-bg)",
              color: "var(--text)",
              flexShrink: 0,
            }}
          >
            <f.Icon size={16} />
          </span>
          <div style={{ display: "grid", gap: "0.125rem", minWidth: 0 }}>
            <span style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {f.label}
            </span>
            <span style={{ fontSize: "0.9375rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {f.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function PermissionView({ permission }: { permission: AgentPermission }) {
  return (
    <div
      style={{
        background: "var(--accent-bg)",
        border: "1px solid #d8e8a8",
        borderRadius: "var(--radius-xl)",
        padding: "1.25rem 1.5rem",
        display: "grid",
        gap: "1rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <ShieldCheck size={18} style={{ color: "var(--text)" }} />
        <strong style={{ fontSize: "1rem" }}>What this agent is allowed to do</strong>
      </div>

      {/* Allowed calls */}
      {permission.calls.length > 0 && (
        <div style={{ display: "grid", gap: "0.5rem" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--muted-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Can call
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            {permission.calls.map((c, i) => {
              const known = KNOWN_PROGRAMS[c.target];
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                    padding: "0.625rem 0.875rem",
                    background: "var(--panel)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                    <Zap size={14} style={{ color: "var(--accent-2)" }} />
                    <strong style={{ fontSize: "0.875rem", color: "var(--text)" }}>
                      {known?.name ?? "On-chain program"}
                    </strong>
                    {known?.tag && (
                      <span style={{ fontSize: "0.6875rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        · {known.tag}
                      </span>
                    )}
                  </div>
                  <a
                    href={explorerAddress(c.target)}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: "0.75rem", color: "var(--muted)", fontFamily: "monospace" }}
                    title={c.target}
                  >
                    {shortPubkey(c.target, 4, 4)} ↗
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Spend caps */}
      {permission.spends && permission.spends.length > 0 && (
        <div style={{ display: "grid", gap: "0.5rem" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--muted-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Can spend up to
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            {permission.spends.map((s, i) => {
              const tok = KNOWN_TOKENS[s.mint];
              const human = tok ? Number(s.allowance) / 10 ** tok.decimals : Number(s.allowance);
              const period =
                s.periodSeconds === 86400 ? "day" : s.periodSeconds === 3600 ? "hour" : s.periodSeconds === undefined ? "lifetime" : `${s.periodSeconds}s`;
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                    padding: "0.625rem 0.875rem",
                    background: "var(--panel)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Wallet size={14} style={{ color: "var(--accent-2)" }} />
                    <strong style={{ fontSize: "0.875rem", color: "var(--text)" }}>
                      {human.toLocaleString()} {tok?.symbol ?? "tokens"}
                    </strong>
                    <span style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>per {period}</span>
                  </div>
                  <a
                    href={explorerAddress(s.mint)}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: "0.75rem", color: "var(--muted)", fontFamily: "monospace" }}
                    title={s.mint}
                  >
                    {shortPubkey(s.mint, 4, 4)} ↗
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function TalkToAgentCallout({ domain }: { domain: string }) {
  return (
    <div
      className="panel"
      style={{
        background: "var(--panel-2)",
        padding: "1.25rem 1.5rem",
        display: "grid",
        gap: "0.5rem",
      }}
    >
      <strong style={{ fontSize: "0.875rem" }}>Talk to {domain} from your AI assistant</strong>
      <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--muted-2)", lineHeight: 1.6 }}>
        Install the SNSIP-Agent MCP server in Claude Desktop, Cursor, or any MCP-aware client and ask
        live questions about <code>{domain}</code> — its permissions, signing key, endpoint, owner.
        Same on-chain records you see above, exposed through the Model Context Protocol.
      </p>
      <Link
        href="/mcp"
        className="btn-accent"
        style={{ alignSelf: "start", padding: "0.5rem 0.875rem", fontSize: "0.8125rem", textDecoration: "none" }}
      >
        See MCP install →
      </Link>
    </div>
  );
}
