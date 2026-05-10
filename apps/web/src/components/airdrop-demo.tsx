"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2,
  Gift,
  ShieldX,
  Loader2,
  Sparkles,
  Check,
  X,
} from "lucide-react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  parsePermission,
  readRecordV2,
  type AgentPermission,
} from "@snsip/agent-sdk";
import { explorerTx, shortPubkey } from "@/lib/format";

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

const CANDIDATES = [
  "snsip-test-001.sol",
  "swap-bot.sol",
  "monitor.sol",
  "auditor.sol",
  "arb-trader.sol",
];

interface CheckSet {
  signingPubkey: boolean;
  endpoint: boolean;
  capabilities: boolean;
  permissionShape: boolean;
  notExpired: boolean;
}

interface AgentRow {
  domain: string;
  signingPubkey: string | null;
  endpoint: string | null;
  capabilities: AgentPermission | null;
  rawCapabilities: string | null;
  loading: boolean;
  checks: CheckSet;
  eligible: boolean;
  claimSig?: string;
  claimError?: string;
  claiming?: boolean;
}

const EMPTY_CHECKS: CheckSet = {
  signingPubkey: false,
  endpoint: false,
  capabilities: false,
  permissionShape: false,
  notExpired: false,
};

function evaluateEligibility(row: AgentRow): { checks: CheckSet; eligible: boolean } {
  const now = Math.floor(Date.now() / 1000);
  const checks: CheckSet = {
    signingPubkey: !!row.signingPubkey,
    endpoint: !!row.endpoint,
    capabilities: !!row.capabilities,
    permissionShape: !!(row.capabilities?.calls?.length && row.capabilities?.spends?.length),
    notExpired: !row.capabilities?.expiresAt || row.capabilities.expiresAt > now,
  };
  const eligible = Object.values(checks).every(Boolean);
  return { checks, eligible };
}

