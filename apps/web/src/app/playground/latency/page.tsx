import { LatencyTheatre } from "@/components/latency-theatre";
import { SiteNav } from "@/components/site-nav";
import { PageHero } from "@/components/page-hero";

export default function LatencyPlaygroundPage() {
  return (
    <main style={{ maxWidth: "1080px", margin: "0 auto", padding: "1.5rem" }}>
      <SiteNav active="latency" />
      <PageHero
        badge="MagicBlock · Ephemeral Rollups"
        title={<>Solana L1 vs MagicBlock ER, side&#8209;by&#8209;side.</>}
        subtitle={
          <>
            Same transaction, two clusters. Tap, hold, or auto-tap × 25 — watch the gauge fill in real
            time and see how reputation accrues per cluster. Demo runs in <strong>preview mode</strong>{" "}
            (no-op transactions) until the reputation-registry program is deployed and the account is
            delegated to ER.
          </>
        }
      />
      <div style={{ marginTop: "1.5rem" }}>
        <LatencyTheatre />
      </div>
    </main>
  );
}
