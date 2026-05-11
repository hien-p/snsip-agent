import { SiteNav } from "@/components/site-nav";
import { PageHero } from "@/components/page-hero";
import { SocialGraph } from "@/components/social-graph";

export default function GraphPage() {
  return (
    <main style={{ maxWidth: "1080px", margin: "0 auto", padding: "1.5rem" }}>
      <SiteNav active="graph" />
      <PageHero
        badge="Social graph · visualizer"
        title={
          <>
            Five <span style={{ color: "var(--accent-2)" }} className="serif-italic">.sol</span> agents.
            One owner. All on Solana.
          </>
        }
        subtitle={
          <>
            A force-laid constellation of the demo wallet's agents and what each one publishes
            on-chain. Same data any Solana RPC will return — rendered as a graph so a judge can
            see the identity layer in one frame.
          </>
        }
      />
      <div style={{ marginTop: "1.5rem" }}>
        <SocialGraph />
      </div>
    </main>
  );
}
