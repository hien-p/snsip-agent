import { defineConfig } from "tsup";

// Bundle for npm publish:
// - Input: src/server.ts
// - Output: dist/server.js (single self-contained ESM file with shebang)
// - The workspace dep `@snsip/agent-sdk` is bundled in (noExternal),
//   so the published package has no @snsip/* runtime dep on npm.
// - Heavy runtime deps stay external (@solana/web3.js, @modelcontextprotocol/sdk, etc.)
//   so they install from npm normally and aren't duplicated.
export default defineConfig({
  entry: ["src/server.ts"],
  format: ["esm"],
  target: "node20",
  outDir: "dist",
  clean: true,
  dts: false,
  sourcemap: true,
  splitting: false,
  shims: true,
  // shebang lives in src/server.ts — don't duplicate it here
  // Inline the workspace SDK so the npm package is self-contained
  noExternal: ["@snsip/agent-sdk"],
  // Keep heavy runtime deps as external — they'll resolve via npm
  external: [
    "@modelcontextprotocol/sdk",
    "@solana/web3.js",
    "@bonfida/spl-name-service",
    "@bonfida/sns-records",
    "tweetnacl",
    "bs58",
    "zod",
  ],
});
