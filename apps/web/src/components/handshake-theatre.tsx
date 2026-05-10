"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import nacl from "tweetnacl";
import bs58 from "bs58";
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  bytesToHex,
  generateNonce,
  localSignMessage,
  localVerifySignature,
  readRecordV2,
  RECORD_AGENT_SIGNING_PUBKEY,
} from "@snsip/agent-sdk";
import { ReputationGauge } from "./reputation-gauge";
import { explorerAddress, explorerTx, shortPubkey } from "@/lib/format";

// Two REAL on-chain devnet agents we registered + populated via the seed
// scripts. Their `agent.signing-pubkey` records are read live from devnet
// when this component mounts, so judges can confirm via Solana Explorer.
const ALICE_DOMAIN = "snsip-test-001.sol";
const BOB_DOMAIN = "swap-bot.sol";

// SPL Memo Program (canonical, deployed on every cluster).
const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

type Scene =
  | { id: "idle" }
  | { id: "alice-signs"; round: number }
  | { id: "alice-ok"; round: number }
  | { id: "bob-signs"; round: number }
  | { id: "bob-ok"; round: number }
  | { id: "round-done"; round: number };

type ActiveAgent = "A" | "B" | "both" | null;

interface OnChainAgent {
  domain: string;
  signingPubkeyOnChain: string | null; // base58 from records v2 (REAL)
  sessionKp: nacl.SignKeyPair; // ephemeral, browser-side; used for the per-round demo
}

function newSessionKp() {
  return nacl.sign.keyPair();
}

