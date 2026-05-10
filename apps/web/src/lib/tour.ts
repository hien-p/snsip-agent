export interface TourStep {
  slug: "login" | "airdrop" | "swap" | "mcp";
  href: string;
  index: number;
  total: number;
  theme: string;
  whyItMatters: string;
  bountyAnchor: string;
}

export const TOUR: TourStep[] = [
  {
    slug: "login",
    href: "/login-demo",
    index: 1,
    total: 4,
    theme: "Social Identity",
    whyItMatters:
      "Your .sol replaces email + password. The wallet that owns the name signs a one-time challenge — that's the login.",
    bountyAnchor:
      "Reimagine .sol as the universal identity and login layer for Solana applications.",
  },
  {
    slug: "airdrop",
    href: "/airdrop-demo",
    index: 2,
    total: 4,
    theme: "Sybil resistance",
    whyItMatters:
      "Sybil farmers spawn 10k wallets in an hour but can't fake 10k .sol identities with valid records. The gate is identity, not balance.",
    bountyAnchor:
      "Solutions for sybil resistance in DAOs or airdrop campaigns using identity.",
  },
  {
    slug: "swap",
    href: "/swap-demo",
    index: 3,
    total: 4,
    theme: "Agent Identity",
    whyItMatters:
      "An agent's permission is scoped: only call X, only spend Y per period, only until Z. We read the JSON live and enforce it before the action lands.",
    bountyAnchor:
      "Build the onchain identity layer and source of trust using .sol for autonomous agent on Solana.",
  },
  {
    slug: "mcp",
    href: "/mcp",
    index: 4,
    total: 4,
    theme: "The integration",
    whyItMatters:
      "Same on-chain bytes, exposed via Model Context Protocol — Claude Desktop, Cursor, anything MCP-aware, can read .sol agent identity today. No custom integrations.",
    bountyAnchor:
      "AI agents with distinct on-chain identities — composable across the LLM client ecosystem.",
  },
];

export function tourStep(slug: TourStep["slug"]): TourStep {
  const step = TOUR.find((s) => s.slug === slug);
  if (!step) throw new Error(`Unknown tour step: ${slug}`);
  return step;
}

export function neighbors(slug: TourStep["slug"]): { prev: TourStep | null; next: TourStep | null } {
  const i = TOUR.findIndex((s) => s.slug === slug);
  return {
    prev: i > 0 ? TOUR[i - 1] : null,
    next: i < TOUR.length - 1 ? TOUR[i + 1] : null,
  };
}
