"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Check, Copy, Plug, Terminal, MessageSquare } from "lucide-react";

// NPM one-liner config — preferred path. No clone, no build, no
// absolute paths. Works on macOS, Linux, Windows.
const CONFIG_JSON = `{
  "mcpServers": {
    "snsip-agent": {
      "command": "npx",
      "args": ["-y", "snsip-mcp"],
      "env": {
        "SNSIP_CLUSTER": "devnet",
        "SIM_API_KEY": "optional — get one at sim.dune.com for the activity tool"
      }
    }
  }
}`;

const FROM_SOURCE_CMD = `# Optional — only if you want to hack on the server locally
git clone https://github.com/hien-p/snsip-agent.git
cd snsip-agent && pnpm install && pnpm --filter snsip-mcp build
# Then change the "command" above to "node" and "args" to the
# absolute path of packages/snsip-mcp/dist/server.js`;

const REMOTE_SHARE_URL = "https://snsip-cc5.pages.dev/install";

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
          <strong style={{ fontSize: "1.0625rem" }}>Plug `.sol` agent identity into your AI assistant</strong>
        </div>
        <p style={{ margin: 0, fontSize: "0.9375rem", lineHeight: 1.6, color: "var(--text)" }}>
          The first agent-identity protocol on Solana that speaks Model Context Protocol natively.
          Claude Desktop, Cursor, Continue, Cline — any MCP client reads a <code>.sol</code> agent's
          permissions live from Solana and respects them in conversation. No custom integration per
          tool.
        </p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <span className="tag" style={{ borderColor: "var(--accent-2)" }}>5 tools</span>
          <span className="tag" style={{ borderColor: "var(--accent-2)" }}>stdio transport</span>
          <span className="tag" style={{ borderColor: "var(--accent-2)" }}>devnet by default</span>
          <span className="tag" style={{ borderColor: "var(--accent-2)" }}>~280 lines wrapping the SDK</span>
        </div>
      </div>

      <ShareInstallBar />


      <Section icon={<Terminal size={16} />} title="1. Paste this config into Claude Desktop">
        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--muted-2)" }}>
          Open <strong>Claude Desktop → Settings → Developer → Edit Config</strong>, paste this, restart Claude Desktop.
          No clone, no build, no absolute paths — <code>npx</code> downloads <code>snsip-mcp</code> from npm on first run.
        </p>
        <CodeBlock label="claude_desktop_config.json" code={CONFIG_JSON} />
        <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--muted)" }}>
          Cursor + Continue use the same shape — check their docs for where the file lives.
        </p>
      </Section>

      <Section icon={<Terminal size={16} />} title="2. (Optional) Build from source">
        <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--muted-2)" }}>
          Skip this section unless you want to hack on the server code. The npm install above is enough for normal use.
        </p>
        <CodeBlock label="terminal" code={FROM_SOURCE_CMD} />
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

function ShareInstallBar() {
  const [copied, setCopied] = useState(false);
  const onShare = async () => {
    try {
      await navigator.clipboard.writeText(REMOTE_SHARE_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {}
  };
  return (
    <div
      className="panel"
      style={{
        background: "var(--text)",
        color: "#fafafa",
        padding: "1.25rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        flexWrap: "wrap",
        border: "none",
      }}
    >
      <div>
        <div style={{ fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)", fontWeight: 700 }}>
          Share install link
        </div>
        <div style={{ fontSize: "1.125rem", fontWeight: 700, marginTop: "0.25rem", fontFamily: "monospace" }}>
          {REMOTE_SHARE_URL}
        </div>
        <div style={{ fontSize: "0.75rem", color: "rgba(250,250,250,0.65)", marginTop: "0.25rem" }}>
          Send this URL to anyone running Claude Desktop. They land on this page and follow the 3 steps below.
        </div>
      </div>
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={onShare}
        style={{
          background: "var(--accent)",
          color: "var(--text)",
          border: "none",
          padding: "0.75rem 1.25rem",
          borderRadius: "var(--radius-md)",
          fontWeight: 700,
          fontSize: "0.875rem",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.375rem",
        }}
      >
        {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy share link</>}
      </motion.button>
    </div>
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
