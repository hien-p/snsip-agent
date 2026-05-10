"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  ThumbsUp,
  ThumbsDown,
  Minus,
  Loader2,
  ExternalLink,
  Send,
  ShieldAlert,
} from "lucide-react";
import { explorerTx, shortPubkey } from "@/lib/format";
import { AgentActivity } from "./agent-activity";

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

type Rating = "positive" | "neutral" | "negative";

interface ReputationEvent {
  id: string;             // local uuid
  ts: number;             // unix ms
  rating: Rating;
  weight: number;         // future registry will compute from validator history; user-submitted defaults to 1
  note: string;
  validator: string;      // base58 wallet
  validatorLabel?: string;
  txSig?: string;         // present if user-submitted via memo
  source: "seed" | "user";
}

const RATING_META: Record<Rating, { label: string; tint: string; Icon: typeof ThumbsUp }> = {
  positive: { label: "positive", tint: "var(--accent-2)", Icon: ThumbsUp },
  neutral: { label: "neutral", tint: "var(--muted)", Icon: Minus },
  negative: { label: "negative", tint: "var(--danger)", Icon: ThumbsDown },
};

function storageKey(domain: string): string {
  return `snsip:reputation:${domain}`;
}

function loadUserEvents(domain: string): ReputationEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(domain));
    if (!raw) return [];
    return JSON.parse(raw) as ReputationEvent[];
  } catch {
    return [];
  }
}

function saveUserEvents(domain: string, events: ReputationEvent[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(domain), JSON.stringify(events));
  } catch {}
}

function seedEvents(domain: string): ReputationEvent[] {
  // Stable across refreshes — derived from the domain hash.
  const now = Date.now();
  return [
    {
      id: "seed-1",
      ts: now - 6 * 86_400_000,
      rating: "positive",
      weight: 8,
      note: "Completed Jupiter route within posted spend cap. Latency p95 = 412 ms.",
      validator: "JuP1terRouteFeederBotxxxxxxxxxxxxxxxxxxx",
      validatorLabel: "Jupiter Route Feeder Bot",
      source: "seed",
    },
    {
      id: "seed-2",
      ts: now - 3 * 86_400_000,
      rating: "neutral",
      weight: 5,
      note: "Refused 312 USDC swap (cap 100) — gate fired correctly. Logged for record.",
      validator: "RelayerSentinel11111111111111111111111111",
      validatorLabel: "Relayer Sentinel",
      source: "seed",
    },
    {
      id: "seed-3",
      ts: now - 1 * 86_400_000,
      rating: "positive",
      weight: 6,
      note: "Honored 30-day expiry. Did not act past published expiresAt.",
      validator: "MagicblockEphemeralRollupValidator111111",
      validatorLabel: "MagicBlock ER Validator",
      source: "seed",
    },
  ];
}

function aggregate(events: ReputationEvent[]) {
  let pos = 0;
  let neg = 0;
  let neu = 0;
  let score = 0;
  for (const e of events) {
    if (e.rating === "positive") {
      pos++;
      score += e.weight * 10;
    } else if (e.rating === "negative") {
      neg++;
      score -= e.weight * 15;
    } else {
      neu++;
    }
  }
  return { pos, neg, neu, score };
}

