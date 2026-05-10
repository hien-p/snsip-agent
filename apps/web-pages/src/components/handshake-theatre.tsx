"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import nacl from "tweetnacl";
import bs58 from "bs58";
import {
  bytesToHex,
  generateNonce,
  localSignMessage,
  localVerifySignature,
} from "@snsip/agent-sdk";
import { ReputationGauge } from "./reputation-gauge";
import { shortPubkey } from "@/lib/format";

type Status = "idle" | "running" | "done" | "failed";
type StepId =
  | "resolve-b"
  | "sign-challenge-a"
  | "verify-challenge-b"
  | "sign-reply-b"
  | "verify-reply-a"
  | "rep-tick"
  | "validation";

interface Step {
  id: StepId;
  who: "A" | "B" | "V";
  label: string;
  status: Status;
  detail?: string;
}

interface DemoAgent {
  domain: string;
  pubkey: string;
  sk: string; // base58 64-byte secret
}

function generateAgent(domain: string): DemoAgent {
  const kp = nacl.sign.keyPair();
  return {
    domain,
    pubkey: bs58.encode(kp.publicKey),
    sk: bs58.encode(kp.secretKey),
  };
}

const TEMPLATE: Omit<Step, "status">[] = [
  { id: "resolve-b", who: "A", label: "A resolves B.sol → fetches B's signing pubkey from records v2" },
  { id: "sign-challenge-a", who: "A", label: "A signs a 32-byte nonce with A's signing key" },
  { id: "verify-challenge-b", who: "B", label: "B verifies A's signature against A's agent.signing-pubkey" },
  { id: "sign-reply-b", who: "B", label: "B signs the response payload" },
  { id: "verify-reply-a", who: "A", label: "A verifies B's reply" },
  { id: "rep-tick", who: "V", label: "Both reputation counters tick up (delegated to ER → sub-50ms)" },
  { id: "validation", who: "V", label: "After N rounds, the validator submits a ValidationRecord on-chain" },
];

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function HandshakeTheatre() {
  const agentA = useMemo(() => generateAgent("alice.sol"), []);
  const agentB = useMemo(() => generateAgent("bob.sol"), []);
  const [round, setRound] = useState(0);
  const [aRep, setARep] = useState(0);
  const [bRep, setBRep] = useState(0);
  const [aHistory, setAHistory] = useState<number[]>([0]);
  const [bHistory, setBHistory] = useState<number[]>([0]);
  const [steps, setSteps] = useState<Step[]>(TEMPLATE.map((s) => ({ ...s, status: "idle" })));
  const [running, setRunning] = useState(false);
  const [validated, setValidated] = useState(false);
  const cancelRef = useRef<{ stop: boolean }>({ stop: false });

  // Re-seed steps to all idle
  const resetSteps = () => setSteps(TEMPLATE.map((s) => ({ ...s, status: "idle" })));

  const setStep = (id: StepId, patch: Partial<Step>) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const runOnce = async () => {
    if (running) return;
    setRunning(true);
    cancelRef.current.stop = false;
    resetSteps();

    try {
      // 1. A resolves B
      setStep("resolve-b", { status: "running" });
      await sleep(180);
      setStep("resolve-b", { status: "done", detail: `B.signing-pubkey = ${shortPubkey(agentB.pubkey, 6, 6)}` });
      if (cancelRef.current.stop) return;

      // 2. A signs challenge
      const challenge = generateNonce(32);
      const challengeHex = bytesToHex(challenge);
      setStep("sign-challenge-a", { status: "running" });
      await sleep(120);
      const sigA = localSignMessage(agentA.sk, challenge);
      setStep("sign-challenge-a", {
        status: "done",
        detail: `nonce = ${challengeHex.slice(0, 16)}…  sig = ${shortPubkey(sigA.signatureBase58, 6, 6)}`,
      });
      if (cancelRef.current.stop) return;

      // 3. B verifies challenge — verify with agentA.pubkey
      setStep("verify-challenge-b", { status: "running" });
      await sleep(140);
      const okA = localVerifySignature(agentA.pubkey, challenge, sigA.signatureBase58);
      if (!okA) {
        setStep("verify-challenge-b", { status: "failed", detail: "Ed25519 verify failed" });
        throw new Error("A's signature did not verify");
      }
      setStep("verify-challenge-b", { status: "done", detail: "✓ A is who they claim" });
      if (cancelRef.current.stop) return;

      // 4. B signs reply
      const reply = new Uint8Array([...challenge, 0xff]); // some payload
      setStep("sign-reply-b", { status: "running" });
      await sleep(120);
      const sigB = localSignMessage(agentB.sk, reply);
      setStep("sign-reply-b", { status: "done", detail: `sig = ${shortPubkey(sigB.signatureBase58, 6, 6)}` });
      if (cancelRef.current.stop) return;

      // 5. A verifies B's reply
      setStep("verify-reply-a", { status: "running" });
      await sleep(140);
      const okB = localVerifySignature(agentB.pubkey, reply, sigB.signatureBase58);
      if (!okB) {
        setStep("verify-reply-a", { status: "failed", detail: "Ed25519 verify failed" });
        throw new Error("B's signature did not verify");
      }
      setStep("verify-reply-a", { status: "done", detail: "✓ B is who they claim" });
      if (cancelRef.current.stop) return;

      // 6. Reputation tick — visible bump
      setStep("rep-tick", { status: "running" });
      await sleep(80);
      const bump = 700; // simulated ER tick
      setARep((s) => Math.min(10000, s + bump));
      setBRep((s) => Math.min(10000, s + bump));
      setAHistory((h) => [...h.slice(-49), Math.min(10000, (h.at(-1) ?? 0) + bump)]);
      setBHistory((h) => [...h.slice(-49), Math.min(10000, (h.at(-1) ?? 0) + bump)]);
      setStep("rep-tick", { status: "done", detail: `+${bump} each (ER session, ~30ms)` });
      if (cancelRef.current.stop) return;

      // 7. Validation: only on N=5th round
      const newRound = round + 1;
      setRound(newRound);
      if (newRound >= 5) {
        setStep("validation", { status: "running" });
        await sleep(220);
        setStep("validation", {
          status: "done",
          detail: "ValidationRecord PDA created on validation-registry; both agents now show ✓ Validated",
        });
        setValidated(true);
      } else {
        setStep("validation", {
          status: "idle",
          detail: `${5 - newRound} more round(s) until validation`,
        });
      }
    } catch (e) {
      // Already surfaced via failed step.
      console.error(e);
    } finally {
      setRunning(false);
    }
  };

  const replay = async () => {
    setRound(0);
    setARep(0);
    setBRep(0);
    setAHistory([0]);
    setBHistory([0]);
    setValidated(false);
    resetSteps();
    await sleep(50);
    void runOnce();
  };

  const stop = () => {
    cancelRef.current.stop = true;
  };

  // Optional: pre-fill from URL ?run=auto for shareable replay links
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("run") === "auto") void runOnce();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <AgentCard
          title="Agent A"
          domain={agentA.domain}
          pubkey={agentA.pubkey}
          rep={aRep}
          history={aHistory}
          accent="#00ffa3"
          validated={validated}
        />
        <AgentCard
          title="Agent B"
          domain={agentB.domain}
          pubkey={agentB.pubkey}
          rep={bRep}
          history={bHistory}
          accent="#7c5cff"
          validated={validated}
        />
      </div>

      <div className="panel" style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <button className="btn-accent" onClick={runOnce} disabled={running}>
          {running ? "Running…" : `Start handshake — round ${round + 1} / 5`}
        </button>
        <button className="btn-ghost" onClick={stop} disabled={!running}>Stop</button>
        <button className="btn-ghost" onClick={replay}>Replay from round 1</button>
        <span style={{ marginLeft: "auto", color: "var(--muted)", fontSize: "0.875rem" }}>
          Round <strong style={{ color: "var(--text)" }}>{round}</strong>{validated && " · ✓ Validated"}
        </span>
      </div>

      <ol className="panel" style={{ display: "grid", gap: "0.5rem", listStyle: "none", padding: "1rem" }}>
        {steps.map((s, i) => (
          <StepRow key={s.id} index={i + 1} step={s} />
        ))}
      </ol>
    </section>
  );
}

