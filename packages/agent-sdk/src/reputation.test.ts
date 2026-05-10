import { describe, it, expect } from "vitest";
import { PublicKey } from "@solana/web3.js";
import {
  rollingStats,
  timeAsync,
  noopTransferIx,
  isProgramDeployed,
  REPUTATION_PROGRAM_PLACEHOLDER,
  type LatencySample,
} from "./reputation.js";

describe("rollingStats", () => {
  it("returns nulls on empty input", () => {
    const stats = rollingStats([]);
    expect(stats.count).toBe(0);
    expect(stats.last).toBeNull();
    expect(stats.avg).toBeNull();
    expect(stats.p95).toBeNull();
  });

  it("computes count, last, avg, p95", () => {
    const samples: LatencySample[] = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(
      (latencyMs) => ({ latencyMs, cluster: "l1" as const, sentAt: 0 }),
    );
    const stats = rollingStats(samples);
    expect(stats.count).toBe(10);
    expect(stats.last).toBe(100);
    expect(stats.avg).toBe(55);
    // p95 of [10..100] sorted is at index floor(10 * 0.95) = 9 → 100
    expect(stats.p95).toBe(100);
  });
});

describe("timeAsync", () => {
  it("measures wall-time of an async fn", async () => {
    const { result, latencyMs } = await timeAsync(async () => {
      await new Promise((r) => setTimeout(r, 30));
      return "ok";
    });
    expect(result).toBe("ok");
    // Allow a fairly wide tolerance — CI clocks vary.
    expect(latencyMs).toBeGreaterThanOrEqual(20);
    expect(latencyMs).toBeLessThan(500);
  });
});

describe("noopTransferIx", () => {
  it("encodes SystemProgram::Transfer { lamports: 0 }", () => {
    const payer = PublicKey.default;
    const ix = noopTransferIx(payer);
    expect(ix.programId.toBase58()).toBe("11111111111111111111111111111111");
    expect(ix.keys).toHaveLength(2);
    expect(ix.data.length).toBe(12);
    expect(ix.data.readUInt32LE(0)).toBe(2); // Transfer discriminator
    expect(ix.data.readBigUInt64LE(4)).toBe(0n);
  });
});

describe("isProgramDeployed", () => {
  it("treats the placeholder as not-deployed", () => {
    expect(isProgramDeployed(REPUTATION_PROGRAM_PLACEHOLDER)).toBe(false);
    expect(isProgramDeployed("")).toBe(false);
  });

  it("treats any other id as deployed", () => {
    expect(isProgramDeployed("ABCxyz123")).toBe(true);
  });
});
