import Link from "next/link";
import { LatencyTheatre } from "@/components/latency-theatre";
import { WalletButton } from "@/components/wallet-button";

export default function LatencyPlaygroundPage() {
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
          <Link href="/playground/verify" style={{ color: "var(--muted)" }}>Verifier</Link>
          <Link href="/playground/latency" style={{ color: "var(--accent)" }}>Latency</Link>
          <Link href="/playground/handshake" style={{ color: "var(--muted)" }}>Handshake</Link>
          <Link href="/agents" style={{ color: "var(--muted)" }}>Agents</Link>
          <WalletButton />
        </nav>
      </header>

      <section className="panel" style={{ marginTop: "1rem", padding: "2rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: 700 }}>Latency Theatre</h1>
        <p style={{ marginTop: "0.5rem", maxWidth: "640px", color: "var(--muted)" }}>
          Side-by-side: same operation on Solana L1 vs MagicBlock Ephemeral
          Rollups. Tap, hold, or auto-tap × 25 — watch the gauge fill in real
          time and see how reputation accrues per cluster. Demo runs in PREVIEW
          mode (no-op transactions) until the reputation-registry program is
          deployed and the account is delegated to ER.
        </p>
      </section>

      <div style={{ marginTop: "1.5rem" }}>
        <LatencyTheatre />
      </div>
    </main>
  );
}
