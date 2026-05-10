import Link from "next/link";
import { HandshakeTheatre } from "@/components/handshake-theatre";
import { WalletButton } from "@/components/wallet-button";

export default function HandshakePlaygroundPage() {
  return (
    <main style={{ maxWidth: "1080px", margin: "0 auto", padding: "1.5rem" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 0",
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", color: "var(--text)" }}>
          <span style={{ display: "inline-block", width: "0.625rem", height: "0.625rem", borderRadius: "999px", background: "var(--accent)" }} />
          <strong>SNSIP-Agent</strong>
          <span className="tag" style={{ marginLeft: "0.5rem" }}>devnet</span>
        </Link>
        <nav style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Link href="/playground/verify" style={{ color: "var(--muted)" }}>Verifier</Link>
          <Link href="/playground/latency" style={{ color: "var(--muted)" }}>Latency</Link>
          <Link href="/playground/handshake" style={{ color: "var(--accent)" }}>Handshake</Link>
          <Link href="/agents" style={{ color: "var(--muted)" }}>Agents</Link>
          <WalletButton />
        </nav>
      </header>

      <section className="panel" style={{ marginTop: "1rem", padding: "2rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 700 }}>Two-Agent Handshake</h1>
        <p style={{ marginTop: "0.5rem", maxWidth: "640px", color: "var(--muted)" }}>
          Watch two SNSIP-Agents — A (<code>alice.sol</code>) and B (<code>bob.sol</code>)
          — resolve each other, exchange signed challenges, accrue reputation,
          and trigger an on-chain validation after 5 rounds. Each step is real
          Ed25519 cryptography; the on-chain reputation + validation calls
          activate when their respective programs are deployed.
        </p>
      </section>

      <div style={{ marginTop: "1.5rem" }}>
        <HandshakeTheatre />
      </div>
    </main>
  );
}