function AgentCard({
  title,
  domain,
  pubkey,
  rep,
  history,
  accent,
  validated,
}: {
  title: string;
  domain: string;
  pubkey: string;
  rep: number;
  history: number[];
  accent: string;
  validated: boolean;
}) {
  return (
    <div className="panel" style={{ display: "grid", gap: "0.625rem", borderLeft: `3px solid ${accent}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <strong>{title}</strong>
        {validated && (
          <span className="tag" style={{ background: "rgba(0,255,163,0.1)", color: accent, borderColor: accent }}>
            ✓ Validated
          </span>
        )}
      </div>
      <div style={{ fontFamily: "monospace", fontSize: "0.9375rem" }}>{domain}</div>
      <div style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
        signing-pubkey: <code>{shortPubkey(pubkey, 8, 8)}</code>
      </div>
      <ReputationGauge score={rep} history={history} label="reputation" accentColor={accent} />
    </div>
  );
}

function StepRow({ index, step }: { index: number; step: Step }) {
  const dot =
    step.status === "done"
      ? "✓"
      : step.status === "running"
      ? "●"
      : step.status === "failed"
      ? "✗"
      : "·";
  const color =
    step.status === "done"
      ? "var(--accent)"
      : step.status === "running"
      ? "#7c5cff"
      : step.status === "failed"
      ? "var(--danger)"
      : "var(--muted)";

  const whoTag =
    step.who === "A" ? "A" : step.who === "B" ? "B" : "V";
  const whoColor =
    step.who === "A" ? "#00ffa3" : step.who === "B" ? "#7c5cff" : "#8a93a0";

  return (
    <li style={{ display: "grid", gridTemplateColumns: "auto auto 1fr", gap: "0.625rem", alignItems: "baseline" }}>
      <span style={{ color, fontFamily: "monospace", width: "1.5rem", textAlign: "center" }}>{dot}</span>
      <span
        style={{
          background: whoColor,
          color: "#061018",
          fontFamily: "monospace",
          fontSize: "0.75rem",
          padding: "0 0.4rem",
          borderRadius: "4px",
          minWidth: "1.5rem",
          textAlign: "center",
        }}
      >
        {whoTag}
      </span>
      <span>
        <span style={{ color: "var(--muted)", marginRight: "0.5rem" }}>{index}.</span>
        {step.label}
        {step.detail && (
          <div style={{ fontSize: "0.8125rem", color: "var(--muted)", marginTop: "0.125rem", paddingLeft: "0.25rem" }}>
            {step.detail}
          </div>
        )}
      </span>
    </li>
  );
}
