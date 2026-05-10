import { Connection, type Commitment } from "@solana/web3.js";

export type Cluster = "devnet" | "mainnet-beta" | "magicblock-devnet";

const CLUSTER_URLS: Record<Cluster, string> = {
  devnet: "https://api.devnet.solana.com",
  "mainnet-beta": "https://api.mainnet-beta.solana.com",
  // Magic Router auto-decides L1 vs Ephemeral Rollup. Use this for D3.
  "magicblock-devnet": "https://devnet-router.magicblock.app",
};

export interface ClientOptions {
  cluster?: Cluster;
  endpoint?: string;
  commitment?: Commitment;
}

export function makeConnection(opts: ClientOptions = {}): Connection {
  const url = opts.endpoint ?? CLUSTER_URLS[opts.cluster ?? "devnet"];
  return new Connection(url, opts.commitment ?? "confirmed");
}