export function AirdropDemo() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [rows, setRows] = useState<AgentRow[]>(() =>
    CANDIDATES.map((d) => ({
      domain: d,
      signingPubkey: null,
      endpoint: null,
      capabilities: null,
      rawCapabilities: null,
      loading: true,
      checks: EMPTY_CHECKS,
      eligible: false,
    })),
  );

  // Load each agent's on-chain identity records, in parallel
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const results = await Promise.all(
        CANDIDATES.map(async (domain) => {
          const [signingPubkey, endpoint, rawCapabilities] = await Promise.all([
            readRecordV2(connection, domain, "agent.signing-pubkey").catch(() => null),
            readRecordV2(connection, domain, "agent.endpoint").catch(() => null),
            readRecordV2(connection, domain, "agent.capabilities").catch(() => null),
          ]);
          let capabilities: AgentPermission | null = null;
          if (rawCapabilities) {
            try {
              const json = rawCapabilities.replace(/^data:application\/json,/, "");
              capabilities = parsePermission(json);
            } catch {}
          }
          return { domain, signingPubkey, endpoint, capabilities, rawCapabilities };
        }),
      );
      if (cancelled) return;
      setRows((prev) =>
        prev.map((p, i) => {
          const r = results[i];
          const base: AgentRow = {
            ...p,
            ...r,
            loading: false,
          };
          const { checks, eligible } = evaluateEligibility(base);
          return { ...base, checks, eligible };
        }),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [connection]);

  const claim = async (idx: number) => {
    if (!publicKey || !sendTransaction) return;
    const row = rows[idx];
    if (!row.eligible) return;
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], claiming: true, claimError: undefined };
      return next;
    });
    try {
      const memo = `SNSIP-Agent airdrop claim · ${row.domain} · agent=${row.signingPubkey ?? "?"} · t=${new Date().toISOString()}`;
      const ix = new TransactionInstruction({
        programId: MEMO_PROGRAM_ID,
        keys: [],
        data: Buffer.from(memo, "utf8"),
      });
      const tx = new Transaction().add(ix);
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = publicKey;
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");
      setRows((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], claiming: false, claimSig: sig };
        return next;
      });
    } catch (e) {
      setRows((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], claiming: false, claimError: (e as Error).message };
        return next;
      });
    }
  };

  const eligibleCount = rows.filter((r) => r.eligible && !r.loading).length;
  const totalReady = rows.filter((r) => !r.loading).length;

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <div
        className="panel"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          padding: "1.25rem 1.5rem",
          background: "var(--accent-bg)",
          borderColor: "#d8e8a8",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <Sparkles size={20} />
          <div>
            <div style={{ fontWeight: 700, fontSize: "1rem" }}>
              {totalReady === 0 ? "Loading registry…" : `${eligibleCount} of ${totalReady} agents pass identity gate`}
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--muted-2)" }}>
              Eligibility = on-chain owner + signing pubkey + endpoint + structured permission JSON.
              Bare wallets and stub agents bounce.
            </div>
          </div>
        </div>
        {!publicKey && (
          <span className="tag" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
            connect wallet to claim
          </span>
        )}
      </div>

      <div style={{ display: "grid", gap: "0.875rem" }}>
        {rows.map((row, idx) => (
          <motion.div
            layout
            key={row.domain}
            className="panel"
            style={{
              padding: "1.25rem 1.5rem",
              display: "grid",
              gap: "0.625rem",
              opacity: row.loading ? 0.6 : 1,
              borderColor: row.loading
                ? "var(--border)"
                : row.eligible
                  ? "#cfe39b"
                  : "rgba(220,38,38,0.35)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                {row.loading ? (
                  <Loader2 size={18} className="spin" />
                ) : row.eligible ? (
                  <CheckCircle2 size={18} style={{ color: "var(--accent-2)" }} />
                ) : (
                  <ShieldX size={18} style={{ color: "var(--danger)" }} />
                )}
                <strong style={{ fontSize: "0.9375rem" }}>{row.domain}</strong>
                {row.endpoint && (
                  <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                    {row.endpoint.replace(/^https?:\/\//, "")}
                  </span>
                )}
              </div>
              <AnimatePresence mode="wait">
                {!row.loading && row.eligible && !row.claimSig && (
                  <motion.button
                    key="claim"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => claim(idx)}
                    disabled={!publicKey || row.claiming}
                    className="btn-lime"
                    style={{ padding: "0.5rem 1rem", fontSize: "0.8125rem" }}
                  >
                    {row.claiming ? (
                      <>
                        <Loader2 size={14} className="spin" /> claiming…
                      </>
                    ) : (
                      <>
                        <Gift size={14} /> Claim airdrop
                      </>
                    )}
                  </motion.button>
                )}
                {row.claimSig && (
                  <motion.a
                    key="claimed"
                    href={explorerTx(row.claimSig)}
                    target="_blank"
                    rel="noreferrer"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="tag"
                    style={{ borderColor: "var(--accent-2)", color: "var(--text)", background: "var(--accent-bg)" }}
                  >
                    claimed · {shortPubkey(row.claimSig, 6, 6)} ↗
                  </motion.a>
                )}
              </AnimatePresence>
            </div>

            {!row.loading && (
              <div style={{ display: "grid", gap: "0.375rem", fontSize: "0.8125rem" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem 0.875rem" }}>
                  <CheckChip ok={row.checks.signingPubkey} label="signing key" />
                  <CheckChip ok={row.checks.endpoint} label="endpoint" />
                  <CheckChip ok={row.checks.capabilities} label="capability JSON" />
                  <CheckChip
                    ok={row.checks.permissionShape}
                    label={
                      row.capabilities
                        ? `${row.capabilities.calls?.length ?? 0} call · ${row.capabilities.spends?.length ?? 0} cap`
                        : "structured grant"
                    }
                  />
                  <CheckChip
                    ok={row.checks.notExpired}
                    label={
                      row.capabilities?.expiresAt
                        ? `expires ${new Date(row.capabilities.expiresAt * 1000).toLocaleDateString()}`
                        : "non-expiring"
                    }
                  />
                </div>
              </div>
            )}

            {row.claimError && (
              <div style={{ fontSize: "0.75rem", color: "var(--danger)" }}>{row.claimError}</div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="panel" style={{ background: "var(--panel-2)", padding: "1.25rem 1.5rem", display: "grid", gap: "0.5rem" }}>
        <strong style={{ fontSize: "0.875rem" }}>Why this beats wallet-only allowlists</strong>
        <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--muted-2)", lineHeight: 1.6 }}>
          A sybil farmer can spin up 10,000 fresh wallets in an hour. They cannot conjure 10,000 .sol{" "}
          domains with valid records v2 and a published agent permission tuple. Each ineligible row
          above is a live demonstration of the gate working — the same logic ports to a token claim,
          DAO voting weight, or reputation feeder.
        </p>
      </div>

      <style jsx>{`
        .spin {
          animation: rot 0.9s linear infinite;
        }
        @keyframes rot {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </section>
  );
}

function CheckChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        color: ok ? "var(--text)" : "var(--danger)",
        fontSize: "0.75rem",
      }}
    >
      {ok ? (
        <Check size={12} style={{ color: "var(--accent-2)" }} />
      ) : (
        <X size={12} style={{ color: "var(--danger)" }} />
      )}
      {label}
    </span>
  );
}
