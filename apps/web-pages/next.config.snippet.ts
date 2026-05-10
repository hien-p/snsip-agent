// Replace your generated apps/web/next.config.ts with this after bootstrap.
// Static export targets Cloudflare Workers' static assets (see wrangler.toml).
//
// Limits to be aware of:
//   - No server actions, route handlers, middleware, or ISR.
//   - Dynamic routes need `generateStaticParams` (Day 5 will switch to
//     @opennextjs/cloudflare for /agents/[domain] if we want them live).
//
// For Day 1 (home page only, all client-side wallet/RPC) this is fine.

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  // Pin transpilation for the workspace SDK package so client imports don't
  // break under Next's dependency-tree analysis.
  transpilePackages: ["@snsip/agent-sdk"],
};

export default nextConfig;
