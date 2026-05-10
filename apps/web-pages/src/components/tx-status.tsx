"use client";

import { explorerTx } from "@/lib/format";

export type TxState =
  | { kind: "idle" }
  | { kind: "building" }
  | { kind: "signing" }
  | { kind: "sent"; sig: string }
  | { kind: "confirmed"; sig: string }
  | { kind: "error"; message: string };

export function TxStatus({ state }: { state: TxState }) {
  if (state.kind === "idle") return null;

  const color =
    state.kind === "error"
      ? "var(--danger)"
      : state.kind === "confirmed"
      ? "var(--accent)"
      : "var(--muted)";

  return (
    <div
      className="panel"
      style={{
        padding: "0.75rem 1rem",
        borderColor: color,
        marginTop: "0.75rem",
        fontSize: "0.875rem",
      }}
    >
      {state.kind === "building" && "Building transaction…"}
      {state.kind === "signing" && "Awaiting wallet signature…"}
      {state.kind === "sent" && (
        <>
          Sent — awaiting confirmation. <ExplorerLink sig={state.sig} />
        </>
      )}
      {state.kind === "confirmed" && (
        <>
          ✓ Confirmed. <ExplorerLink sig={state.sig} />
        </>
      )}
      {state.kind === "error" && <>✗ {state.message}</>}
    </div>
  );
}

function ExplorerLink({ sig }: { sig: string }) {
  return (
    <a href={explorerTx(sig)} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>
      View on Explorer
    </a>
  );
}
