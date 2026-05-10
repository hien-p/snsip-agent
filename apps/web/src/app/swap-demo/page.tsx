import { SwapDemo } from "@/components/swap-demo";
import { SiteNav } from "@/components/site-nav";
import { PageHero } from "@/components/page-hero";
import { TourRibbon, TourFooter } from "@/components/tour-ribbon";

export default function SwapDemoPage() {
  return (
    <main style={{ maxWidth: "1080px", margin: "0 auto", padding: "1.5rem" }}>
      <SiteNav active="swap" />
      <TourRibbon slug="swap" />
      <PageHero
        badge="Permission-gated action"
        title={
          <>
            Agent uses its{" "}
            <span style={{ color: "var(--accent-2)" }} className="serif-italic">scoped</span> permission
            to swap.
          </>
        }
        subtitle={
          <>
            Pick an agent, a target program, and an amount. We read the agent's{" "}
            <code>agent.capabilities</code> permission JSON live from devnet, run the same checks a real{" "}
            relayer would (allowed call · within spend cap · not expired), and then either fire a real{" "}
            Solana memo logging the gated action — or visibly reject.
          </>
        }
      />
      <div style={{ marginTop: "1.5rem" }}>
        <SwapDemo />
      </div>
      <TourFooter slug="swap" />
    </main>
  );
}
