import Link from "next/link";
import { WalletButton } from "./wallet-button";

type Tab =
  | "home"
  | "latency"
  | "handshake"
  | "agents"
  | "login"
  | "airdrop"
  | "swap"
  | "mcp"
  | "graph";

const LINKS: Array<{ tab: Exclude<Tab, "home">; href: string; label: string }> = [
  { tab: "mcp", href: "/mcp", label: "MCP" },
  { tab: "graph", href: "/graph", label: "Graph" },
  { tab: "agents", href: "/agents", label: "Agents" },
  { tab: "login", href: "/login-demo", label: "Sign-in" },
  { tab: "airdrop", href: "/airdrop-demo", label: "Airdrop" },
  { tab: "swap", href: "/swap-demo", label: "Swap" },
];

export function SiteNav({ active }: { active: Tab }) {
  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1rem 0",
        flexWrap: "wrap",
        gap: "0.75rem",
      }}
    >
      <Link
        href="/"
        style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", color: "var(--text)" }}
      >
        <span
          style={{
            display: "inline-block",
            width: "0.625rem",
            height: "0.625rem",
            borderRadius: "999px",
            background: "var(--accent)",
            boxShadow: "0 0 8px var(--accent)",
          }}
        />
        <strong>SNSIP-Agent</strong>
        <span className="tag" style={{ marginLeft: "0.5rem" }}>devnet</span>
      </Link>
      <nav style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
        {LINKS.map((l) => (
          <Link
            key={l.tab}
            href={l.href}
            style={{
              color: active === l.tab ? "var(--accent)" : "var(--muted)",
              fontWeight: active === l.tab ? 600 : 400,
            }}
          >
            {l.label}
          </Link>
        ))}
        <WalletButton />
      </nav>
    </header>
  );
}
