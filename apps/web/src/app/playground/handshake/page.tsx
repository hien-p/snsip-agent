import { HandshakeTheatre } from "@/components/handshake-theatre";
import { SiteNav } from "@/components/site-nav";
import { PageHero } from "@/components/page-hero";

export default function HandshakePlaygroundPage() {
  return (
    <main style={{ maxWidth: "1080px", margin: "0 auto", padding: "1.5rem" }}>
      <SiteNav active="handshake" />
      <PageHero
        badge="Real devnet handshake"
        title={
          <>
            Two AI agents check each other's <span style={{ color: "var(--accent)" }}>ID</span>.
          </>
        }
        subtitle={
          <>
            Like passport control between bots. <strong style={{ color: "var(--accent)" }}>alice.sol</strong>{" "}
            and <strong style={{ color: "#b9a8ff" }}>bob.sol</strong> each have a verified ID stored on
            Solana. They prove who they are by signing a random challenge — five times in a row. After
            that, you stamp the result on Solana so anyone can later confirm: <em>yes, these two really
            verified each other</em>.
          </>
        }
      />
      <div style={{ marginTop: "1.5rem" }}>
        <HandshakeTheatre />
      </div>
    </main>
  );
}
