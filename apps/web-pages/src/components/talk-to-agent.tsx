"use client";

import { useState } from "react";
import {
  bytesToHex,
  generateNonce,
  getStashedAgentKey,
  localSignMessage,
  localVerifySignature,
} from "@snsip/agent-sdk";
import { shortPubkey } from "@/lib/format";

// TalkToAgent — issues a challenge to an agent's endpoint and verifies
// the response. Demonstrates the full client-side flow in 30 seconds.
//
// Flow:
//   1. Build a fresh nonce.
//   2. POST { nonce } to <agent.endpoint>/challenge.
//   3. Agent replies { signature, pubkey } where pubkey MUST match the
//      one in the .sol's agent.signing-pubkey record.
//   4. Locally verify Ed25519. If ok, agent's identity is proven for
//      this session.
//
// For demos where you don't control a real agent endpoint, "Use stashed
// key" shortcuts the round trip — the browser plays both client and
// agent, which still demonstrates the cryptography end to end.

export function TalkToAgent({
  domain,
  endpoint,
  expectedPubkey,
}: {
  domain: string;
  endpoint: string | undefined;
  expectedPubkey: string | undefined;
}) {
  const [nonce, setNonce] = useState<Uint8Array | null>(null);
  const [reply, setReply] = useState<{ signature: string; pubkey: string } | null>(null);
  const [result, setResult] = useState<
    | { kind: "idle" }
    | { kind: "ok"; reason: string }
    | { kind: "fail"; reason: string }
  >({ kind: "idle" });

  const start = async () => {
    setResult({ kind: "idle" });
    setReply(null);
    const n = generateNonce(32);
    setNonce(n);

    if (!endpoint) {
      setResult({
        kind: "fail",
        reason: "No agent.endpoint record set on this domain. Use 'Use stashed key' to demo locally.",
      });
      return;
    }

    try {
      const res = await fetch(`${endpoint.replace(/\/$/, "")}/challenge`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nonce: bytesToHex(n) }),
      });
      if (!res.ok) {
        setResult({ kind: "fail", reason: `Endpoint returned HTTP ${res.status}` });
        return;
      }
      const json = (await res.json()) as { signature: string; pubkey: string };
      setReply(json);

      if (expectedPubkey && json.pubkey !== expectedPubkey) {
        setResult({
          kind: "fail",
          reason: "Agent's reply pubkey does not match agent.signing-pubkey record",
        });
        return;
      }

      const ok = localVerifySignature(json.pubkey, n, json.signature);
      setResult(
        ok
          ? { kind: "ok", reason: "Agent owned the .sol and signed our challenge." }
          : { kind: "fail", reason: "Ed25519 signature did not verify" },
      );
    } catch (e) {
      setResult({ kind: "fail", reason: (e as Error).message });
    }
  };

  const useStashed = () => {
    setResult({ kind: "idle" });
    const sk = getStashedAgentKey(domain);
    if (!sk) {
      setResult({
        kind: "fail",
        reason: `No stashed agent key for ${domain}. Create one via the wizard on /.`,
      });
      return;
    }
    const n = generateNonce(32);
    setNonce(n);
    const { signatureBase58, pubkeyBase58 } = localSignMessage(sk, n);
    setReply({ signature: signatureBase58, pubkey: pubkeyBase58 });
    const ok = localVerifySignature(pubkeyBase58, n, signatureBase58);
    setResult(
      ok
        ? { kind: "ok", reason: "Local round-trip via stashed agent key. ✓" }
        : { kind: "fail", reason: "Ed25519 verify failed (should not happen)" },
    );
  };

  return (
    <div className="panel" style={{ display: "grid", gap: "0.75rem" }}>
      <h3 style={{ margin: 0, fontSize: "1rem" }}>Talk to this agent</h3>
      <p style={{ fontSize: "0.875rem", color: "var(--muted)", margin: 0 }}>
        Issue a fresh nonce challenge. The agent should sign it with the
        Ed25519 key declared in <code>agent.signing-pubkey</code>. We verify locally.
      </p>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button className="btn-accent" onClick={start} disabled={!endpoint}>
          Send challenge to {endpoint ? shortPubkey(endpoint, 12, 12) : "endpoint"}
        </button>
        <button className="btn-ghost" onClick={useStashed}>
          Use stashed key (local round-trip)
        </button>
      </div>

      {nonce && (
        <div style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
          challenge: <code>{bytesToHex(nonce).slice(0, 32)}…</code>
        </div>
      )}
      {reply && (
        <div style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
          reply: pubkey <code>{shortPubkey(reply.pubkey, 6, 6)}</code> · sig{" "}
          <code>{shortPubkey(reply.signature, 6, 6)}</code>
        </div>
      )}
      {result.kind !== "idle" && (
        <div
          className="panel"
          style={{
            padding: "0.75rem 1rem",
            borderColor: result.kind === "ok" ? "var(--accent)" : "var(--danger)",
            background:
              result.kind === "ok" ? "rgba(0,255,163,0.06)" : "rgba(255,77,79,0.08)",
          }}
        >
          {result.kind === "ok" ? "✓" : "✗"} {result.reason}
        </div>
      )}
    </div>
  );
}
