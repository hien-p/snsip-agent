"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

// Tiny client-only wrapper so we can drop it into server components.
export function WalletButton() {
  return <WalletMultiButton />;
}