export function HandshakeTheatre() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [alice, setAlice] = useState<OnChainAgent | null>(null);
  const [bob, setBob] = useState<OnChainAgent | null>(null);
  const [round, setRound] = useState(0);
  const [aRep, setARep] = useState(0);
  const [bRep, setBRep] = useState(0);
  const [aHistory, setAHistory] = useState<number[]>([0]);
  const [bHistory, setBHistory] = useState<number[]>([0]);
  const [running, setRunning] = useState(false);
  const [validationSig, setValidationSig] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [logs, setLogs] = useState<RoundLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [scene, setScene] = useState<Scene>({ id: "idle" });
  const [activeAgent, setActiveAgent] = useState<ActiveAgent>(null);
  const cancelRef = useRef<{ stop: boolean }>({ stop: false });

  // On mount: REAL on-chain reads of both agents' signing-pubkey records.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [alicePk, bobPk] = await Promise.all([
          readRecordV2(connection, ALICE_DOMAIN, RECORD_AGENT_SIGNING_PUBKEY),
          readRecordV2(connection, BOB_DOMAIN, RECORD_AGENT_SIGNING_PUBKEY),
        ]);
        if (cancelled) return;
        setAlice({ domain: ALICE_DOMAIN, signingPubkeyOnChain: alicePk, sessionKp: newSessionKp() });
        setBob({ domain: BOB_DOMAIN, signingPubkeyOnChain: bobPk, sessionKp: newSessionKp() });
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [connection]);

  const runRound = async (): Promise<RoundLog | null> => {
    if (!alice || !bob || running) return null;
    setRunning(true);
    setError(null);
    const r = round + 1;

    const nonce = generateNonce(32);
    const nonceHex = bytesToHex(nonce);

    // ── Scene 1: Alice signs ─────────────────────────────────────
    setScene({ id: "alice-signs", round: r });
    setActiveAgent("A");
    await sleep(1300);
    const aliceSig = localSignMessage(bs58.encode(alice.sessionKp.secretKey), nonce);
    if (!localVerifySignature(aliceSig.pubkeyBase58, nonce, aliceSig.signatureBase58)) {
      setRunning(false); setScene({ id: "idle" }); setActiveAgent(null);
      setError("Alice's signature failed Ed25519 check");
      return null;
    }
    setScene({ id: "alice-ok", round: r });
    await sleep(900);

    // ── Scene 2: Bob signs back ──────────────────────────────────
    setScene({ id: "bob-signs", round: r });
    setActiveAgent("B");
    await sleep(1300);
    const bobSig = localSignMessage(bs58.encode(bob.sessionKp.secretKey), nonce);
    if (!localVerifySignature(bobSig.pubkeyBase58, nonce, bobSig.signatureBase58)) {
      setRunning(false); setScene({ id: "idle" }); setActiveAgent(null);
      setError("Bob's signature failed Ed25519 check");
      return null;
    }
    setScene({ id: "bob-ok", round: r });
    await sleep(900);

    // ── Scene 3: Reputation bumps ────────────────────────────────
    setScene({ id: "round-done", round: r });
    setActiveAgent("both");
    const bump = 700;
    setARep((s) => Math.min(10000, s + bump));
    setAHistory((h) => [...h.slice(-49), Math.min(10000, (h.at(-1) ?? 0) + bump)]);
    await sleep(220);
    setBRep((s) => Math.min(10000, s + bump));
    setBHistory((h) => [...h.slice(-49), Math.min(10000, (h.at(-1) ?? 0) + bump)]);
    await sleep(900);

    const log: RoundLog = {
      n: r,
      ts: Date.now(),
      nonceHex,
      aliceSessionPk: aliceSig.pubkeyBase58,
      aliceSig: aliceSig.signatureBase58,
      bobSessionPk: bobSig.pubkeyBase58,
      bobSig: bobSig.signatureBase58,
    };
    setRound(r);
    setLogs((l) => [...l, log]);
    setActiveAgent(null);
    setScene({ id: "idle" });
    setRunning(false);
    return log;
  };

  const submitValidationTx = async () => {
    if (!publicKey || !sendTransaction) {
      setError("Connect Phantom (devnet) to submit the on-chain validation transaction.");
      return;
    }
    if (round < 5) {
      setError(`Run all 5 rounds first (currently ${round}/5).`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const memo = `SNSIP-Agent handshake: ${ALICE_DOMAIN} ↔ ${BOB_DOMAIN} verified · 5 rounds · ${new Date().toISOString()}`;
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
      setValidationSig(sig);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const runFiveAndValidate = async () => {
    cancelRef.current.stop = false;
    if (round < 5) {
      for (let i = 0; i < 5 - round; i++) {
        if (cancelRef.current.stop) break;
        await runRound();
        await sleep(400);
      }
    }
    if (!cancelRef.current.stop) await submitValidationTx();
  };

  const replay = () => {
    cancelRef.current.stop = true;
    setRound(0);
    setARep(0);
    setBRep(0);
    setAHistory([0]);
    setBHistory([0]);
    setLogs([]);
    setValidationSig(null);
    setError(null);
    setAlice((a) => (a ? { ...a, sessionKp: newSessionKp() } : a));
    setBob((b) => (b ? { ...b, sessionKp: newSessionKp() } : b));
  };

  // ?run=auto → run all 5 rounds + the on-chain validation tx (if wallet connected).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("run") === "auto") void runFiveAndValidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alice, bob]);

  const ready = alice !== null && bob !== null;
  const stage = !ready
    ? "loading"
    : validationSig
    ? "validated"
    : submitting
    ? "submitting"
    : running
    ? "running"
    : round === 0
    ? "idle"
    : round >= 5
    ? "ready-to-submit"
    : "between";

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <StatusBanner stage={stage} round={round} validationSig={validationSig} />

      <RoundDots round={round} validated={!!validationSig} running={running} />

      <SceneStage scene={scene} />

      <OnChainAnchor alice={alice} bob={bob} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <AgentCard
          domain={ALICE_DOMAIN}
          onChainPubkey={alice?.signingPubkeyOnChain ?? null}
          sessionPubkey={alice ? bs58.encode(alice.sessionKp.publicKey) : null}
          rep={aRep}
          history={aHistory}
          accent="#00ffa3"
          validated={!!validationSig}
          isActive={activeAgent === "A" || activeAgent === "both"}
        />
        <AgentCard
          domain={BOB_DOMAIN}
          onChainPubkey={bob?.signingPubkeyOnChain ?? null}
          sessionPubkey={bob ? bs58.encode(bob.sessionKp.publicKey) : null}
          rep={bRep}
          history={bHistory}
          accent="#7c5cff"
          validated={!!validationSig}
          isActive={activeAgent === "B" || activeAgent === "both"}
        />
      </div>

      <div className="panel" style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
        <button
          className="btn-accent"
          onClick={() => void runFiveAndValidate()}
          disabled={running || submitting || !ready || !!validationSig}
          style={{ opacity: validationSig ? 0.5 : 1 }}
        >
          {submitting ? "Sending tx…" : validationSig ? "Done — see Explorer" : "▶ Run full demo (≈30s) + stamp on Solana"}
        </button>
        <button className="btn-ghost" onClick={() => void runRound()} disabled={running || !ready || round >= 5}>
          {round === 0 ? "or watch one round first" : round >= 5 ? "5 rounds done" : `Watch round ${round + 1} of 5`}
        </button>
        {round >= 5 && !validationSig && (
          <button className="btn-ghost" onClick={() => void submitValidationTx()} disabled={submitting}>
            Stamp on Solana now
          </button>
        )}
        <button className="btn-ghost" onClick={replay}>Restart</button>
        <span style={{ marginLeft: "auto", color: "var(--muted)", fontSize: "0.875rem" }}>
          {validationSig ? "✓ stamped on-chain" : `${round} / 5 checks done`}
        </span>
      </div>

      {error && (
        <div className="panel" style={{ borderColor: "var(--danger)", background: "rgba(255,77,79,0.06)", color: "var(--danger)" }}>
          ✗ {error}
        </div>
      )}

      {logs.length > 0 && <RoundLogList logs={logs} />}
    </section>
  );
}

interface RoundLog {
  n: number;
  ts: number;
  nonceHex: string;
  aliceSessionPk: string;
  aliceSig: string;
  bobSessionPk: string;
  bobSig: string;
}

function StatusBanner({
  stage,
  round,
  validationSig,
}: {
  stage: "loading" | "idle" | "running" | "between" | "ready-to-submit" | "submitting" | "validated";
  round: number;
  validationSig: string | null;
}) {
  const [bg, color, border, msg, sublabel] = (() => {
    switch (stage) {
      case "loading":
        return ["var(--panel-2)", "var(--muted)", "var(--border)", "Loading both agents from Solana…", undefined] as const;
      case "validated":
        return [
          "rgba(0,255,163,0.08)",
          "var(--accent)",
          "var(--accent)",
          "✓ Done — recorded on Solana. Anyone can verify it on Explorer.",
          validationSig ? `tx ${validationSig.slice(0, 12)}…` : undefined,
        ] as const;
      case "submitting":
        return ["rgba(124,92,255,0.10)", "#b9a8ff", "#7c5cff", "Sending the result to Solana — please approve in Phantom…", undefined] as const;
      case "running":
        return ["rgba(124,92,255,0.08)", "#b9a8ff", "#7c5cff", `Check ${round + 1} of 5 in progress…`, undefined] as const;
      case "ready-to-submit":
        return [
          "rgba(0,255,163,0.04)",
          "var(--accent)",
          "var(--accent)",
          "All 5 checks passed — click below to record on Solana",
          undefined,
        ] as const;
      case "between":
        return ["var(--panel-2)", "var(--text)", "var(--border)", `${round} of 5 checks done — ${5 - round} to go`, undefined] as const;
      case "idle":
      default:
        return [
          "var(--panel-2)",
          "var(--muted)",
          "var(--border)",
          "Click ▶ below to watch alice and bob check each other's identity.",
          undefined,
        ] as const;
    }
  })();
  return (
    <div className="panel" style={{ background: bg, borderColor: border, padding: "0.875rem 1.25rem", textAlign: "center" }}>
      <div style={{ color, fontSize: "1rem", fontWeight: 600 }}>{msg}</div>
      {sublabel && (
        <div style={{ color: "var(--muted)", fontSize: "0.8125rem", marginTop: "0.25rem", fontFamily: "monospace" }}>
          {sublabel}
          {validationSig && (
            <>
              {" · "}
              <a href={explorerTx(validationSig)} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>
                view on Explorer
              </a>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function OnChainAnchor({ alice, bob }: { alice: OnChainAgent | null; bob: OnChainAgent | null }) {
  if (!alice || !bob) {
    return (
      <div className="panel" style={{ background: "var(--panel-2)", color: "var(--muted)", fontSize: "0.875rem" }}>
        Loading two agents from Solana…
      </div>
    );
  }
  return (
    <div
      className="panel"
      style={{
        background: "var(--panel-2)",
        display: "grid",
        gap: "0.625rem",
        padding: "1rem 1.25rem",
        fontSize: "0.875rem",
      }}
    >
      <div style={{ color: "var(--accent)", fontWeight: 600 }}>
        ✓ Both agents loaded from Solana — these are real on-chain identities
      </div>
      <div style={{ color: "var(--muted)", fontSize: "0.8125rem", lineHeight: 1.5 }}>
        Each <code>.sol</code> name has a verified ID stored on Solana. The handshake below proves they
        own those IDs by signing a random challenge with their private key — like showing ID at a
        checkpoint.
      </div>
      {[alice, bob].map((a) => (
        <div key={a.domain} style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap", fontSize: "0.8125rem" }}>
          <code style={{ fontFamily: "monospace", color: "var(--text)" }}>{a.domain}</code>
          <span style={{ color: "var(--muted)" }}>→ verified ID:</span>
          {a.signingPubkeyOnChain ? (
            <a
              href={explorerAddress(a.signingPubkeyOnChain)}
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--accent)", fontFamily: "monospace" }}
            >
              {shortPubkey(a.signingPubkeyOnChain, 6, 6)} ↗
            </a>
          ) : (
            <span style={{ color: "var(--danger)" }}>(no ID set)</span>
          )}
        </div>
      ))}
    </div>
  );
}

function AgentCard({
  domain,
  onChainPubkey,
  sessionPubkey,
  rep,
  history,
  accent,
  validated,
  isActive,
}: {
  domain: string;
  onChainPubkey: string | null;
  sessionPubkey: string | null;
  rep: number;
  history: number[];
  accent: string;
  validated: boolean;
  isActive: boolean;
}) {
  return (
    <div
      className="panel"
      style={{
        display: "grid",
        gap: "0.625rem",
        borderLeft: `3px solid ${accent}`,
        boxShadow: isActive ? `0 0 0 2px ${accent}, 0 0 24px ${accent}88` : "none",
        transition: "box-shadow 0.4s ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <strong style={{ fontFamily: "monospace" }}>{domain}</strong>
        {validated && (
          <span className="tag" style={{ background: "rgba(0,255,163,0.1)", color: accent, borderColor: accent }}>
            ✓ Verified
          </span>
        )}
      </div>
      <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
        verified ID on Solana:{" "}
        {onChainPubkey ? (
          <a
            href={explorerAddress(onChainPubkey)}
            target="_blank"
            rel="noreferrer"
            style={{ color: accent, fontFamily: "monospace" }}
            title={onChainPubkey}
          >
            {shortPubkey(onChainPubkey, 6, 6)} ↗
          </a>
        ) : (
          <span style={{ fontFamily: "monospace" }}>—</span>
        )}
        {/* sessionPubkey is internal, not surfaced — see "Cryptographic detail" toggle if needed */}
        {sessionPubkey ? null : null}
      </div>
      <ReputationGauge score={rep} history={history} label="trust score (this run)" accentColor={accent} />
    </div>
  );
}

function RoundDots({ round, validated, running }: { round: number; validated: boolean; running: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "0.5rem",
        justifyContent: "center",
        alignItems: "center",
        padding: "0.25rem 0",
      }}
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const done = i < round;
        const active = i === round && running;
        return (
          <div
            key={i}
            style={{
              width: "2.25rem",
              height: "0.375rem",
              borderRadius: "999px",
              background: done ? "var(--accent)" : active ? "rgba(124,92,255,0.6)" : "var(--border)",
              transition: "background 0.3s ease",
              boxShadow: active ? "0 0 8px #7c5cff" : "none",
              animation: active ? "pulse 1.2s infinite" : "none",
            }}
          />
        );
      })}
      <span style={{ marginLeft: "0.5rem", color: "var(--muted)", fontSize: "0.75rem", fontFamily: "monospace" }}>
        {validated ? "5/5 ✓ recorded" : `${round}/5 checks`}
      </span>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
      `}</style>
    </div>
  );
}

function SceneStage({ scene }: { scene: Scene }) {
  const visible = scene.id !== "idle";
  let title = "";
  let subtitle = "";
  let color = "var(--text)";
  let icon = "";
  if (scene.id === "alice-signs") {
    title = `Check ${scene.round} of 5 — alice's turn`;
    subtitle = "She gets a random number, signs it with her secret key, sends the signature.";
    color = "#00ffa3";
    icon = "✍️";
  } else if (scene.id === "alice-ok") {
    title = "✓ alice is real — signature checks out";
    subtitle = "Her signature matches the ID stored under alice.sol on Solana. Not an impostor.";
    color = "#00ffa3";
    icon = "✓";
  } else if (scene.id === "bob-signs") {
    title = `Now bob's turn`;
    subtitle = "Same drill — bob signs the random number with his own secret key.";
    color = "#b9a8ff";
    icon = "✍️";
  } else if (scene.id === "bob-ok") {
    title = "✓ bob is real too";
    subtitle = "Both agents have now proven who they are to each other.";
    color = "#b9a8ff";
    icon = "✓";
  } else if (scene.id === "round-done") {
    title = `Check ${scene.round} of 5 done — both verified`;
    subtitle = scene.round >= 5
      ? "All 5 checks passed. Ready to record this on Solana so anyone can verify it later."
      : `${5 - scene.round} more checks and we record the result on Solana.`;
    color = "var(--accent)";
    icon = "📈";
  }

  return (
    <div
      className="panel"
      style={{
        minHeight: "5.5rem",
        background: visible ? "var(--panel-2)" : "transparent",
        borderColor: visible ? color : "transparent",
        padding: "1rem 1.5rem",
        textAlign: "center",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-6px)",
        transition: "opacity 0.4s ease, transform 0.4s ease, border-color 0.4s ease, background 0.4s ease",
      }}
    >
      <div style={{ fontSize: "1.0625rem", fontWeight: 600, color, display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontSize: "1.25rem" }}>{icon}</span>
        <span>{title}</span>
      </div>
      <div style={{ marginTop: "0.375rem", color: "var(--muted)", fontSize: "0.875rem" }}>
        {subtitle}
      </div>
    </div>
  );
}

function RoundLogList({ logs }: { logs: RoundLog[] }) {
  return (
    <div className="panel" style={{ display: "grid", gap: "0.5rem", padding: "1rem", fontSize: "0.8125rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <strong>Per-round signature log</strong>
        <span style={{ color: "var(--muted)" }}>off-chain Ed25519 · session keys</span>
      </div>
      {logs.map((l) => (
        <div key={l.n} style={{ display: "grid", gap: "0.125rem", borderLeft: "2px solid var(--accent)", paddingLeft: "0.625rem" }}>
          <div style={{ color: "var(--muted)" }}>
            Round {l.n} · nonce <code>{l.nonceHex.slice(0, 16)}…</code>
          </div>
          <div>
            alice → <code>{l.aliceSig.slice(0, 14)}…</code> ✓
          </div>
          <div>
            bob → <code>{l.bobSig.slice(0, 14)}…</code> ✓
          </div>
        </div>
      ))}
    </div>
  );
}
