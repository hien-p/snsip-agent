"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  bytesToHex,
  generateNonce,
  getStashedAgentKey,
  hexToBytes,
  localSignMessage,
  localVerifySignature,
  readRecordV2,
  RECORD_AGENT_SIGNING_PUBKEY,
  tamperByte,
} from "@snsip/agent-sdk";
import { useOwnedDomains } from "@/lib/use-sns";
import { isValidDomain, normalizeDomain, shortPubkey, explorerAddress } from "@/lib/format";

export function VerifyPlayground() {
  const { connection } = useConnection();
  const { connected } = useWallet();
  const { domains } = useOwnedDomains();

  const [domain, setDomain] = useState("");
  const [agentPubkey, setAgentPubkey] = useState("");
  const [message, setMessage] = useState("");
  const [signature, setSignature] = useState("");
  const [tampered, setTampered] = useState(false);
  const [tamperByteIdx, setTamperByteIdx] = useState(0);
  const [pubkeyFromRecord, setPubkeyFromRecord] = useState<string | null>(null);
  const [result, setResult] = useState<
    | { kind: "idle" }
    | { kind: "verified"; ok: boolean; reason?: string; effectiveMessage: string }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  // When domain changes, look up its on-chain agent.signing-pubkey record.
  useEffect(() => {
    let cancelled = false;
    if (!domain || !isValidDomain(domain)) {
      setPubkeyFromRecord(null);
      return;
    }
    void (async () => {
      const v = await readRecordV2(connection, normalizeDomain(domain), RECORD_AGENT_SIGNING_PUBKEY);
      if (!cancelled) setPubkeyFromRecord(v);
    })();
    return () => {
      cancelled = true;
    };
  }, [connection, domain]);

  const signChallenge = () => {
    setResult({ kind: "idle" });
    const norm = normalizeDomain(domain);
    const sk = getStashedAgentKey(norm);
    if (!sk) {
      setResult({
        kind: "error",
        message: `No stashed agent key for ${norm}. Create one via the wizard on the home page.`,
      });
      return;
    }
    const nonce = generateNonce(32);
    const { signatureBase58, pubkeyBase58 } = localSignMessage(sk, nonce);
    setMessage(bytesToHex(nonce));
    setAgentPubkey(pubkeyBase58);
    setSignature(signatureBase58);
  };

  const verify = () => {
    setResult({ kind: "idle" });
    try {
      if (!agentPubkey || !message || !signature) {
        setResult({ kind: "error", message: "All three fields required." });
        return;
      }

      const msgBytes = hexToBytes(message);
      const effective = tampered ? tamperByte(msgBytes, tamperByteIdx) : msgBytes;
      const ok = localVerifySignature(agentPubkey, effective, signature);

      let mismatchReason: string | undefined;
      if (pubkeyFromRecord && pubkeyFromRecord !== agentPubkey) {
        mismatchReason = "Submitted pubkey does NOT match this domain's agent.signing-pubkey record. The on-chain verifier would also reject this regardless of signature validity.";
      }

      setResult({
        kind: "verified",
        ok: ok && !mismatchReason,
        reason: mismatchReason ?? (ok ? undefined : "Ed25519 signature did not verify"),
        effectiveMessage: bytesToHex(effective),
      });
    } catch (e) {
      setResult({ kind: "error", message: (e as Error).message });
    }
  };

  return (
    <section className="panel" style={{ display: "grid", gap: "1.25rem" }}>
      <Field label="Agent domain" hint="e.g. myagent.alice.sol">
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            className="input"
            value={domain}
            onChange={(e) => setDomain(e.target.value.toLowerCase())}
            placeholder="myagent.alice.sol"
            spellCheck={false}
          />
          {connected && domains.length > 0 && (
            <select
              className="input"
              style={{ maxWidth: "240px" }}
              onChange={(e) => setDomain(e.target.value)}
              value=""
            >
              <option value="">— pick yours —</option>
              {domains.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}
        </div>
        {pubkeyFromRecord && (
          <div style={{ marginTop: "0.375rem", fontSize: "0.8125rem", color: "var(--muted)" }}>
            on-chain <code>agent.signing-pubkey</code>:{" "}
            <a
              href={explorerAddress(pubkeyFromRecord)}
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--accent)" }}
            >
              {shortPubkey(pubkeyFromRecord, 8, 8)}
            </a>
          </div>
        )}
      </Field>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button className="btn-accent" onClick={signChallenge} disabled={!isValidDomain(domain)}>
          Sign new challenge with stashed key
        </button>
        <button
          className="btn-ghost"
          onClick={() => {
            setMessage("");
            setSignature("");
            setAgentPubkey("");
            setResult({ kind: "idle" });
          }}
        >
          Clear
        </button>
      </div>

      <hr style={{ borderColor: "var(--border)", margin: "0.5rem 0" }} />

      <Field label="Agent signing pubkey (base58, 32 bytes)">
        <input
          className="input"
          value={agentPubkey}
          onChange={(e) => setAgentPubkey(e.target.value.trim())}
          spellCheck={false}
        />
      </Field>
      <Field label="Message (hex)">
        <input
          className="input"
          value={message}
          onChange={(e) => setMessage(e.target.value.trim())}
          spellCheck={false}
        />
      </Field>
      <Field label="Signature (base58, 64 bytes)">
        <input
          className="input"
          value={signature}
          onChange={(e) => setSignature(e.target.value.trim())}
          spellCheck={false}
        />
      </Field>

      <div
        className="panel"
        style={{
          background: tampered ? "rgba(255,77,79,0.08)" : "var(--panel-2)",
          borderColor: tampered ? "var(--danger)" : "var(--border)",
          padding: "0.75rem 1rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
          <input type="checkbox" checked={tampered} onChange={(e) => setTampered(e.target.checked)} />
          <strong>Tamper</strong> — flip byte
        </label>
        <input
          type="number"
          min={0}
          max={31}
          className="input"
          style={{ width: "5rem" }}
          value={tamperByteIdx}
          onChange={(e) => setTamperByteIdx(Number.parseInt(e.target.value, 10) || 0)}
        />
        <span style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
          When on, message byte at that index is XOR'd with 0x01 before verify.
        </span>
      </div>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button className="btn-accent" onClick={verify}>
          Verify (local Ed25519)
        </button>
        <button
          className="btn-ghost"
          onClick={() => alert("On-chain verify available after `anchor deploy` — D2 task.")}
        >
          Verify on-chain (after deploy)
        </button>
      </div>

      <ResultPanel result={result} />
    </section>
  );
}

function ResultPanel({
  result,
}: {
  result:
    | { kind: "idle" }
    | { kind: "verified"; ok: boolean; reason?: string; effectiveMessage: string }
    | { kind: "error"; message: string };
}) {
  if (result.kind === "idle") return null;

  if (result.kind === "error") {
    return (
      <div
        className="panel"
        style={{
          borderColor: "var(--danger)",
          background: "rgba(255,77,79,0.08)",
          padding: "1rem",
        }}
      >
        ✗ {result.message}
      </div>
    );
  }

  return (
    <div
      className="panel"
      style={{
        borderColor: result.ok ? "var(--accent)" : "var(--danger)",
        background: result.ok ? "rgba(0,255,163,0.06)" : "rgba(255,77,79,0.08)",
        padding: "1rem",
        display: "grid",
        gap: "0.5rem",
      }}
    >
      <div style={{ fontSize: "1.125rem", fontWeight: 600 }}>
        {result.ok ? "✓ Verified" : "✗ Rejected"}
      </div>
      {result.reason && (
        <div style={{ fontSize: "0.875rem" }}>{result.reason}</div>
      )}
      <div style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
        Effective message bytes (after tamper toggle):
        <div style={{ fontFamily: "monospace", marginTop: "0.25rem", wordBreak: "break-all" }}>
          {result.effectiveMessage}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "grid", gap: "0.25rem" }}>
      <span style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
        {label}
        {hint && <span style={{ marginLeft: "0.5rem", fontSize: "0.75rem" }}>· {hint}</span>}
      </span>
      {children}
    </label>
  );
}
