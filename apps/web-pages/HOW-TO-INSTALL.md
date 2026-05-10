# Installing the D1 dashboard pages

This directory holds Next.js source files that are ready to drop into
`apps/web/` once you've bootstrapped it with `create-next-app`.

## Step 1 — bootstrap the Next.js app (one time)

```bash
cd /Users/harryphan/Documents/dev/soldev/sns_prj
pnpm create next-app@latest apps/web \
  --ts --tailwind --app --src-dir \
  --import-alias "@/*" --use-pnpm --yes
```

## Step 2 — copy these files into apps/web

```bash
# from repo root

# components + lib
cp -R apps/web-pages/src/components apps/web/src/components
cp -R apps/web-pages/src/lib        apps/web/src/lib

# app routes (D1 home + D2 verify + D3 latency + D4 handshake + D5 agents)
cp    apps/web-pages/src/app/layout.tsx                      apps/web/src/app/layout.tsx
cp    apps/web-pages/src/app/page.tsx                        apps/web/src/app/page.tsx
mkdir -p                                                     apps/web/src/app/playground/verify
cp    apps/web-pages/src/app/playground/verify/page.tsx      apps/web/src/app/playground/verify/page.tsx
mkdir -p                                                     apps/web/src/app/playground/latency
cp    apps/web-pages/src/app/playground/latency/page.tsx     apps/web/src/app/playground/latency/page.tsx
mkdir -p                                                     apps/web/src/app/playground/handshake
cp    apps/web-pages/src/app/playground/handshake/page.tsx   apps/web/src/app/playground/handshake/page.tsx
mkdir -p                                                     apps/web/src/app/agents
cp    apps/web-pages/src/app/agents/page.tsx                 apps/web/src/app/agents/page.tsx

# styles
cat   apps/web-pages/src/app/globals.css.append >> apps/web/src/app/globals.css
```

## Step 3 — add deps to apps/web/package.json

Edit `apps/web/package.json`:

```jsonc
{
  "name": "@snsip/web",
  "dependencies": {
    "@bonfida/spl-name-service": "^3.0.5",
    "@snsip/agent-sdk": "workspace:*",
    "@solana/wallet-adapter-base": "^0.9.27",
    "@solana/wallet-adapter-react": "^0.15.39",
    "@solana/wallet-adapter-react-ui": "^0.9.39",
    "@solana/wallet-adapter-wallets": "^0.19.37",
    "@solana/web3.js": "^1.98.0",
    "bs58": "^6.0.0"
  }
}
```

(Keep the React/Next.js deps the generator gave you.)

## Step 4 — replace next.config.ts for static export (Cloudflare-ready)

```bash
cp apps/web-pages/next.config.snippet.ts apps/web/next.config.ts
```

This sets `output: "export"` so `pnpm --filter @snsip/web build` emits
static HTML/JS into `apps/web/out/`, which `wrangler.toml` serves via
Cloudflare Workers Static Assets.

## Step 5 — install + run

```bash
pnpm install
pnpm dev --filter=@snsip/web
# open http://localhost:3000
```

## Step 6 — preview the production build locally with wrangler

```bash
pnpm --filter @snsip/web build
npx wrangler dev
# open http://localhost:8787 (matches what Cloudflare will serve)
```

## Step 7 — deploy to Cloudflare

The repo includes `.github/workflows/deploy.yml` — push to `main` and it
deploys via `wrangler deploy`. Add two repo secrets in
**Settings → Secrets and variables → Actions**:

- `CLOUDFLARE_API_TOKEN` — token with **Workers Scripts: Edit** + **Account: Read** scopes
- `CLOUDFLARE_ACCOUNT_ID` — your Cloudflare account ID

To deploy manually:
```bash
pnpm --filter @snsip/web build
npx wrangler deploy
```

## What you should see

1. Hero with the SNSIP-Agent pitch and a "Connect Wallet" button.
2. **Resolve any .sol** — paste `bonfida.sol` and see records render.
3. **My Domains** (after connect) — your devnet `.sol` list, with a
   "Create Agent Subdomain" button next to each.
4. **Create Agent Wizard** — modal flow that builds and submits the tx.
   Will throw a clear "not implemented" error at the final step until
   you wire `writeRecordV2Ix` and `createAgentSubdomainIx` in
   `packages/agent-sdk/src/{records,subdomain}.ts` (D1 morning task).

## Once the SDK stubs are wired

Re-run the wizard. End-to-end should be:
- Pick parent .sol → enter "myagent" → confirm → wallet pops → tx confirms
- New `myagent.<parent>.sol` appears in My Domains
- Records `agent-registration[<placeholder>]`, `agent.signing-pubkey`,
  `agent.endpoint`, `agent.capabilities` set with starter values
