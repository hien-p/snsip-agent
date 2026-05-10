"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2,
  ShieldX,
  Loader2,
  Wand2,
  ArrowRight,
  Check,
  X,
  Clock,
} from "lucide-react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  isActive,
  parsePermission,
  permitsCall,
  readRecordV2,
  spendCapFor,
  type AgentPermission,
} from "@snsip/agent-sdk";
import { explorerTx, shortPubkey } from "@/lib/format";

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

// Demo agents we know have a permission tuple seeded
const DEMO_AGENTS = [
  "swap-bot.sol",
  "snsip-test-001.sol",
  "arb-trader.sol",
  "monitor.sol",
  "auditor.sol",
];

const PROGRAMS: Record<string, { id: string; label: string; tag: string }> = {
  jupiter: {
    id: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
    label: "Jupiter Aggregator",
    tag: "DEX router",
  },
  splToken: {
    id: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    label: "SPL Token",
    tag: "Token transfers",
  },
  unknown: {
    id: "11111111111111111111111111111111",
    label: "System Program (unauthorized)",
    tag: "should reject",
  },
};

const TOKENS: Record<string, { mint: string; symbol: string; decimals: number }> = {
  usdc: { mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", symbol: "USDC", decimals: 6 },
  sol: { mint: "So11111111111111111111111111111111111111112", symbol: "SOL", decimals: 9 },
};

interface CheckResult {
  permission: AgentPermission | null;
  active: boolean;
  callAllowed: boolean;
  capLamports: bigint | null;
  capDecimal: string | null;
  requestedRaw: bigint;
  requestedDecimal: string;
  withinCap: boolean;
  expiresAt: number | null;
  reasons: string[];
  ok: boolean;
}

function decimalToRaw(amount: string, decimals: number): bigint {
  if (!amount || isNaN(Number(amount))) return 0n;
  const [whole = "0", frac = ""] = amount.split(".");
  const padded = (frac + "0".repeat(decimals)).slice(0, decimals);
  return BigInt(whole) * BigInt(10) ** BigInt(decimals) + BigInt(padded || "0");
}

function rawToDecimal(raw: bigint, decimals: number): string {
  const div = BigInt(10) ** BigInt(decimals);
  const whole = raw / div;
  const frac = raw % div;
  if (frac === 0n) return whole.toString();
  const fracStr = frac.toString().padStart(decimals, "0").replace(/0+$/, "");
  return `${whole}.${fracStr}`;
}

export function SwapDemo() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [agent, setAgent] = useState(DEMO_AGENTS[0]);
  const [programKey, setProgramKey] = useState<keyof typeof PROGRAMS>("jupiter");
  const [tokenKey, setTokenKey] = useState<keyof typeof TOKENS>("usdc");
  const [amountStr, setAmountStr] = useState("25");

  const [permission, setPermission] = useState<AgentPermission | null>(null);
  const [permLoading, setPermLoading] = useState(true);
  const [permRaw, setPermRaw] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [sig, setSig] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load the agent's permission whenever the chosen agent changes
  useEffect(() => {
    let cancelled = false;
    setPermLoading(true);
    setPermission(null);
    setPermRaw(null);
    setSig(null);
    setError(null);
    (async () => {
      const raw = await readRecordV2(connection, agent, "agent.capabilities").catch(() => null);
      if (cancelled) return;
      setPermRaw(raw);
      if (raw) {
        try {
          const json = raw.replace(/^data:application\/json,/, "");
          setPermission(parsePermission(json));
        } catch {
          setPermission(null);
        }
      }
      setPermLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [connection, agent]);

  const check: CheckResult = useMemo(() => {
    const reasons: string[] = [];
    const program = PROGRAMS[programKey];
    const token = TOKENS[tokenKey];
    if (!permission) {
      reasons.push("agent has no permission tuple on-chain");
      return {
        permission: null,
        active: false,
        callAllowed: false,
        capLamports: null,
        capDecimal: null,
        requestedRaw: 0n,
        requestedDecimal: amountStr,
        withinCap: false,
        expiresAt: null,
        reasons,
        ok: false,
      };
    }
    const active = isActive(permission);
    if (!active) reasons.push("permission not active (expired or not yet started)");

    const callAllowed = permitsCall(permission, program.id);
    if (!callAllowed) reasons.push(`call to "${program.label}" not in agent.calls`);

    const cap = spendCapFor(permission, token.mint);
    let capLamports: bigint | null = null;
    let capDecimal: string | null = null;
    if (!cap) {
      reasons.push(`no spend cap for ${token.symbol}`);
    } else {
      capLamports = BigInt(cap.allowance);
      capDecimal = rawToDecimal(capLamports, token.decimals);
    }

    const requestedRaw = decimalToRaw(amountStr, token.decimals);
    const withinCap =
      capLamports !== null && requestedRaw > 0n && requestedRaw <= capLamports;
    if (capLamports !== null && requestedRaw > capLamports) {
      reasons.push(
        `requested ${amountStr} ${token.symbol} > cap ${capDecimal} ${token.symbol}`,
      );
    }
    if (requestedRaw === 0n) reasons.push("amount must be > 0");

    return {
      permission,
      active,
      callAllowed,
      capLamports,
      capDecimal,
      requestedRaw,
      requestedDecimal: amountStr,
      withinCap,
      expiresAt: permission.expiresAt ?? null,
      reasons,
      ok: reasons.length === 0,
    };
  }, [permission, programKey, tokenKey, amountStr]);

  const execute = async () => {
    if (!check.ok || !publicKey || !sendTransaction) return;
    setSubmitting(true);
    setError(null);
    try {
      const program = PROGRAMS[programKey];
      const token = TOKENS[tokenKey];
      const memo = `SNSIP-Agent gated swap · agent=${agent} · target=${program.label} (${shortPubkey(program.id, 4, 4)}) · ${amountStr} ${token.symbol} · permission=${permission?.label ?? "(unset)"} · t=${new Date().toISOString()}`;
      const ix = new TransactionInstruction({
        programId: MEMO_PROGRAM_ID,
        keys: [],
        data: Buffer.from(memo, "utf8"),
      });
      const tx = new Transaction().add(ix);
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = publicKey;
      const txSig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(txSig, "confirmed");
      setSig(txSig);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const program = PROGRAMS[programKey];
  const token = TOKENS[tokenKey];

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <div className="panel" style={{ padding: "1.75rem", display: "grid", gap: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Wand2 size={18} />
          <strong style={{ fontSize: "1rem" }}>Build the agent's swap intent</strong>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.875rem" }}>
          <Field label="Acting as">
            <select className="input" value={agent} onChange={(e) => setAgent(e.target.value)}>
              {DEMO_AGENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Target program">
            <select
              className="input"
              value={programKey}
              onChange={(e) => setProgramKey(e.target.value as keyof typeof PROGRAMS)}
            >
              {Object.entries(PROGRAMS).map(([k, p]) => (
                <option key={k} value={k}>
                  {p.label}
                </option>
              ))}
            </select>
            <span style={{ fontSize: "0.6875rem", color: "var(--muted)", fontFamily: "monospace" }}>
              {shortPubkey(program.id, 6, 6)} · {program.tag}
            </span>
          </Field>

          <Field label="Token">
            <select
              className="input"
              value={tokenKey}
              onChange={(e) => setTokenKey(e.target.value as keyof typeof TOKENS)}
            >
              {Object.entries(TOKENS).map(([k, t]) => (
                <option key={k} value={k}>
                  {t.symbol}
                </option>
              ))}
            </select>
          </Field>

          <Field label={`Amount (${token.symbol})`}>
            <input
              className="input"
              type="number"
              min="0"
              step="any"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
            />
          </Field>
        </div>

        <PermissionSummary permission={permission} />

        <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Quick scenario:</span>
          <button
            type="button"
            onClick={() => {
              setProgramKey("jupiter");
              setTokenKey("usdc");
              setAmountStr("25");
            }}
            className="tag"
            style={{ cursor: "pointer", fontSize: "0.6875rem" }}
          >
            ✓ within cap
          </button>
          <button
            type="button"
            onClick={() => {
              setProgramKey("jupiter");
              setTokenKey("usdc");
              setAmountStr("500");
            }}
            className="tag"
            style={{ cursor: "pointer", fontSize: "0.6875rem", borderColor: "rgba(220,38,38,0.3)", color: "var(--danger)" }}
          >
            ✗ over cap
          </button>
          <button
            type="button"
            onClick={() => {
              setProgramKey("unknown");
              setTokenKey("usdc");
              setAmountStr("25");
            }}
            className="tag"
            style={{ cursor: "pointer", fontSize: "0.6875rem", borderColor: "rgba(220,38,38,0.3)", color: "var(--danger)" }}
          >
            ✗ unknown program
          </button>
          <button
            type="button"
            onClick={() => {
              setProgramKey("jupiter");
              setTokenKey("sol");
              setAmountStr("1");
            }}
            className="tag"
            style={{ cursor: "pointer", fontSize: "0.6875rem", borderColor: "rgba(220,38,38,0.3)", color: "var(--danger)" }}
          >
            ✗ no cap for SOL
          </button>
        </div>

        <Verdict check={check} loading={permLoading} />

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <motion.button
            whileHover={{ y: check.ok ? -1 : 0 }}
            whileTap={{ scale: check.ok ? 0.97 : 1 }}
            onClick={execute}
            disabled={!check.ok || !publicKey || submitting}
            className="btn-accent"
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="spin" /> sending memo…
              </>
            ) : check.ok ? (
              <>
                Execute on Solana <ArrowRight size={14} />
              </>
            ) : (
              <>Permission would reject</>
            )}
          </motion.button>
          {!publicKey && (
            <span className="tag" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
              connect wallet
            </span>
          )}
        </div>

        <AnimatePresence>
          {sig && (
            <motion.div
              key="ok"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                padding: "1rem 1.25rem",
                background: "var(--accent-bg)",
                borderRadius: "var(--radius-md)",
                border: "1px solid #cfe39b",
                display: "grid",
                gap: "0.375rem",
              }}
            >
              <strong style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <CheckCircle2 size={16} /> Gated action recorded on-chain
              </strong>
              <div style={{ fontSize: "0.8125rem", color: "var(--muted-2)" }}>
                The Memo log proves <strong>{agent}</strong> moved {amountStr} {token.symbol} via{" "}
                {program.label} <em>under its published permission</em>. A real product would route to
                Jupiter at this point — the gate, not the swap, is the SNSIP claim.
              </div>
              <a href={explorerTx(sig)} target="_blank" rel="noreferrer" style={{ fontSize: "0.75rem", color: "var(--text)", fontFamily: "monospace" }}>
                {sig} ↗
              </a>
            </motion.div>
          )}
          {error && (
            <motion.div
              key="err"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                padding: "0.75rem 1rem",
                background: "rgba(220,38,38,0.06)",
                border: "1px solid rgba(220,38,38,0.4)",
                borderRadius: "var(--radius-md)",
                fontSize: "0.8125rem",
                color: "var(--danger)",
              }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="panel" style={{ background: "var(--panel-2)", padding: "1.25rem 1.5rem", display: "grid", gap: "0.5rem" }}>
        <strong style={{ fontSize: "0.875rem" }}>Why this matters</strong>
        <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--muted-2)", lineHeight: 1.6 }}>
          A keypair "agent" with full wallet access is a liability. The SNSIP permission tuple lets the
          parent <code>.sol</code> issue a <em>scoped</em> session: only call X, only spend Y per period,
          only until Z. Revoke = burn the parent <code>.sol</code> or rewrite the record. Borrows from
          the ENS hackathon's ENSign primitive — but on Solana you can do it in one signed memo, no L1
          gas.
        </p>
        {permRaw && (
          <details style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
            <summary style={{ cursor: "pointer" }}>Live agent.capabilities for {agent}</summary>
            <pre
              style={{
                marginTop: "0.5rem",
                padding: "0.625rem",
                background: "var(--panel)",
                borderRadius: "var(--radius-sm)",
                fontFamily: "monospace",
                fontSize: "0.7rem",
                overflow: "auto",
                maxHeight: "240px",
              }}
            >
              {permRaw}
            </pre>
          </details>
        )}
      </div>

      <style jsx>{`
        .spin { animation: rot 0.9s linear infinite; }
        @keyframes rot { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: "0.375rem" }}>
      <span style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function Verdict({ check, loading }: { check: CheckResult; loading: boolean }) {
  if (loading) {
    return (
      <div
        style={{
          padding: "1rem 1.25rem",
          background: "var(--panel-2)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          color: "var(--muted)",
          fontSize: "0.875rem",
        }}
      >
        <Loader2 size={14} className="spin" /> Reading agent.capabilities from devnet…
        <style jsx>{`
          .spin { animation: rot 0.9s linear infinite; }
          @keyframes rot { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  const ok = check.ok;
  const items: { ok: boolean; label: string; detail?: string }[] = [];
  if (check.permission) {
    items.push({
      ok: check.active,
      label: check.active ? "permission active" : "permission inactive",
      detail: check.expiresAt
        ? `expires ${new Date(check.expiresAt * 1000).toLocaleDateString()}`
        : "no expiry set",
    });
    items.push({
      ok: check.callAllowed,
      label: check.callAllowed ? "target program allowed" : "target program NOT in agent.calls",
    });
    items.push({
      ok: check.capLamports !== null,
      label: check.capLamports !== null ? "spend cap exists for token" : "no cap for this token",
      detail: check.capDecimal !== null ? `cap = ${check.capDecimal}` : undefined,
    });
    items.push({
      ok: check.withinCap,
      label: check.withinCap
        ? "amount within cap"
        : check.capDecimal !== null
          ? `amount ${check.requestedDecimal} > cap ${check.capDecimal}`
          : "amount cannot be checked",
    });
  } else {
    items.push({ ok: false, label: "agent has no permission tuple on-chain" });
  }

  return (
    <div
      style={{
        padding: "1rem 1.25rem",
        background: ok ? "var(--accent-bg)" : "rgba(220,38,38,0.06)",
        borderRadius: "var(--radius-md)",
        border: `1px solid ${ok ? "#cfe39b" : "rgba(220,38,38,0.35)"}`,
        display: "grid",
        gap: "0.625rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600 }}>
        {ok ? (
          <>
            <CheckCircle2 size={16} style={{ color: "var(--accent-2)" }} /> Permission allows this swap
          </>
        ) : (
          <>
            <ShieldX size={16} style={{ color: "var(--danger)" }} /> Permission would reject this swap
          </>
        )}
      </div>
      <div style={{ display: "grid", gap: "0.25rem" }}>
        {items.map((it, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.8125rem",
              color: it.ok ? "var(--text)" : "var(--danger)",
            }}
          >
            {it.ok ? (
              <Check size={14} style={{ color: "var(--accent-2)", flexShrink: 0 }} />
            ) : (
              <X size={14} style={{ color: "var(--danger)", flexShrink: 0 }} />
            )}
            <span>{it.label}</span>
            {it.detail && (
              <span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>· {it.detail}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PermissionSummary({ permission }: { permission: AgentPermission | null }) {
  if (!permission) return null;
  const expiresIn = permission.expiresAt
    ? Math.max(0, Math.round((permission.expiresAt * 1000 - Date.now()) / 86_400_000))
    : null;
  return (
    <div
      style={{
        padding: "0.875rem 1rem",
        background: "var(--panel-2)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border)",
        display: "grid",
        gap: "0.375rem",
        fontSize: "0.8125rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>{permission.label || "(unnamed permission)"}</strong>
        {expiresIn !== null && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "var(--muted)", fontSize: "0.75rem" }}>
            <Clock size={11} /> {expiresIn}d left
          </span>
        )}
      </div>
      <div style={{ color: "var(--muted-2)", fontSize: "0.75rem" }}>
        {permission.calls?.length ?? 0} allowed call(s) · {permission.spends?.length ?? 0} spend cap(s)
      </div>
    </div>
  );
}
