"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Check, Copy, Plug, Terminal, MessageSquare } from "lucide-react";

const CONFIG_JSON = `{
  "mcpServers": {
    "snsip-agent": {
      "command": "node",
      "args": ["/absolute/path/to/sns_prj/packages/snsip-mcp/dist/server.js"],
      "env": { "SNSIP_CLUSTER": "devnet" }
    }
  }
}`;

const BUILD_CMD = `git clone https://github.com/<your-org>/snsip-agent
cd snsip-agent
pnpm install
pnpm --filter @snsip/mcp build`;

const TOOLS = [
  {
    name: "sns_resolve_identity",
    purpose: "Pull every SNSIP record on a .sol — owner, signing pubkey, endpoint, controller, avatar, and the parsed permission grant.",
    input: '{ "domain": "swap-bot.sol" }',
  },
  {
    name: "sns_check_permission",
    purpose: "Run the standard SNSIP gate against a proposed call — active? target whitelisted? amount within cap? Returns allow/deny with reason.",
    input: '{ "domain": "swap-bot.sol", "target": "JUP6Lk…", "mint": "EPjFWd…", "amountRaw": "25000000" }',
  },
  {
    name: "sns_list_agents",
    purpose: "Every .sol owned by a wallet, plus which ones publish SNSIP identity records.",
    input: '{ "wallet": "6AcSwib…uArjEt", "withIdentityOnly": true }',
  },
  {
    name: "sns_sign_in_with_sol",
    purpose: "Verify wallet owns the .sol on-chain AND the Ed25519 signature over the challenge is valid. Drop-in passwordless login.",
    input: '{ "domain": "alice.sol", "walletPubkey": "…", "challenge": "…", "signatureBase58": "…" }',
  },
];

const PROMPTS = [
  "What is swap-bot.sol allowed to do?",
  "Can swap-bot.sol call Jupiter for 25 USDC?",
  "Can swap-bot.sol call Jupiter for 500 USDC?",
  "Can swap-bot.sol call the System Program (11111111111111111111111111111111)?",
  "List every .sol owned by 6AcSwibbv26kg7qAB28CXCAH2jSbSK39SeM5KuArjEt — only ones with SNSIP identity.",
];

export function McpDocs() {
  return (
    <section style={{ display: "grid", gap: "1.5rem" }}>
      <div
        className="panel"
        style={{
          background: "var(--accent-bg)",
          borderColor: "#cfe39b",
          padding: "1.5rem 1.75rem",
          display: "grid",
          gap: "0.875rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Plug size={18} />
          <strong style={{ fontSize: "1.0625rem" }}>Why this is the moment</strong>
        </div>
        <p style={{ margin: 0, fontSize: "0.9375rem", lineHeight: 1.6, color: "var(--text)" }}>
          Every AI assistant that speaks MCP — Claude Desktop, Cursor, Continue, Cline — can now read
          a <code>.sol</code> identity, check its permissions, and sign in with it. Without us
          writing custom integrations for each one. ENS doesn't have this. SNS doesn't have this.
          You'd be first.
        </p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <span className="tag" style={{ borderColor: "var(--accent-2)" }}>4 tools</span>
          <span className="tag" style={{ borderColor: "var(--accent-2)" }}>stdio transport</span>
          <span className="tag" style={{ borderColor: "var(--accent-2)" }}>devnet by default</span>
          <span className="tag" style={{ borderColor: "var(--accent-2)" }}>~120 lines wrapping the SDK</span>
        </div>
      </div>

      <Section icon={<Terminal size={16} />} title="1. Build">
        <CodeBlock label="terminal" code={BUILD_CMD} />
      </Section>

      <Section icon={<Terminal size={16} />} title="2. Wire it into Claude Desktop">
        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--muted-2)" }}>
          Open <strong>Claude Desktop → Settings → Developer → Edit Config</strong>, paste this,
          replace the path with your local checkout, restart.
        </p>
        <CodeBlock label="claude_desktop_config.json" code={CONFIG_JSON} />
        <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--muted)" }}>
          Cursor + Continue use the same shape — check their docs for where the file lives.
        </p>
      </Section>

      <Section icon={<MessageSquare size={16} />} title="3. Talk to it">
        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--muted-2)" }}>
          Type any of these into Claude Desktop after the install:
        </p>
        <div style={{ display: "grid", gap: "0.5rem" }}>
          {PROMPTS.map((p) => (
            <div
              key={p}
              style={{
                padding: "0.625rem 0.875rem",
                background: "var(--panel-2)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                fontSize: "0.875rem",
                color: "var(--text)",
                fontFamily: "var(--font-mono)",
              }}
            >
              "{p}"
            </div>
          ))}
        </div>
      </Section>

      <Section icon={<Plug size={16} />} title="The four tools">
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {TOOLS.map((t) => (
            <div
              key={t.name}
              style={{
                padding: "1rem 1.25rem",
                background: "var(--panel-2)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                display: "grid",
                gap: "0.5rem",
              }}
            >
              <code style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text)" }}>
                {t.name}
              </code>
              <div style={{ fontSize: "0.8125rem", color: "var(--muted-2)", lineHeight: 1.55 }}>
                {t.purpose}
              </div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: "0.75rem",
                  color: "var(--muted)",
                  background: "var(--panel)",
                  padding: "0.5rem 0.625rem",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border)",
                  overflow: "auto",
                }}
              >
                {t.input}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <div className="panel" style={{ background: "var(--panel-2)", padding: "1.25rem 1.5rem", display: "grid", gap: "0.5rem" }}>
        <strong style={{ fontSize: "0.875rem" }}>How it fits the stack</strong>
        <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--muted-2)", lineHeight: 1.6 }}>
          The MCP server is a thin wrapper around <code>@snsip/agent-sdk</code> — the same SDK that
          powers <a href="/login-demo/" style={{ color: "var(--text)" }}>/login-demo</a>,{" "}
          <a href="/airdrop-demo/" style={{ color: "var(--text)" }}>/airdrop-demo</a>, and{" "}
          <a href="/swap-demo/" style={{ color: "var(--text)" }}>/swap-demo</a>. Same on-chain
          source, three different surfaces (web, MCP, programmatic). Anyone can swap the web UI for
          their own client without re-implementing the gate.
        </p>
      </div>
    </section>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="panel" style={{ padding: "1.5rem 1.75rem", display: "grid", gap: "0.875rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {icon}
        <strong style={{ fontSize: "1rem" }}>{title}</strong>
      </div>
      {children}
    </div>
  );
}

function CodeBlock({ label, code }: { label: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };
  return (
    <div
      style={{
        position: "relative",
        background: "var(--panel-2)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.5rem 0.875rem",
          borderBottom: "1px solid var(--border)",
          fontSize: "0.6875rem",
          color: "var(--muted)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontFamily: "monospace",
        }}
      >
        <span>{label}</span>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onCopy}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: copied ? "var(--accent-2)" : "var(--muted)",
            fontSize: "0.6875rem",
            textTransform: "none",
            letterSpacing: "0",
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "copied" : "copy"}
        </motion.button>
      </div>
      <pre
        style={{
          margin: 0,
          padding: "0.875rem 1rem",
          fontFamily: "monospace",
          fontSize: "0.75rem",
          lineHeight: 1.6,
          color: "var(--text)",
          background: "var(--panel)",
          overflow: "auto",
        }}
      >
        {code}
      </pre>
    </div>
  );
}
