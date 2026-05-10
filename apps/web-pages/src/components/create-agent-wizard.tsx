"use client";

import { useMemo, useState } from "react";
import { Keypair, Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  agentRegistrationKey,
  createAgentSubdomainIx,
  fullSubdomainName,
  RECORD_AGENT_CAPABILITIES,
  RECORD_AGENT_ENDPOINT,
  RECORD_AGENT_SIGNING_PUBKEY,
  writeRecordV2Ix,
} from "@snsip/agent-sdk";
import { TxStatus, type TxState } from "./tx-status";
import bs58 from "bs58";

type Step = "form" | "review" | "tx" | "done";

export function CreateAgentWizard({
  parentDomain,
  onClose,
  onCreated,
}: {
  parentDomain: string;
  onClose: () => void;
  onCreated: (newDomain: string) => void;
}) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [step, setStep] = useState<Step>("form");
  const [sub, setSub] = useState("myagent");
  const [endpoint, setEndpoint] = useState("https://example.com/mcp");
  const [capabilitiesUri, setCapabilitiesUri] = useState("https://example.com/card.json");
  const [tx, setTx] = useState<TxState>({ kind: "idle" });

  // Generate an agent signing keypair locally — the SDK puts the pubkey
  // in records v2 + (later) the Identity Registry. The private key is
  // stashed to localStorage in the demo SDK; production agents would
  // hold it in their own secure storage.
  const agentKp = useMemo(() => Keypair.generate(), []);

  const fullName = fullSubdomainName(parentDomain, sub);
  const canSubmit =
    step === "form" && publicKey !== null && /^[a-z0-9-]{1,32}$/.test(sub);

  const submit = async () => {
    if (!publicKey) return;
    setStep("tx");
    setTx({ kind: "building" });

    try {
      const placeholderRegistry = "RegistryPlaceholder111111111111111111111111";
      const placeholderAgentId = 0n;

      const [subdomainIxs, sigKeyIx, endpointIx, capIx, registrationIx] = await Promise.all([
        createAgentSubdomainIx(connection, {
          parentDomain,
          subdomain: sub,
          owner: publicKey,
          payer: publicKey,
        }),
        writeRecordV2Ix(connection, {
          domain: fullName,
          recordKey: RECORD_AGENT_SIGNING_PUBKEY,
          value: bs58.encode(agentKp.publicKey.toBytes()),
          payer: publicKey,
          domainOwner: publicKey,
        }),
        writeRecordV2Ix(connection, {
          domain: fullName,
          recordKey: RECORD_AGENT_ENDPOINT,
          value: endpoint,
          payer: publicKey,
          domainOwner: publicKey,
        }),
        writeRecordV2Ix(connection, {
          domain: fullName,
          recordKey: RECORD_AGENT_CAPABILITIES,
          value: capabilitiesUri,
          payer: publicKey,
          domainOwner: publicKey,
        }),
        writeRecordV2Ix(connection, {
          domain: fullName,
          recordKey: agentRegistrationKey(placeholderRegistry, placeholderAgentId),
          value: "1",
          payer: publicKey,
          domainOwner: publicKey,
        }),
      ]);

      const transaction = new Transaction().add(
        ...subdomainIxs,
        sigKeyIx,
        endpointIx,
        capIx,
        registrationIx,
      );
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.feePayer = publicKey;
      transaction.recentBlockhash = blockhash;

      setTx({ kind: "signing" });
      const sig = await sendTransaction(transaction, connection);
      setTx({ kind: "sent", sig });

      // Stash the agent's signing key in localStorage (demo SDK pattern;
      // production agents would never let the dashboard hold their keys).
      localStorage.setItem(
        `snsip:agent-sk:${fullName}`,
        bs58.encode(agentKp.secretKey),
      );

      await connection.confirmTransaction(sig, "confirmed");
      setTx({ kind: "confirmed", sig });
      setStep("done");
      onCreated(fullName);
    } catch (e) {
      const msg = (e as Error).message;
      setTx({ kind: "error", message: msg });
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "grid",
        placeItems: "center",
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        className="panel"
        style={{ width: "min(560px, 92vw)", maxHeight: "90vh", overflow: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <header style={{ display: "flex", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Create agent subdomain</h2>
          <button className="btn-ghost" onClick={onClose}>
            ✕
          </button>
        </header>

        {step === "form" && (
          <div style={{ display: "grid", gap: "0.875rem", marginTop: "1rem" }}>
            <Field label="Parent domain">
              <input className="input" value={parentDomain} disabled />
            </Field>
            <Field label="Subdomain name" hint="lowercase letters, digits, hyphens; 1–32 chars">
              <input
                className="input"
                value={sub}
                onChange={(e) => setSub(e.target.value.toLowerCase())}
                spellCheck={false}
              />
              <div style={{ fontSize: "0.8125rem", color: "var(--muted)", marginTop: "0.25rem" }}>
                Will be created as <code>{fullName}</code>
              </div>
            </Field>
            <Field label="Agent endpoint (MCP / A2A URL)">
              <input className="input" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} />
            </Field>
            <Field label="Capability card URI">
              <input
                className="input"
                value={capabilitiesUri}
                onChange={(e) => setCapabilitiesUri(e.target.value)}
              />
            </Field>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button className="btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button className="btn-accent" disabled={!canSubmit} onClick={() => setStep("review")}>
                Continue
              </button>
            </div>
          </div>
        )}

        {step === "review" && (
          <div style={{ display: "grid", gap: "0.875rem", marginTop: "1rem" }}>
            <ReviewRow label="New subdomain" value={fullName} />
            <ReviewRow label="Agent signing pubkey" value={agentKp.publicKey.toBase58()} />
            <ReviewRow label="Endpoint" value={endpoint} />
            <ReviewRow label="Capabilities" value={capabilitiesUri} />
            <p style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
              We'll bundle one transaction with: create subdomain · set <code>agent.signing-pubkey</code> ·
              set <code>agent.endpoint</code> · set <code>agent.capabilities</code> · set placeholder{" "}
              <code>agent-registration[…]</code> (rewritten to the real registry on Day 2).
            </p>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "space-between" }}>
              <button className="btn-ghost" onClick={() => setStep("form")}>
                Back
              </button>
              <button className="btn-accent" onClick={submit}>
                Submit transaction
              </button>
            </div>
          </div>
        )}

        {(step === "tx" || step === "done") && (
          <div style={{ display: "grid", gap: "0.5rem", marginTop: "1rem" }}>
            <ReviewRow label="New subdomain" value={fullName} />
            <TxStatus state={tx} />
            {step === "done" && (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button className="btn-accent" onClick={onClose}>
                  Close
                </button>
              </div>
            )}
            {tx.kind === "error" && (
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                <button className="btn-ghost" onClick={onClose}>
                  Cancel
                </button>
                <button className="btn-accent" onClick={() => setStep("review")}>
                  Try again
                </button>
              </div>
            )}
          </div>
        )}
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

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel" style={{ background: "var(--panel-2)", padding: "0.75rem 1rem" }}>
      <div style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>{label}</div>
      <div style={{ fontFamily: "monospace", fontSize: "0.875rem", wordBreak: "break-all" }}>
        {value}
      </div>
    </div>
  );
}
