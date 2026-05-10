export function shortPubkey(s: string, head = 4, tail = 4): string {
  if (s.length <= head + tail + 1) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

export function explorerTx(sig: string, cluster: "devnet" | "mainnet-beta" = "devnet"): string {
  return `https://explorer.solana.com/tx/${sig}?cluster=${cluster}`;
}

export function explorerAddress(addr: string, cluster: "devnet" | "mainnet-beta" = "devnet"): string {
  return `https://explorer.solana.com/address/${addr}?cluster=${cluster}`;
}

export function isValidDomain(input: string): boolean {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return false;
  // Reject if it has unsupported chars; allow [a-z0-9.-_]
  if (!/^[a-z0-9._-]+$/.test(trimmed)) return false;
  return true;
}

export function normalizeDomain(input: string): string {
  const t = input.trim().toLowerCase();
  return t.endsWith(".sol") ? t : `${t}.sol`;
}
