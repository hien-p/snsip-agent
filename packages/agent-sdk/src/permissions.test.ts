import { describe, it, expect } from "vitest";
import {
  isActive,
  isExpired,
  isStarted,
  parsePermission,
  permitsCall,
  serializePermission,
  spendCapFor,
  type AgentPermission,
} from "./permissions.js";

const sample: AgentPermission = {
  agent: "AAAA1111",
  parent: "BBBB2222",
  label: "trader",
  start: 1_000,
  expiresAt: 2_000,
  calls: [
    { target: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4", selector: "0a1b2c3d4e5f6789" },
    { target: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" }, // wildcard method
  ],
  spends: [
    { mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", allowance: "100000000", periodSeconds: 86_400 },
  ],
};

describe("serializePermission / parsePermission", () => {
  it("round-trips", () => {
    const json = serializePermission(sample);
    expect(parsePermission(json)).toEqual(sample);
  });

  it("rejects unknown schema versions", () => {
    expect(() => parsePermission(JSON.stringify({ ...sample, v: 99 }))).toThrow(/version/);
  });

  it("rejects missing fields", () => {
    expect(() => parsePermission(JSON.stringify({ v: 1, agent: "x" }))).toThrow(/required/);
  });
});

describe("time gates", () => {
  it("isStarted true if no start", () => {
    expect(isStarted({ ...sample, start: undefined }, 0)).toBe(true);
  });

  it("isStarted false before start, true at/after", () => {
    expect(isStarted(sample, 999)).toBe(false);
    expect(isStarted(sample, 1_000)).toBe(true);
    expect(isStarted(sample, 1_500)).toBe(true);
  });

  it("isExpired false if no expiry", () => {
    expect(isExpired({ ...sample, expiresAt: undefined }, 9_999_999)).toBe(false);
  });

  it("isExpired true at/after expiry", () => {
    expect(isExpired(sample, 1_999)).toBe(false);
    expect(isExpired(sample, 2_000)).toBe(true);
    expect(isExpired(sample, 2_500)).toBe(true);
  });

  it("isActive only inside [start, expiresAt)", () => {
    expect(isActive(sample, 999)).toBe(false);
    expect(isActive(sample, 1_500)).toBe(true);
    expect(isActive(sample, 2_000)).toBe(false);
  });
});

describe("permitsCall", () => {
  // sample's window is [1000, 2000). Pass an explicit nowSec inside the window.
  const inWindow = 1_500;
  const afterWindow = 2_500;

  it("matches exact selector", () => {
    expect(permitsCall(sample, "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4", "0a1b2c3d4e5f6789", inWindow)).toBe(true);
  });

  it("rejects wrong selector even on allowed target", () => {
    expect(permitsCall(sample, "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4", "deadbeef00000000", inWindow)).toBe(false);
  });

  it("wildcard method (no selector on rule) permits calls with any selector to that target", () => {
    expect(permitsCall(sample, "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", "anyhex", inWindow)).toBe(true);
    expect(permitsCall(sample, "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", undefined, inWindow)).toBe(true);
  });

  it("rejects when expired", () => {
    expect(permitsCall(sample, "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4", "0a1b2c3d4e5f6789", afterWindow)).toBe(false);
  });
});

describe("spendCapFor", () => {
  it("finds the limit by mint", () => {
    expect(spendCapFor(sample, "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")?.allowance).toBe("100000000");
  });

  it("returns undefined for unlisted mint", () => {
    expect(spendCapFor(sample, "ZZZ")).toBeUndefined();
  });
});