export function ReputationTimeline({ domain, ownerWallet = null }: { domain: string; ownerWallet?: string | null }) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const seeded = useMemo(() => seedEvents(domain), [domain]);
  const [userEvents, setUserEvents] = useState<ReputationEvent[]>([]);
  const [mounted, setMounted] = useState(false);

  const [rating, setRating] = useState<Rating>("positive");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setUserEvents(loadUserEvents(domain));
  }, [domain]);

  const events = mounted
    ? [...userEvents, ...seeded].sort((a, b) => b.ts - a.ts)
    : seeded;
  const stats = aggregate(events);

  const submit = async () => {
    if (!publicKey || !sendTransaction) {
      setError("Connect a Solana wallet (devnet) to submit a reputation event.");
      return;
    }
    if (!note.trim()) {
      setError("Add a short note describing the interaction.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const memo = `SNSIP-Rep v2 · agent=${domain} · validator=${publicKey.toBase58()} · rating=${rating} · weight=1 · note="${note.trim().replace(/"/g, "'").slice(0, 240)}" · t=${new Date().toISOString()}`;
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

      const newEvt: ReputationEvent = {
        id: `user-${Date.now()}`,
        ts: Date.now(),
        rating,
        weight: 1,
        note: note.trim().slice(0, 240),
        validator: publicKey.toBase58(),
        txSig,
        source: "user",
      };
      const next = [newEvt, ...userEvents];
      setUserEvents(next);
      saveUserEvents(domain, next);
      setNote("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <RoadmapBanner kind="reputation" />

      <AgentActivity domain={domain} ownerWallet={ownerWallet} />

      <div
        className="panel"
        style={{
          padding: "1.25rem 1.5rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "0.75rem",
        }}
      >
        <Stat label="positive" value={stats.pos} tint="var(--accent-2)" />
        <Stat label="neutral" value={stats.neu} tint="var(--muted)" />
        <Stat label="negative" value={stats.neg} tint="var(--danger)" />
        <Stat label="score" value={stats.score} tint="var(--text)" />
      </div>

      <div className="panel" style={{ padding: "1.5rem 1.75rem", display: "grid", gap: "0.875rem" }}>
        <strong style={{ fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Send size={16} /> Submit a reputation event
        </strong>
        <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--muted-2)", lineHeight: 1.55 }}>
          Logs an SNSIP-Rep v1 record via the SPL Memo program. Once the Anchor reputation registry is
          deployed, the same shape gets indexed automatically — for now any wallet can append a signed,
          on-chain receipt that's visible in Solana Explorer.
        </p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {(["positive", "neutral", "negative"] as Rating[]).map((r) => {
            const meta = RATING_META[r];
            const active = rating === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRating(r)}
                className={active ? "btn-accent" : "btn-ghost"}
                style={{
                  padding: "0.5rem 0.875rem",
                  fontSize: "0.8125rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem",
                }}
              >
                <meta.Icon size={13} />
                {meta.label}
              </button>
            );
          })}
        </div>
        <textarea
          className="input"
          rows={2}
          placeholder="What did this agent do? (kept within cap, refused unauthorized call, paid out on time, etc.)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{ resize: "vertical", fontFamily: "inherit" }}
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>One-click examples:</span>
          {[
            { rating: "positive" as const, text: "Completed swap within posted spend cap. Latency p95 ≈ 380 ms." },
            { rating: "positive" as const, text: "Honored 30-day expiry. Did not act past published expiresAt." },
            { rating: "neutral" as const, text: "Refused unauthorized call to System Program — gate fired correctly." },
            { rating: "negative" as const, text: "Did not respond to challenge within 30s timeout window." },
          ].map((s) => (
            <button
              key={s.text}
              type="button"
              onClick={() => {
                setRating(s.rating);
                setNote(s.text);
              }}
              className="tag"
              style={{
                cursor: "pointer",
                fontSize: "0.6875rem",
                borderColor:
                  s.rating === "positive"
                    ? "var(--accent-2)"
                    : s.rating === "negative"
                      ? "rgba(220,38,38,0.4)"
                      : "var(--border)",
                color: s.rating === "negative" ? "var(--danger)" : "var(--text)",
              }}
            >
              {s.text.length > 42 ? s.text.slice(0, 42) + "…" : s.text}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={submit}
            disabled={!publicKey || submitting || !note.trim()}
            className="btn-accent"
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="spin" /> sending…
              </>
            ) : (
              <>Submit on-chain</>
            )}
          </motion.button>
          {!publicKey && (
            <span className="tag" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
              connect wallet
            </span>
          )}
        </div>
        {error && (
          <div style={{ fontSize: "0.8125rem", color: "var(--danger)" }}>{error}</div>
        )}
      </div>

      <div style={{ display: "grid", gap: "0.625rem" }}>
        <strong style={{ fontSize: "0.875rem", color: "var(--muted-2)" }}>Timeline</strong>
        <AnimatePresence initial={false}>
          {events.map((e) => {
            const meta = RATING_META[e.rating];
            return (
              <motion.div
                key={e.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="panel"
                style={{
                  padding: "1rem 1.25rem",
                  display: "grid",
                  gap: "0.5rem",
                  borderColor: e.source === "user" ? "#cfe39b" : "var(--border)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <meta.Icon size={14} style={{ color: meta.tint }} />
                  <strong style={{ fontSize: "0.875rem", color: meta.tint }}>{meta.label}</strong>
                  <span
                    style={{
                      fontSize: "0.6875rem",
                      color: "var(--muted)",
                      fontFamily: "monospace",
                    }}
                    title="Weight — how heavily this validator's opinion counts in the aggregate score"
                  >
                    w={e.weight}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                    {new Date(e.ts).toLocaleString()}
                  </span>
                  {e.source === "user" && (
                    <span
                      className="tag"
                      style={{
                        background: "var(--accent-bg)",
                        borderColor: "var(--accent-2)",
                        color: "var(--text)",
                        fontSize: "0.6875rem",
                      }}
                    >
                      on-chain
                    </span>
                  )}
                  {e.source === "seed" && (
                    <span className="tag" style={{ fontSize: "0.6875rem" }}>demo data</span>
                  )}
                </div>
                <div style={{ fontSize: "0.875rem", color: "var(--text)", lineHeight: 1.5 }}>
                  {e.note}
                </div>
                <div style={{ display: "flex", gap: "0.875rem", flexWrap: "wrap", fontSize: "0.75rem", color: "var(--muted)" }}>
                  <span>
                    by{" "}
                    {e.validatorLabel ? (
                      <>
                        <strong style={{ color: "var(--text)" }}>{e.validatorLabel}</strong> ·{" "}
                        <code>{shortPubkey(e.validator, 4, 4)}</code>
                      </>
                    ) : (
                      <code>{shortPubkey(e.validator, 6, 6)}</code>
                    )}
                  </span>
                  {e.txSig && (
                    <a
                      href={explorerTx(e.txSig)}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "var(--text)", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                    >
                      explorer <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <details
        style={{
          padding: "0.625rem 0.875rem",
          background: "var(--panel-2)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          fontSize: "0.75rem",
          color: "var(--muted-2)",
        }}
      >
        <summary style={{ cursor: "pointer", color: "var(--text)", fontWeight: 500 }}>
          On-chain schema (forward-compatible with the reputation-registry program)
        </summary>
        <pre
          style={{
            margin: "0.5rem 0 0",
            padding: "0.625rem",
            background: "var(--panel)",
            borderRadius: "var(--radius-sm)",
            fontFamily: "monospace",
            fontSize: "0.6875rem",
            overflow: "auto",
            color: "var(--text)",
          }}
        >{`SNSIP-Rep v2 · agent=<sol> · validator=<pubkey>
            · rating=<positive|neutral|negative>
            · weight=<u64>            // future registry computes from validator history
            · note="<utf-8, ≤240 chars>"
            · t=<iso-8601>`}</pre>
      </details>

      <style jsx>{`
        .spin { animation: rot 0.9s linear infinite; }
        @keyframes rot { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </section>
  );
}

function Stat({ label, value, tint }: { label: string; value: number; tint: string }) {
  return (
    <div style={{ display: "grid", gap: "0.125rem", justifyItems: "center" }}>
      <strong style={{ fontFamily: "monospace", fontSize: "1.5rem", color: tint, letterSpacing: "-0.02em" }}>
        {value}
      </strong>
      <span style={{ fontSize: "0.6875rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </span>
    </div>
  );
}

export function RoadmapBanner({ kind }: { kind: "reputation" | "validation" }) {
  const text =
    kind === "reputation"
      ? "Anchor reputation-registry program is sketched in SNSIP-Agent.md and on the post-hackathon roadmap. Today, events are written via SPL Memo so any wallet can submit and Solana Explorer can verify."
      : "Anchor validation-registry program is sketched in SNSIP-Agent.md and on the post-hackathon roadmap. Today, attestations are written via SPL Memo so any wallet can submit and Solana Explorer can verify.";
  return (
    <div
      style={{
        display: "flex",
        gap: "0.625rem",
        alignItems: "flex-start",
        padding: "0.875rem 1rem",
        background: "rgba(255, 196, 0, 0.08)",
        border: "1px solid rgba(255, 196, 0, 0.4)",
        borderRadius: "var(--radius-md)",
        fontSize: "0.8125rem",
        color: "var(--text)",
        lineHeight: 1.55,
      }}
    >
      <ShieldAlert size={14} style={{ color: "#a87a00", flexShrink: 0, marginTop: "0.125rem" }} />
      <span>{text}</span>
    </div>
  );
}
