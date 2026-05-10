"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { BadgeCheck, ExternalLink, Loader2, Send } from "lucide-react";
import { explorerTx, shortPubkey } from "@/lib/format";
import { RoadmapBanner } from "./reputation-timeline";

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

type ClaimClass = "audit" | "kyc" | "capability" | "custom";

interface Validation {
  id: string;
  ts: number;
  attestor: string;
  attestorLabel?: string;
  claimClass: ClaimClass;
  claim: string;
  txSig?: string;
  source: "seed" | "user";
}

const CLASS_META: Record<ClaimClass, { label: string; tint: string }> = {
  audit: { label: "audit", tint: "#7c5cff" },
  kyc: { label: "kyc", tint: "#0a84ff" },
  capability: { label: "capability", tint: "var(--accent-2)" },
  custom: { label: "custom", tint: "var(--muted)" },
};

function storageKey(domain: string): string {
  return `snsip:validations:${domain}`;
}

function loadUserValidations(domain: string): Validation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(domain));
    if (!raw) return [];
    return JSON.parse(raw) as Validation[];
  } catch {
    return [];
  }
}

function saveUserValidations(domain: string, validations: Validation[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(domain), JSON.stringify(validations));
  } catch {}
}

function seedValidations(): Validation[] {
  const now = Date.now();
  return [
    {
      id: "seed-1",
      ts: now - 14 * 86_400_000,
      attestor: "SNSIPAuditBot111111111111111111111111111",
      attestorLabel: "SNSIP Audit Bot",
      claimClass: "audit",
      claim: "agent.signing-pubkey matches the Ed25519 key in agent.controller. Records v2 readable on devnet.",
      source: "seed",
    },
    {
      id: "seed-2",
      ts: now - 7 * 86_400_000,
      attestor: "SolanaFoundationValidator11111111111111",
      attestorLabel: "Solana Foundation",
      claimClass: "capability",
      claim: "Domain registered through canonical SNS root. Owner wallet has not been flagged.",
      source: "seed",
    },
  ];
}

export function ValidationsList({ domain }: { domain: string }) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const seeded = useMemo(() => seedValidations(), []);
  const [userValidations, setUserValidations] = useState<Validation[]>([]);
  const [mounted, setMounted] = useState(false);

  const [claim, setClaim] = useState("");
  const [claimClass, setClaimClass] = useState<ClaimClass>("custom");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setUserValidations(loadUserValidations(domain));
  }, [domain]);

  const validations = mounted
    ? [...userValidations, ...seeded].sort((a, b) => b.ts - a.ts)
    : seeded;

  const submit = async () => {
    if (!publicKey || !sendTransaction) {
      setError("Connect a Solana wallet (devnet) to submit a validation.");
      return;
    }
    if (!claim.trim()) {
      setError("Add a short claim (what are you attesting to?).");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const memo = `SNSIP-Val v2 · agent=${domain} · attestor=${publicKey.toBase58()} · class=${claimClass} · claim="${claim.trim().replace(/"/g, "'").slice(0, 280)}" · t=${new Date().toISOString()}`;
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

      const newVal: Validation = {
        id: `user-${Date.now()}`,
        ts: Date.now(),
        attestor: publicKey.toBase58(),
        claimClass,
        claim: claim.trim().slice(0, 280),
        txSig,
        source: "user",
      };
      const next = [newVal, ...userValidations];
      setUserValidations(next);
      saveUserValidations(domain, next);
      setClaim("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section style={{ display: "grid", gap: "1rem" }}>
      <RoadmapBanner kind="validation" />

      <div className="panel" style={{ padding: "1.5rem 1.75rem", display: "grid", gap: "0.875rem" }}>
        <strong style={{ fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Send size={16} /> Attest to {domain}
        </strong>
        <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--muted-2)", lineHeight: 1.55 }}>
          Sign a claim about what you've verified about this agent. Stored as an SNSIP-Val v1 memo —
          your wallet is the attestor pubkey, signed by your Solana key.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: "0.5rem" }}>
          <select
            className="input"
            value={claimClass}
            onChange={(e) => setClaimClass(e.target.value as ClaimClass)}
            title="Validation class — how the future registry will index this attestation"
          >
            <option value="audit">audit</option>
            <option value="kyc">kyc</option>
            <option value="capability">capability</option>
            <option value="custom">custom</option>
          </select>
          <input
            className="input"
            placeholder='e.g. "Audited the Anchor program. No reentrancy."'
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>One-click examples:</span>
          {(
            [
              { class: "audit", text: "Audited the Anchor program. No reentrancy." },
              { class: "capability", text: "agent.signing-pubkey is a fresh key, not reused." },
              { class: "capability", text: "Permission grant is well-formed and within sane bounds." },
              { class: "audit", text: "Endpoint serves valid Ed25519 signatures matching the on-chain key." },
            ] as { class: ClaimClass; text: string }[]
          ).map((s) => (
            <button
              key={s.text}
              type="button"
              onClick={() => {
                setClaimClass(s.class);
                setClaim(s.text);
              }}
              className="tag"
              style={{
                cursor: "pointer",
                fontSize: "0.6875rem",
                borderColor: CLASS_META[s.class].tint,
              }}
            >
              {s.text.length > 38 ? s.text.slice(0, 38) + "…" : s.text}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={submit}
            disabled={!publicKey || submitting || !claim.trim()}
            className="btn-accent"
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="spin" /> sending…
              </>
            ) : (
              <>Submit attestation on-chain</>
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
        <strong style={{ fontSize: "0.875rem", color: "var(--muted-2)" }}>
          {validations.length} attestation{validations.length === 1 ? "" : "s"}
        </strong>
        <AnimatePresence initial={false}>
          {validations.map((v) => (
            <motion.div
              key={v.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="panel"
              style={{
                padding: "1rem 1.25rem",
                display: "grid",
                gap: "0.5rem",
                borderColor: v.source === "user" ? "#cfe39b" : "var(--border)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <BadgeCheck size={16} style={{ color: "var(--accent-2)" }} />
                <strong style={{ fontSize: "0.875rem" }}>
                  {v.attestorLabel ?? "Anonymous validator"}
                </strong>
                <code style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                  {shortPubkey(v.attestor, 4, 4)}
                </code>
                <span
                  className="tag"
                  style={{
                    fontSize: "0.625rem",
                    color: CLASS_META[v.claimClass].tint,
                    borderColor: CLASS_META[v.claimClass].tint,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {CLASS_META[v.claimClass].label}
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                  · {new Date(v.ts).toLocaleDateString()}
                </span>
                {v.source === "user" && (
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
                {v.source === "seed" && (
                  <span className="tag" style={{ fontSize: "0.6875rem" }}>demo data</span>
                )}
              </div>
              <div style={{ fontSize: "0.875rem", lineHeight: 1.5 }}>{v.claim}</div>
              {v.txSig && (
                <a
                  href={explorerTx(v.txSig)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    width: "fit-content",
                  }}
                >
                  explorer <ExternalLink size={10} />
                </a>
              )}
            </motion.div>
          ))}
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
          On-chain schema (forward-compatible with the validation-registry program)
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
        >{`SNSIP-Val v2 · agent=<sol> · attestor=<pubkey>
            · class=<audit|kyc|capability|custom>
            · claim="<utf-8, ≤280 chars>"
            · t=<iso-8601>
            // future: + claim_uri (off-chain evidence pointer), expiry, revoked`}</pre>
      </details>

      <style jsx>{`
        .spin { animation: rot 0.9s linear infinite; }
        @keyframes rot { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </section>
  );
}
