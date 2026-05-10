"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, LogIn, ShieldX, User, Globe } from "lucide-react";
import {
  ALL_AGENT_RECORD_KEYS,
  parsePermission,
  readRecordV2,
  resolveDomainOwner,
  type AgentPermission,
} from "@snsip/agent-sdk";
import bs58 from "bs58";
import { isValidDomain, normalizeDomain, shortPubkey, explorerAddress } from "@/lib/format";

type Stage =
  | { kind: "input" }
  | { kind: "resolving" }
  | { kind: "wrong-owner"; expected: string }
  | { kind: "challenge"; expected: string }
  | { kind: "signed-in"; profile: Profile; signatureSig: string };

interface Profile {
  domain: string;
  owner: string;
  avatar: string | null;
  description: string | null;
  endpoint: string | null;
  signingPubkey: string | null;
}

export function LoginWithSol() {
  const { connection } = useConnection();
  const { publicKey, signMessage, connected } = useWallet();
  const [domain, setDomain] = useState("");
  const [stage, setStage] = useState<Stage>({ kind: "input" });

  const reset = () => setStage({ kind: "input" });

  // Auto-go to challenge stage after we resolve and the owner matches the wallet
  useEffect(() => {
    if (stage.kind !== "challenge") return;
    if (!publicKey || stage.expected !== publicKey.toBase58()) return;
    // Wallet matches — keep at challenge until user clicks Sign
  }, [publicKey, stage]);

  const startSignIn = async () => {
    if (!isValidDomain(domain)) return;
    if (!publicKey) {
      setStage({
        kind: "wrong-owner",
        expected: "(connect a wallet first)",
      });
      return;
    }
    setStage({ kind: "resolving" });
    const norm = normalizeDomain(domain);
    let owner: string | null = null;
    try {
      owner = (await resolveDomainOwner(connection, norm)).toBase58();
    } catch {
      // domain not found
    }
    if (!owner) {
      setStage({ kind: "wrong-owner", expected: "(no on-chain record for this domain)" });
      return;
    }
    if (owner !== publicKey.toBase58()) {
      setStage({ kind: "wrong-owner", expected: owner });
      return;
    }
    setStage({ kind: "challenge", expected: owner });
  };

  const completeSignIn = async () => {
    if (stage.kind !== "challenge" || !signMessage || !publicKey) return;
    const norm = normalizeDomain(domain);
    const challenge = `Sign in with .sol\n\nDomain: ${norm}\nWallet: ${publicKey.toBase58()}\nIssued: ${new Date().toISOString()}\nNonce: ${Math.random().toString(36).slice(2)}`;
    let sig: Uint8Array;
    try {
      sig = await signMessage(new TextEncoder().encode(challenge));
    } catch (e) {
      setStage({ kind: "wrong-owner", expected: `Wallet signing rejected: ${(e as Error).message}` });
      return;
    }

    // Pull the user's on-chain profile from records v2
    const [avatar, capRaw, endpoint, signingPubkey] = await Promise.all([
      readRecordV2(connection, norm, "avatar"),
      readRecordV2(connection, norm, "agent.capabilities"),
      readRecordV2(connection, norm, "agent.endpoint"),
      readRecordV2(connection, norm, "agent.signing-pubkey"),
    ]);
    let description: string | null = null;
    if (capRaw) {
      try {
        const json = capRaw.replace(/^data:application\/json,/, "");
        const perm = parsePermission(json) as AgentPermission & { description?: string };
        description = perm.description ?? null;
      } catch {
        // ignore
      }
    }

    setStage({
      kind: "signed-in",
      profile: {
        domain: norm,
        owner: publicKey.toBase58(),
        avatar,
        description,
        endpoint,
        signingPubkey,
      },
      signatureSig: bs58.encode(sig),
    });
  };

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <div className="panel" style={{ display: "grid", gap: "0.875rem", padding: "1.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <LogIn size={18} style={{ color: "var(--text)" }} />
          <strong style={{ fontSize: "1rem" }}>Sign in with your .sol</strong>
        </div>
        <p style={{ margin: 0, color: "var(--muted-2)", fontSize: "0.9375rem", lineHeight: 1.55 }}>
          Type your <code>.sol</code> name. The dApp checks on-chain that your wallet owns it, then asks
          your wallet to sign a one-time challenge proving live possession. No password, no email — your
          name <em>is</em> your login.
        </p>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <input
            className="input"
            placeholder="snsip-test-001.sol"
            value={domain}
            onChange={(e) => setDomain(e.target.value.toLowerCase())}
            spellCheck={false}
            style={{ flex: 1, minWidth: "240px" }}
          />
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="btn-accent"
            onClick={startSignIn}
            disabled={!isValidDomain(domain) || stage.kind === "resolving" || stage.kind === "challenge"}
          >
            {stage.kind === "resolving" ? "Checking devnet…" : "Sign in"}
          </motion.button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Try one of our seeded agents:</span>
          {[
            "snsip-test-001.sol",
            "swap-bot.sol",
            "monitor.sol",
            "auditor.sol",
            "arb-trader.sol",
          ].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDomain(d)}
              className="tag"
              style={{ cursor: "pointer", fontFamily: "monospace", fontSize: "0.6875rem" }}
            >
              {d}
            </button>
          ))}
        </div>

        <div style={{ fontSize: "0.75rem", color: "var(--muted)", lineHeight: 1.55 }}>
          {!connected
            ? "Connect Phantom (devnet) above first. "
            : ""}
          Only the wallet that registered each <code>.sol</code> can sign in as it — typing a name your
          wallet does not own is the sybil-rejection path, and a feature, not a bug.
        </div>
      </div>

      <AnimatePresence mode="wait">
        {stage.kind === "wrong-owner" && (
          <motion.div
            key="wrong"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="panel"
            style={{ background: "rgba(220,38,38,0.06)", borderColor: "rgba(220,38,38,0.4)", padding: "1.25rem 1.5rem", display: "grid", gap: "0.5rem" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--danger)", fontWeight: 600 }}>
              <ShieldX size={18} /> Sign-in rejected
            </div>
            <div style={{ fontSize: "0.875rem", color: "var(--muted-2)" }}>
              Your wallet does not own <code>{normalizeDomain(domain)}</code>.
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
              On-chain owner says: <code>{stage.expected}</code>
            </div>
            <button onClick={reset} className="btn-ghost" style={{ alignSelf: "start", padding: "0.5rem 0.875rem", fontSize: "0.8125rem" }}>
              Try another domain
            </button>
          </motion.div>
        )}

        {stage.kind === "challenge" && (
          <motion.div
            key="challenge"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="panel"
            style={{ padding: "1.25rem 1.5rem", display: "grid", gap: "0.75rem" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-2)", fontWeight: 600 }}>
              <CheckCircle2 size={18} /> Ownership confirmed
            </div>
            <div style={{ fontSize: "0.875rem", color: "var(--muted-2)" }}>
              Wallet <code>{shortPubkey(stage.expected, 6, 6)}</code> is the on-chain owner of{" "}
              <code>{normalizeDomain(domain)}</code>. Sign the challenge to complete sign-in.
            </div>
            <button onClick={completeSignIn} className="btn-accent" style={{ alignSelf: "start" }}>
              Sign challenge
            </button>
          </motion.div>
        )}

        {stage.kind === "signed-in" && (
          <motion.div
            key="signed-in"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="panel"
            style={{
              background: "var(--accent-bg)",
              borderColor: "#d8e8a8",
              padding: "1.5rem 1.75rem",
              display: "grid",
              gap: "1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CheckCircle2 size={20} style={{ color: "var(--text)" }} />
              <strong style={{ fontSize: "1.125rem" }}>Welcome back, {stage.profile.domain}</strong>
            </div>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
              {stage.profile.avatar && (
                <img
                  src={stage.profile.avatar}
                  alt=""
                  width={56}
                  height={56}
                  style={{ borderRadius: "999px", background: "var(--panel)", border: "1px solid var(--border)" }}
                />
              )}
              <div style={{ display: "grid", gap: "0.125rem" }}>
                {stage.profile.description ? (
                  <div style={{ fontSize: "0.9375rem" }}>{stage.profile.description}</div>
                ) : (
                  <div style={{ fontSize: "0.9375rem", color: "var(--muted-2)" }}>
                    (no description set on records v2)
                  </div>
                )}
                <div style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
                  Wallet:{" "}
                  <a
                    href={explorerAddress(stage.profile.owner)}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "var(--text)", fontWeight: 500 }}
                  >
                    {shortPubkey(stage.profile.owner, 6, 6)} ↗
                  </a>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gap: "0.375rem", fontSize: "0.875rem" }}>
              {stage.profile.endpoint && (
                <div>
                  <Globe size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "0.375rem" }} />
                  <a href={stage.profile.endpoint} target="_blank" rel="noreferrer" style={{ color: "var(--text)" }}>
                    {stage.profile.endpoint.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
              {stage.profile.signingPubkey && (
                <div style={{ color: "var(--muted)", fontFamily: "monospace", fontSize: "0.75rem" }}>
                  agent.signing-pubkey · {shortPubkey(stage.profile.signingPubkey, 8, 8)}
                </div>
              )}
            </div>

            <details style={{ fontSize: "0.8125rem", color: "var(--muted-2)" }}>
              <summary style={{ cursor: "pointer", color: "var(--text)", fontWeight: 500 }}>
                Show signature receipt
              </summary>
              <div style={{ marginTop: "0.5rem", padding: "0.625rem", background: "var(--panel)", borderRadius: "var(--radius-md)", fontFamily: "monospace", fontSize: "0.75rem", wordBreak: "break-all" }}>
                {stage.signatureSig}
              </div>
            </details>

            <button onClick={reset} className="btn-ghost" style={{ alignSelf: "start", padding: "0.5rem 0.875rem", fontSize: "0.8125rem" }}>
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="panel" style={{ background: "var(--panel-2)", padding: "1.25rem 1.5rem", display: "grid", gap: "0.625rem" }}>
        <strong style={{ fontSize: "0.875rem" }}>Drop into any dApp in 8 lines</strong>
        <pre
          style={{
            margin: 0,
            padding: "0.875rem 1rem",
            background: "var(--panel)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
            fontFamily: "monospace",
            fontSize: "0.75rem",
            overflow: "auto",
            color: "var(--text)",
          }}
        >{`import { resolveDomainOwner, readRecordV2 } from "@snsip/agent-sdk";

// 1. Verify ownership against on-chain SNS state
const owner = await resolveDomainOwner(connection, "alice.sol");
if (owner.toBase58() !== wallet.publicKey.toBase58()) reject();

// 2. Wallet signs a fresh challenge — proof of live possession
const sig = await wallet.signMessage(\`SNSIP login \${nonce}\`);

// 3. Pull the user's on-chain profile (avatar, bio, links) from records v2
const avatar = await readRecordV2(connection, "alice.sol", "avatar");`}</pre>
      </div>
    </section>
  );
}
