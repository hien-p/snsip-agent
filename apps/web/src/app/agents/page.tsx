import { Suspense } from "react";
import { AgentProfileGate } from "@/components/agent-profile-gate";
import { SiteNav } from "@/components/site-nav";

// Static-export-friendly "/agents" route. When ?domain=... is present
// we render the profile inline instead of the gallery.
export default function AgentsPage() {
  return (
    <main style={{ maxWidth: "1080px", margin: "0 auto", padding: "1.5rem" }}>
      <SiteNav active="agents" />
      <Suspense fallback={<div className="panel" style={{ marginTop: "1.5rem" }}>Loading…</div>}>
        <div style={{ marginTop: "1.5rem" }}>
          <AgentProfileGate />
        </div>
      </Suspense>
    </main>
  );
}
