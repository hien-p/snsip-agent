// Dune SIM API — typed wrapper for the two SVM endpoints we care about.
//
// SIM provides real-time on-chain activity (balances + transactions) for
// SVM and 60+ EVM chains via a single API key. We use it as the
// authoritative source for an agent's live mainnet activity, so the
// reputation / activity panels reflect actual on-chain truth instead
// of just user-submitted memos.
//
// SVM endpoints are MAINNET-only as of beta (no devnet support per the
// Dune docs). When the dApp is on devnet, the UI can either accept a
// mainnet wallet override or label the data accordingly.
//
// API key: set `SIM_API_KEY` in env (server / MCP) or pass directly to
// the helpers (browser, with care). Get a key at https://sim.dune.com.

const SIM_BASE = "https://api.sim.dune.com";

export interface SimTokenBalance {
  chain: string;
  address: string;
  amount: string;        // human-decimal as string (preserves precision)
  balance: string;
  raw_balance: string;
  value_usd: number;
  program_id: string | null;
  decimals: number;
  total_supply: string;
  name: string;
  symbol: string;
  uri: string | null;
  price_usd: number;
  liquidity_usd: number;
  pool_type: string | null;
  pool_address: string | null;
  mint_authority: string | null;
}

export interface SimBalancesResponse {
  processing_time_ms: number;
  wallet_address: string;
  next_offset: string | null;
  balances_count: number;
  balances: SimTokenBalance[];
}

export interface SimTransaction {
  address: string;
  block_slot: number;
  block_time: number;
  chain: string;
  raw_transaction: unknown;
}

export interface SimTransactionsResponse {
  next_offset: string | null;
  transactions: SimTransaction[];
}

export interface SimOptions {
  apiKey: string;
  baseUrl?: string;          // override for tests
  fetchImpl?: typeof fetch;  // for SSR / Node before global fetch
}

function client(opts: SimOptions) {
  const f = opts.fetchImpl ?? fetch;
  const base = opts.baseUrl ?? SIM_BASE;
  return async <T>(path: string, query: Record<string, string | number | undefined>): Promise<T> => {
    const url = new URL(path, base);
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
    const res = await f(url.toString(), {
      headers: {
        "X-Sim-Api-Key": opts.apiKey,
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`SIM ${path} ${res.status}: ${body.slice(0, 240)}`);
    }
    return (await res.json()) as T;
  };
}

// SVM balances — mainnet only.
export async function simSvmBalances(
  wallet: string,
  opts: SimOptions & { limit?: number; chains?: string },
): Promise<SimBalancesResponse> {
  return client(opts)<SimBalancesResponse>(`/beta/svm/balances/${wallet}`, {
    limit: opts.limit ?? 100,
    chains: opts.chains ?? "solana",
  });
}

// SVM transactions — mainnet only. Cursor-paginated.
export async function simSvmTransactions(
  wallet: string,
  opts: SimOptions & { limit?: number; offset?: string },
): Promise<SimTransactionsResponse> {
  return client(opts)<SimTransactionsResponse>(`/beta/svm/transactions/${wallet}`, {
    limit: opts.limit ?? 50,
    offset: opts.offset,
  });
}

// Aggregate helpers used by the UI / MCP — not strictly needed but
// they keep call sites clean.

export interface AgentActivitySnapshot {
  wallet: string;
  txCount30d: number;
  lastSeenSecondsAgo: number | null;   // null if no transactions
  totalUsdHeld: number;
  topTokens: { symbol: string; amount: string; valueUsd: number }[];
}

export async function getAgentActivitySnapshot(
  wallet: string,
  opts: SimOptions,
): Promise<AgentActivitySnapshot> {
  const [bal, txs] = await Promise.all([
    simSvmBalances(wallet, { ...opts, limit: 50 }),
    simSvmTransactions(wallet, { ...opts, limit: 100 }),
  ]);

  const nowSec = Math.floor(Date.now() / 1000);
  const cutoff30d = nowSec - 30 * 86_400;
  const txCount30d = txs.transactions.filter((t) => t.block_time >= cutoff30d).length;
  const firstTx = txs.transactions[0];
  const lastSeenSecondsAgo = firstTx ? nowSec - firstTx.block_time : null;

  const totalUsdHeld = bal.balances.reduce((sum, b) => sum + (b.value_usd ?? 0), 0);
  const topTokens = bal.balances
    .filter((b) => b.value_usd > 0.01)
    .sort((a, b) => b.value_usd - a.value_usd)
    .slice(0, 5)
    .map((b) => ({ symbol: b.symbol || "?", amount: b.amount, valueUsd: b.value_usd }));

  return { wallet, txCount30d, lastSeenSecondsAgo, totalUsdHeld, topTokens };
}
