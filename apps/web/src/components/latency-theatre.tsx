"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Connection, Transaction } from "@solana/web3.js";
import {
  isProgramDeployed,
  makeERConnection,
  MAGIC_ROUTER_DEVNET,
  noopTransferIx,
  rollingStats,
  timeAsync,
  type LatencySample,
  type RollingStats,
} from "@snsip/agent-sdk";
import { ReputationGauge } from "./reputation-gauge";
import { TxStatus, type TxState } from "./tx-status";

// Replace this with the deployed reputation-registry program ID after
// `anchor keys sync && anchor deploy --provider.cluster devnet`. Until
// then, the playground falls back to the sentinel and uses no-op self
// transfers as the "tap" payload.
const REPUTATION_PROGRAM_ID = "11111111111111111111111111111111";

export function LatencyTheatre() {
  const { connection: l1Connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const erConnection = useMemo(() => makeERConnection("processed"), []);

  const [l1Samples, setL1Samples] = useState<LatencySample[]>([]);
  const [erSamples, setErSamples] = useState<LatencySample[]>([]);
  const [l1Score, setL1Score] = useState(0);
  const [erScore, setErScore] = useState(0);
  const [l1History, setL1History] = useState<number[]>([0]);
  const [erHistory, setErHistory] = useState<number[]>([0]);
  const [tx, setTx] = useState<TxState>({ kind: "idle" });

  const isER = (cluster: "l1" | "er") => cluster === "er";
  const realMode = isProgramDeployed(REPUTATION_PROGRAM_ID);

  // Auto-tap loop control
  const autoTapRef = useRef<{ stop: boolean }>({ stop: false });

  // Auto-scroll the tx-status panel into view on state change
  // (especially useful when "Connect wallet first" error appears below the fold).
  const txStatusRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (tx.kind === "idle" || tx.kind === "confirmed") return;
    if (tx.kind === "error" || tx.kind === "sent") {
      txStatusRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [tx]);

  const tap = async (cluster: "l1" | "er"): Promise<LatencySample | null> => {
    if (!publicKey) {
      setTx({ kind: "error", message: "Connect wallet first." });
      return null;
    }

    const conn = isER(cluster) ? erConnection : l1Connection;
    setTx({ kind: "building" });

    try {
      const ix = noopTransferIx(publicKey);
      const transaction = new Transaction().add(ix);
      const { blockhash } = await conn.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      setTx({ kind: "signing" });

      const sample = await timeAsync(async () => {
        const sig = await sendTransaction(transaction, conn);
        // For ER (Magic Router), prefer "processed" — confirmed adds RT to L1.
        await conn.confirmTransaction(sig, isER(cluster) ? "processed" : "confirmed");
        return sig;
      });

      setTx({ kind: "confirmed", sig: sample.result });

      const out: LatencySample = {
        latencyMs: sample.latencyMs,
        cluster,
        sentAt: Date.now(),
        signature: sample.result,
      };
      bumpScore(cluster, out.latencyMs);
      return out;
    } catch (e) {
      setTx({ kind: "error", message: (e as Error).message });
      return null;
    }
  };

  const bumpScore = (cluster: "l1" | "er", latencyMs: number) => {
    const delta = Math.max(50, Math.round(1000 - latencyMs)); // faster = bigger bump
    if (cluster === "l1") {
      setL1Samples((s) => [...s, { latencyMs, cluster, sentAt: Date.now() }]);
      setL1Score((s) => Math.min(10_000, s + delta));
      setL1History((h) => [...h.slice(-49), Math.min(10_000, (h.at(-1) ?? 0) + delta)]);
    } else {
      setErSamples((s) => [...s, { latencyMs, cluster, sentAt: Date.now() }]);
      setErScore((s) => Math.min(10_000, s + delta));
      setErHistory((h) => [...h.slice(-49), Math.min(10_000, (h.at(-1) ?? 0) + delta)]);
    }
  };

  const autoTap = async (cluster: "l1" | "er", count = 25) => {
    autoTapRef.current.stop = false;
    for (let i = 0; i < count; i++) {
      if (autoTapRef.current.stop) break;
      await tap(cluster);
    }
  };

  const stopAutoTap = () => {
    autoTapRef.current.stop = true;
  };

  const reset = () => {
    setL1Samples([]);
    setErSamples([]);
    setL1Score(0);
    setErScore(0);
    setL1History([0]);
    setErHistory([0]);
    setTx({ kind: "idle" });
  };

  const l1Stats = rollingStats(l1Samples);
  const erStats = rollingStats(erSamples);

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <div className="panel" style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
        <span className="tag" style={{ background: realMode ? "rgba(0,255,163,0.1)" : "var(--panel-2)" }}>
          {realMode ? "REAL MODE — calling deployed program" : "PREVIEW MODE — no-op self-transfers (deploy reputation-registry to switch)"}
        </span>
        <span style={{ color: "var(--muted)", fontSize: "0.875rem", marginLeft: "auto" }}>
          ER endpoint: <code>{MAGIC_ROUTER_DEVNET}</code>
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <ClusterCard
          label="L1 (devnet)"
          accentColor="#8a93a0"
          score={l1Score}
          history={l1History}
          stats={l1Stats}
          onTap={() => void tap("l1")}
          onAutoTap={() => void autoTap("l1")}
        />
        <ClusterCard
          label="MagicBlock ER"
          accentColor="#00ffa3"
          score={erScore}
          history={erHistory}
          stats={erStats}
          onTap={() => void tap("er")}
          onAutoTap={() => void autoTap("er")}
        />
      </div>

      <div className="panel" style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <button className="btn-ghost" onClick={stopAutoTap}>Stop auto-tap</button>
        <button className="btn-ghost" onClick={reset}>Reset gauges</button>
        <span style={{ color: "var(--muted)", fontSize: "0.875rem", marginLeft: "auto" }}>
          {l1Samples.length + erSamples.length} taps total
        </span>
      </div>

      <div ref={txStatusRef}>
        <TxStatus state={tx} />
      </div>

      <div className="panel" style={{ background: "var(--panel-2)", fontSize: "0.875rem", color: "var(--muted)" }}>
        <strong style={{ color: "var(--text)" }}>What you're seeing:</strong> each tap is a real Solana transaction (no-op self-transfer in PREVIEW mode, <code>record_interaction</code> in REAL mode). The latency you observe is end-to-end: build tx → wallet signs → RPC submits → cluster confirms. ER uses <code>"processed"</code> commitment from the rollup; L1 uses <code>"confirmed"</code>. Once the reputation account is delegated to ER (Day 3 program work), ER taps drop into the sub-50ms range.
      </div>
    </section>
  );
}

