"use client";

import { useSearchParams } from "next/navigation";
import { AgentGallery } from "./agent-gallery";
import { AgentProfile } from "./agent-profile";

// Picks gallery vs profile based on the ?domain= query parameter, so the
// route stays static-export-friendly (no [domain] dynamic segment).
export function AgentProfileGate() {
  const params = useSearchParams();
  const domain = params.get("domain");
  return domain ? <AgentProfile domain={domain} /> : <AgentGallery />;
}
