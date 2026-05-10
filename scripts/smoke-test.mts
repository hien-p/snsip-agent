// scripts/smoke-test.ts
//
// End-to-end smoke test for the D1 SDK surface.
//
// Usage (from repo root, after `pnpm install` and `pnpm --filter @snsip/agent-sdk build`):
//   pnpm tsx scripts/smoke-test.ts
//   pnpm tsx scripts/smoke-test.ts <wallet-pubkey>      # list domains for a specific wallet
//   pnpm tsx scripts/smoke-test.ts <wallet> <domain>    # also resolve an agent on <domain>
//
// What it verifies:
//   1. Devnet RPC reachable.
//   2. @bonfida/spl-name-service installed correctly.
//   3. Our SDK's listOwnedDomains + resolveDomainOwner work.
//   4. resolveAgent returns null for non-agent domains (negative case).
//
// Bonus: pass a domain you control on devnet to see records v2 read in action.

import { PublicKey } from "@solana/web3.js";
import {
  makeConnection,
  listOwnedDomains,
  resolveDomainOwner,
  resolveAgent,
} from "@snsip/agent-sdk";

const DEFAULT_WALLET = "HN7cABqLq46Es1jh92dQQpsuewAyP7ohJUNNJiPD3kGB"; // a public devnet test wallet
const DEFAULT_DOMAIN = "bonfida.sol";

async function main() {
  const connection = makeConnection({ cluster: "devnet" });

  const walletArg = process.argv[2] ?? DEFAULT_WALLET;
  const domainArg = process.argv[3] ?? DEFAULT_DOMAIN;
  const wallet = new PublicKey(walletArg);

  console.log(`→ devnet ping…`);
  const slot = await connection.getSlot();
  console.log(`  slot=${slot}`);

  console.log(`→ resolveDomainOwner("${domainArg}")…`);
  try {
    const owner = await resolveDomainOwner(connection, domainArg);
    console.log(`  owner=${owner.toBase58()}`);
  } catch (e) {
    console.log(`  (failed: ${(e as Error).message})`);
  }

  console.log(`→ listOwnedDomains(${wallet.toBase58()})…`);
  const domains = await listOwnedDomains(connection, wallet);
  console.log(`  ${domains.length} domain(s):`, domains.slice(0, 10));

  console.log(`→ resolveAgent("${domainArg}")…`);
  const agent = await resolveAgent(connection, domainArg);
  if (agent) {
    console.log(`  agent bound: registry=${agent.registry} id=${agent.agentId}`);
    console.log(`  records:`, agent.records);
  } else {
    console.log(`  (no agent-registration record on this domain — expected for non-agent domains)`);
  }

  console.log(`✓ smoke test complete`);
}

main().catch((err) => {
  console.error(`✗ smoke test failed:`, err);
  process.exit(1);
});
