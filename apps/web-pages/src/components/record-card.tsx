"use client";

import { explorerAddress, shortPubkey } from "@/lib/format";

export function RecordCard({
  recordKey,
  value,
}: {
  recordKey: string;
  value: string | null | undefined;
}) {
  const empty = !value;
  return (
    <div className="panel" style={{ padding: "0.875rem 1rem" }}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div style={{ fontFamily: "monospace", fontSize: "0.8125rem", color: "var(--muted)" }}>
            {recordKey}
          </div>
          <div style={{ marginTop: "0.25rem", wordBreak: "break-all" }}>
            {empty ? <span style={{ color: "var(--muted)" }}>— not set —</span> : renderValue(recordKey, value)}
          </div>
        </div>
        <span className="tag">SNS records v2</span>
      </div>
    </div>
  );
}

function renderValue(key: string, value: string) {
  if (key === "agent.signing-pubkey" && value.length >= 32) {
    return (
      <a
        href={explorerAddress(value)}
        target="_blank"
        rel="noreferrer"
        style={{ color: "var(--accent)" }}
        title={value}
      >
        {shortPubkey(value, 8, 8)}
      </a>
    );
  }
  if (key === "agent.endpoint" || key === "agent.capabilities" || key === "avatar") {
    if (value.startsWith("http") || value.startsWith("data:")) {
      return (
        <a href={value} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>
          {value}
        </a>
      );
    }
  }
  return <span>{value}</span>;
}
