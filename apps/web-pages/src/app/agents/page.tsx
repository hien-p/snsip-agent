import Link from "next/link";
import { Suspense } from "react";
import { AgentGallery } from "@/components/agent-gallery";
import { AgentProfileGate } from "@/components/agent-profile-gate";
import { WalletButton } from "@/components/wallet-button";

// Static-export-friendly "/agents" route. When ?domain=... is present
// we render the profile inline instead of the gallery. Avoids the
// `[domain]` dynamic route that would require generateStaticParams.
export default function AgentsPage() {
  return (
    <main style={{ maxWidth: "1080px", margin: "0 auto", padding: "1.5rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 0" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", color: "var(--text)" }}>
          <span style={{ display: "inline-block", width: "0.625rem", height: "0.625rem", borderRadius: "999px", background: "var(--accent)" }} />
          <strong>SNSIP-Agent</strong>
          <span className="tag" style={{ marginLeft: "0.5rem" }}>devnet</span>
        </Link>
        <nav style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Link href="/playground/verify" style={{ color: "var(--muted)" }}>Verifier</Link>
          <Link href="/playground/latency" style={{ color: "var(--muted)" }}>Latency</Link>
          <Link href="/playground/handshake" style={{ color: "var(--muted)" }}>Handshake</Link>
          <Link href="/agents" style={{ color: "var(--accent)" }}>Agents</Link>
          <WalletButton />
        </nav>
      </header>

      <Suspense fallback={<div className="panel">Loading…</div>}>
        <AgentProfileGate />
      </Suspense>
    </main>
  );
}
