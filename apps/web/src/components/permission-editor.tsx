"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import { devnet, getDomainKeySync } from "@bonfida/spl-name-service";
import {
  isActive,
  isExpired,
  isStarted,
  parsePermission,
  permitsCall,
  readRecordV2,
  serializePermission,
  spendCapFor,
  RECORD_AGENT_CAPABILITIES,
  RECORD_AGENT_SIGNING_PUBKEY,
  writeRecordV2Ix,
  type AgentPermission,
  type CallPermission,
  type SpendLimit,
} from "@snsip/agent-sdk";
import { TxStatus, type TxState } from "./tx-status";

// PermissionEditor — lets a .sol owner build and (optionally) write the
// `agent.capabilities` record under SNSIP-Agent's structured permission shape.
// Without wallet: build + preview + copy. With wallet (and ownership of the
// agent's parent .sol): can save on-chain.

export function PermissionEditor({ domain }: { domain: string }) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();

  const [agent, setAgent] = useState("");
  const [parent, setParent] = useState("");
  const [label, setLabel] = useState(domain.split(".")[0] ?? "agent");
  const [start, setStart] = useState<number | "">("");
  const [expiresAt, setExpiresAt] = useState<number | "">(
    Math.floor(Date.now() / 1000) + 7 * 86_400,
  );
  const [calls, setCalls] = useState<CallPermission[]>([
    { target: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4", selector: "" },
  ]);
  const [spends, setSpends] = useState<SpendLimit[]>([
    {
      mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC mainnet
      allowance: "100000000",
      periodSeconds: 86_400,
    },
  ]);
  const [tx, setTx] = useState<TxState>({ kind: "idle" });
  const [copied, setCopied] = useState(false);
  const [prefillState, setPrefillState] = useState<"loading" | "loaded" | "fresh">("loading");

  // Pre-fill the form with the live on-chain state for `domain` so the Editor
  // shows the actual current grant (not blank placeholders).
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const isDev = connection.rpcEndpoint.includes("devnet") || connection.rpcEndpoint.includes("magicblock");
      const parentPubkey = isDev
        ? devnet.utils.getDomainKeySync(domain).pubkey.toBase58()
        : getDomainKeySync(domain).pubkey.toBase58();

      const [signingPubkey, capabilitiesRaw] = await Promise.all([
        readRecordV2(connection, domain, RECORD_AGENT_SIGNING_PUBKEY).catch(() => null),
        readRecordV2(connection, domain, RECORD_AGENT_CAPABILITIES).catch(() => null),
      ]);
      if (cancelled) return;

      let parsed: AgentPermission | null = null;
      if (capabilitiesRaw) {
        try {
          const json = capabilitiesRaw.replace(/^data:application\/json,/, "");
          parsed = parsePermission(json);
        } catch {
          // ignore — fall through to signing-pubkey-only prefill
        }
      }

      if (parsed) {
        setAgent(parsed.agent);
        setParent(parsed.parent || parentPubkey);
        setLabel(parsed.label || domain.split(".")[0] || "agent");
        setStart(parsed.start ?? "");
        setExpiresAt(parsed.expiresAt ?? "");
        if (parsed.calls?.length) {
          setCalls(
            parsed.calls.map((c) => ({ target: c.target, selector: c.selector ?? "" })),
          );
        }
        if (parsed.spends?.length) {
          setSpends(
            parsed.spends.map((s) => ({
              mint: s.mint,
              allowance: s.allowance,
              periodSeconds: s.periodSeconds,
            })),
          );
        }
        setPrefillState("loaded");
      } else {
        // No on-chain capability yet — pre-fill what we can.
        if (signingPubkey) setAgent(signingPubkey);
        setParent(parentPubkey);
        setPrefillState("fresh");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [connection, domain]);

  // Scroll tx status into view on state change (esp. when "wallet not connected"
  // error appears below the fold).
  const txStatusRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (tx.kind === "idle") return;
    txStatusRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [tx]);

  const permission = useMemo<AgentPermission>(
    () => ({
      agent: agent || "AGENT_PUBKEY",
      parent: parent || "PARENT_SNS_ACCOUNT",
      label,
      start: start === "" ? undefined : Number(start),
      expiresAt: expiresAt === "" ? undefined : Number(expiresAt),
      calls: calls
        .map((c) => ({
          target: c.target.trim(),
          selector: c.selector?.trim() || undefined,
        }))
        .filter((c) => c.target),
      spends: spends
        .map((s) => ({
          mint: s.mint.trim(),
          allowance: s.allowance.trim() || "0",
          periodSeconds: s.periodSeconds || undefined,
        }))
        .filter((s) => s.mint),
    }),
    [agent, parent, label, start, expiresAt, calls, spends],
  );

  const json = useMemo(() => serializePermission(permission), [permission]);
  const parsedRoundTrip = useMemo(() => {
    try {
      parsePermission(json);
      return { ok: true as const };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  }, [json]);

  const nowSec = Math.floor(Date.now() / 1000);
  const status = {
    started: isStarted(permission, nowSec),
    expired: isExpired(permission, nowSec),
    active: isActive(permission, nowSec),
  };

  const sampleTarget = calls[0]?.target;
  const sampleCallOk = sampleTarget ? permitsCall(permission, sampleTarget, calls[0]?.selector || undefined, nowSec) : false;

  const cap = spends[0] ? spendCapFor(permission, spends[0].mint) : undefined;

  const copy = async () => {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const save = async () => {
    if (!publicKey || !sendTransaction) {
      setTx({ kind: "error", message: "Connect wallet to save on-chain. Until then use Copy JSON." });
      return;
    }
    setTx({ kind: "building" });
    try {
      const ix = await writeRecordV2Ix(connection, {
        domain,
        recordKey: RECORD_AGENT_CAPABILITIES,
        value: `data:application/json,${json}`,
        payer: publicKey,
        domainOwner: publicKey,
      });
      const transaction = new Transaction().add(ix);
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.feePayer = publicKey;
      transaction.recentBlockhash = blockhash;
      setTx({ kind: "signing" });
      const sig = await sendTransaction(transaction, connection);
      setTx({ kind: "sent", sig });
      await connection.confirmTransaction(sig, "confirmed");
      setTx({ kind: "confirmed", sig });
    } catch (e) {
      setTx({ kind: "error", message: (e as Error).message });
    }
  };

  return (
    <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
      {/* Editor column */}
      <div className="panel" style={{ display: "grid", gap: "0.75rem", padding: "1.25rem" }}>
        <h3 style={{ margin: 0, fontSize: "1rem" }}>Permission editor</h3>
        <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--muted)" }}>
          Builds the structured value written to <code>agent.capabilities</code>. Schema mirrors{" "}
          <a href="https://github.com/LeoFranklin015/ENSign" target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>
            ENSign
          </a>
          's <code>Permission</code>, adapted to Solana primitives.
        </p>

        <div
          style={{
            padding: "0.5rem 0.75rem",
            background:
              prefillState === "loaded"
                ? "var(--accent-bg)"
                : prefillState === "fresh"
                  ? "var(--panel-2)"
                  : "var(--panel-2)",
            border: `1px solid ${prefillState === "loaded" ? "#cfe39b" : "var(--border)"}`,
            borderRadius: "var(--radius-sm)",
            fontSize: "0.75rem",
            color: "var(--muted-2)",
          }}
        >
          {prefillState === "loading" && <>Loading on-chain values for <code>{domain}</code>…</>}
          {prefillState === "loaded" && (
            <>
              ✓ Form pre-filled from <code>{domain}</code>'s live <code>agent.capabilities</code>{" "}
              record. Edit any field and click <strong>Save</strong> to write a new version.
            </>
          )}
          {prefillState === "fresh" && (
            <>
              No <code>agent.capabilities</code> set on <code>{domain}</code> yet. Agent + parent
              pre-filled — fill the rest and click <strong>Save</strong> to publish the first
              permission grant.
            </>
          )}
        </div>

        <Field label="Agent signing pubkey (base58)">
          <input className="input" value={agent} onChange={(e) => setAgent(e.target.value.trim())} placeholder="agent's Ed25519 pubkey" />
        </Field>
        <Field label="Parent .sol account (base58)">
          <input className="input" value={parent} onChange={(e) => setParent(e.target.value.trim())} placeholder="SNS account pubkey of the parent .sol" />
        </Field>
        <Field label="Label">
          <input className="input" value={label} onChange={(e) => setLabel(e.target.value.trim().toLowerCase())} placeholder="trader" />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
          <Field label="Start (unix sec)">
            <input
              className="input"
              type="number"
              value={start}
              onChange={(e) => setStart(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="omit for now"
            />
          </Field>
          <Field label="Expires at (unix sec)">
            <input
              className="input"
              type="number"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="omit for never"
            />
          </Field>
        </div>

        <div style={{ marginTop: "0.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <strong style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>Calls</strong>
            <button className="btn-ghost" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
              onClick={() => setCalls((c) => [...c, { target: "", selector: "" }])}>
              + add
            </button>
          </div>
          {calls.map((c, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: "0.375rem", marginTop: "0.375rem" }}>
              <input className="input" value={c.target} placeholder="program ID"
                onChange={(e) => setCalls((cs) => cs.map((x, j) => (j === i ? { ...x, target: e.target.value } : x)))} />
              <input className="input" value={c.selector ?? ""} placeholder="selector hex (optional)"
                onChange={(e) => setCalls((cs) => cs.map((x, j) => (j === i ? { ...x, selector: e.target.value } : x)))} />
              <button className="btn-ghost" style={{ padding: "0 0.5rem" }}
                onClick={() => setCalls((cs) => cs.filter((_, j) => j !== i))}>
                ×
              </button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "0.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <strong style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>Spend limits</strong>
            <button className="btn-ghost" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
              onClick={() => setSpends((s) => [...s, { mint: "", allowance: "0", periodSeconds: 86_400 }])}>
              + add
            </button>
          </div>
          {spends.map((s, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: "0.375rem", marginTop: "0.375rem" }}>
              <input className="input" value={s.mint} placeholder="SPL mint"
                onChange={(e) => setSpends((ss) => ss.map((x, j) => (j === i ? { ...x, mint: e.target.value } : x)))} />
              <input className="input" value={s.allowance} placeholder="allowance (u64)"
                onChange={(e) => setSpends((ss) => ss.map((x, j) => (j === i ? { ...x, allowance: e.target.value } : x)))} />
              <input className="input" type="number" value={s.periodSeconds ?? ""} placeholder="period s"
                onChange={(e) => setSpends((ss) => ss.map((x, j) => (j === i ? { ...x, periodSeconds: Number(e.target.value) || undefined } : x)))} />
              <button className="btn-ghost" style={{ padding: "0 0.5rem" }}
                onClick={() => setSpends((ss) => ss.filter((_, j) => j !== i))}>
                ×
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
          <button className="btn-accent" onClick={save} disabled={!parsedRoundTrip.ok}>
            {connected ? "Save to records v2" : "Connect wallet to save"}
          </button>
          <button className="btn-ghost" onClick={copy} disabled={!parsedRoundTrip.ok}>
            {copied ? "✓ copied" : "Copy JSON"}
          </button>
        </div>
        <div ref={txStatusRef}>
          <TxStatus state={tx} />
        </div>
      </div>

      {/* Preview column */}
      <div style={{ display: "grid", gap: "0.75rem" }}>
        <div className="panel" style={{ padding: "1rem", display: "grid", gap: "0.5rem" }}>
          <strong style={{ fontSize: "0.875rem" }}>Live status</strong>
          <Pill ok={status.started}>{status.started ? "started" : "not yet started"}</Pill>
          <Pill ok={!status.expired}>{status.expired ? "expired" : "not expired"}</Pill>
          <Pill ok={status.active}>{status.active ? "ACTIVE" : "inactive"}</Pill>
          {sampleTarget && (
            <div style={{ fontSize: "0.8125rem", color: "var(--muted)", marginTop: "0.25rem" }}>
              call to <code>{shortBase58(sampleTarget)}</code>{" "}
              {calls[0]?.selector ? `selector ${calls[0].selector.slice(0, 10)}…` : "(any selector)"} →{" "}
              <strong style={{ color: sampleCallOk ? "var(--accent)" : "var(--danger)" }}>
                {sampleCallOk ? "permitted" : "rejected"}
              </strong>
            </div>
          )}
          {cap && (
            <div style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
              spend cap on <code>{shortBase58(cap.mint)}</code>: {cap.allowance}
              {cap.periodSeconds ? ` per ${cap.periodSeconds}s` : " (lifetime)"}
            </div>
          )}
        </div>

        <div className="panel" style={{ padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" }}>
            <strong style={{ fontSize: "0.875rem" }}>Serialized record value</strong>
            <span className="tag">data:application/json</span>
          </div>
          <pre style={{
            margin: 0,
            padding: "0.75rem",
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: "0.5rem",
            fontFamily: "monospace",
            fontSize: "0.75rem",
            overflow: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}>{prettyJson(permission)}</pre>
          {!parsedRoundTrip.ok && (
            <div style={{ marginTop: "0.5rem", color: "var(--danger)", fontSize: "0.8125rem" }}>
              ✗ {parsedRoundTrip.error}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: "0.25rem" }}>
      <span style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>{label}</span>
      {children}
    </label>
  );
}

function Pill({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.125rem 0.5rem",
        borderRadius: "999px",
        background: ok ? "rgba(0,255,163,0.1)" : "rgba(255,77,79,0.1)",
        color: ok ? "var(--accent)" : "var(--danger)",
        border: `1px solid ${ok ? "var(--accent)" : "var(--danger)"}`,
        fontSize: "0.75rem",
        width: "fit-content",
      }}
    >
      {children}
    </span>
  );
}

function shortBase58(s: string): string {
  return s.length > 16 ? `${s.slice(0, 6)}…${s.slice(-6)}` : s;
}

function prettyJson(p: AgentPermission): string {
  return JSON.stringify({ v: 1, ...p }, null, 2);
}
