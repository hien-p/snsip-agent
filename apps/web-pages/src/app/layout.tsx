import type { Metadata } from "next";
import "./globals.css";
import { WalletContextProvider } from "@/components/wallet-provider";

export const metadata: Metadata = {
  title: "SNSIP-Agent — Verifiable AI Agent Identity for .sol",
  description:
    "ENSIP-25 ported to Solana. Verifiable agent identity rooted in .sol, with on-chain reputation and validation.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <WalletContextProvider>{children}</WalletContextProvider>
      </body>
    </html>
  );
}
