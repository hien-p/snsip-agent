"use client";

import { useEffect } from "react";
import Link from "next/link";

// Short-URL redirect — /install → /mcp. Memorable share link
// (snsip-cc5.pages.dev/install) for DMs, X, decks without locking
// people into the canonical /mcp route.
export default function InstallRedirect() {
  useEffect(() => {
    window.location.replace("/mcp");
  }, []);

  return (
    <main
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <p style={{ fontSize: "1rem", color: "var(--muted)" }}>Redirecting to install instructions…</p>
      <Link href="/mcp" style={{ color: "var(--accent)", fontWeight: 600 }}>
        Continue to /mcp →
      </Link>
    </main>
  );
}
