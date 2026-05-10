import { VerifyPlayground } from "@/components/verify-playground";
import Link from "next/link";
import { WalletButton } from "@/components/wallet-button";

export default function VerifyPlaygroundPage() {
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
          <span
            style={{
              display: "inline-block",
              width: "0.625rem",
              height: "0.625rem",
              borderRadius: "999px",
              background: "var(--accent)",
            }}
          />
          <strong>SNSIP-Agent</strong>
          <span className="tag" style={{ marginLeft: "0.5rem" }}>devnet</span>
        </Link>
        <nav style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Link href="/playground/verify" style={{ color: "var(--accent)" }}>Verifier</Link>
          <Link href="/playground/latency" style={{ color: "var(--muted)" }}>Latency</Link>
          <Link href="/playground/handshake" style={{ color: "var(--muted)" }}>Handshake</Link>
          <Link href="/agents" style={{ color: "var(--muted)" }}>Agents</Link>
          <WalletButton />
        </nav>
      </header>

      <section className="panel" style={{ marginTop: "1rem", padding: "2rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 700 }}>Verifier Playground</h1>
        <p style={{ marginTop: "0.5rem", maxWidth: "640px", color: "var(--muted)" }}>
          Sign a fresh challenge with an agent's signing key, then verify the
          signature against the agent's <code>agent.signing-pubkey</code> record. Toggle
          <strong> Tamper</strong> to mutate one byte and watch the verifier reject it
          live. Local verify is Ed25519-equivalent to the on-chain check.
        </p>
      </section>

      <div style={{ marginTop: "1.5rem" }}>
        <VerifyPlayground />
      </div>
    </main>
  );
}
