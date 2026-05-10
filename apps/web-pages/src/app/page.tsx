import Link from "next/link";
import { WalletButton } from "@/components/wallet-button";
import { SnsExplorer } from "@/components/sns-explorer";
import { MyDomains } from "@/components/my-domains";

export default function Home() {
  return (
    <main style={{ maxWidth: "1080px", margin: "0 auto", padding: "1.5rem" }}>
      <Header />
      <Hero />
      <div style={{ display: "grid", gap: "1.5rem", marginTop: "2rem" }}>
        <SnsExplorer />
        <MyDomains />
      </div>
      <Footer />
    </main>
  );
}

function Header() {
  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1rem 0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
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
      </div>
      <nav style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <Link href="/playground/verify" style={{ color: "var(--muted)" }}>
          Verifier
        </Link>
        <Link href="/playground/latency" style={{ color: "var(--muted)" }}>
          Latency
        </Link>
        <Link href="/playground/handshake" style={{ color: "var(--muted)" }}>
          Handshake
        </Link>
        <Link href="/agents" style={{ color: "var(--muted)" }}>
          Agents
        </Link>
        <WalletButton />
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section
      className="panel"
      style={{
        marginTop: "1rem",
        padding: "2.5rem",
        background: "linear-gradient(180deg, var(--panel) 0%, var(--panel-2) 100%)",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", fontWeight: 700, lineHeight: 1.1 }}>
        Verifiable AI agent identity for{" "}
        <span style={{ color: "var(--accent)" }}>.sol</span>
      </h1>
      <p style={{ marginTop: "1rem", maxWidth: "640px", color: "var(--muted)" }}>
        ENS shipped <a
          href="https://ens.domains/blog/post/ensip-25"
          target="_blank"
          rel="noreferrer"
          style={{ color: "var(--accent)" }}
        >
          ENSIP-25
        </a>{" "}
        for verifiable AI agent identity rooted in <code>.eth</code>. Solana clears 77% of
        x402 transaction volume but had no equivalent. SNSIP-Agent ports that standard to
        SNS records v2 — plus an{" "}
        <a
          href="https://ens.domains/blog/post/ens-ai-agent-erc8004"
          target="_blank"
          rel="noreferrer"
          style={{ color: "var(--accent)" }}
        >
          ERC-8004
        </a>
        -shaped trust stack (Identity, Reputation, Validation), with{" "}
        <a
          href="https://docs.magicblock.gg/"
          target="_blank"
          rel="noreferrer"
          style={{ color: "var(--accent)" }}
        >
          MagicBlock Ephemeral Rollups
        </a>{" "}
        for sub-50ms agent settlement.
      </p>
      <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <span className="tag">SNS records v2</span>
        <span className="tag">Anchor 0.30</span>
        <span className="tag">MagicBlock ER</span>
        <span className="tag">x402-compatible</span>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ marginTop: "3rem", padding: "1.5rem 0", color: "var(--muted)", fontSize: "0.875rem" }}>
      Submission for the SNS Identity Track — Colosseum Hackathon (Frontier).{" "}
      <a
        href="https://github.com/"
        target="_blank"
        rel="noreferrer"
        style={{ color: "var(--accent)" }}
      >
        Repo
      </a>
      {" · "}
      <Link href="/spec" style={{ color: "var(--accent)" }}>
        Read the spec
      </Link>
    </footer>
  );
}