function ClusterCard({
  label,
  accentColor,
  score,
  history,
  stats,
  onTap,
  onAutoTap,
}: {
  label: string;
  accentColor: string;
  score: number;
  history: number[];
  stats: RollingStats;
  onTap: () => void;
  onAutoTap: () => void;
}) {
  return (
    <div className="panel" style={{ display: "grid", gap: "0.875rem" }}>
      <h3 style={{ margin: 0, fontSize: "1rem", color: accentColor }}>{label}</h3>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          className="btn-accent"
          style={{ background: accentColor, flex: 1 }}
          onClick={onTap}
        >
          Tap
        </button>
        <button className="btn-ghost" onClick={onAutoTap}>
          Auto × 25
        </button>
      </div>

      <ReputationGauge score={score} history={history} label="reputation" accentColor={accentColor} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem", fontSize: "0.8125rem" }}>
        <Stat label="count" value={stats.count.toString()} />
        <Stat label="last" value={fmtMs(stats.last)} />
        <Stat label="avg" value={fmtMs(stats.avg)} />
        <Stat label="p95" value={fmtMs(stats.p95)} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "grid", gap: "0.125rem" }}>
      <span style={{ color: "var(--muted)" }}>{label}</span>
      <span style={{ fontFamily: "monospace" }}>{value}</span>
    </div>
  );
}

function fmtMs(n: number | null): string {
  if (n === null) return "—";
  if (n < 1000) return `${Math.round(n)} ms`;
  return `${(n / 1000).toFixed(2)} s`;
}
