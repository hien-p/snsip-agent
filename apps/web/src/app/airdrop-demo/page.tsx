import { AirdropDemo } from "@/components/airdrop-demo";
import { SiteNav } from "@/components/site-nav";
import { PageHero } from "@/components/page-hero";
import { TourRibbon, TourFooter } from "@/components/tour-ribbon";

export default function AirdropDemoPage() {
  return (
    <main style={{ maxWidth: "1080px", margin: "0 auto", padding: "1.5rem" }}>
      <SiteNav active="airdrop" />
      <TourRibbon slug="airdrop" />
      <PageHero
        badge="Sybil-resistant claim"
        title={
          <>
            Airdrop only to{" "}
            <span style={{ color: "var(--accent-2)" }} className="serif-italic">verified</span> agents.
          </>
        }
        subtitle={
          <>
            We ask each candidate <code>.sol</code> for the same four things: an on-chain owner, a{" "}
            signing pubkey, an endpoint, and a structured permission JSON. Stub agents fail visibly,{" "}
            verified ones get a green claim button that fires a real Solana memo tx logging the claim.
          </>
        }
      />
      <div style={{ marginTop: "1.5rem" }}>
        <AirdropDemo />
      </div>
      <TourFooter slug="airdrop" />
    </main>
  );
}
