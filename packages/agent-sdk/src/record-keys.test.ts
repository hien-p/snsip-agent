import { describe, it, expect } from "vitest";
import {
  agentRegistrationKey,
  parseAgentRegistrationKey,
  RECORD_AGENT_REGISTRATION,
} from "./record-keys.js";

describe("agentRegistrationKey", () => {
  it("formats the bracket-notation key with a base58 registry and numeric agentId", () => {
    const k = agentRegistrationKey("7qVABCDxyz", 42n);
    expect(k).toBe("agent-registration[7qVABCDxyz][42]");
  });

  it("accepts number, bigint, and string for agentId", () => {
    expect(agentRegistrationKey("R", 1)).toBe("agent-registration[R][1]");
    expect(agentRegistrationKey("R", 1n)).toBe("agent-registration[R][1]");
    expect(agentRegistrationKey("R", "1")).toBe("agent-registration[R][1]");
  });

  it("uses the canonical prefix", () => {
    expect(agentRegistrationKey("R", 0).startsWith(RECORD_AGENT_REGISTRATION)).toBe(true);
  });
});

describe("parseAgentRegistrationKey", () => {
  it("round-trips with agentRegistrationKey", () => {
    const key = agentRegistrationKey("7qVABCDxyz", 42n);
    const parsed = parseAgentRegistrationKey(key);
    expect(parsed).toEqual({ registry: "7qVABCDxyz", agentId: 42n });
  });

  it("returns null for keys that don't match the bracket pattern", () => {
    expect(parseAgentRegistrationKey("avatar")).toBeNull();
    expect(parseAgentRegistrationKey("agent-registration")).toBeNull();
    expect(parseAgentRegistrationKey("agent-registration[R]")).toBeNull();
    expect(parseAgentRegistrationKey("agent-registration[R][not-a-number]")).toBeNull();
  });

  it("parses the ENSIP-25 example shape (ERC-7930 cross-chain registry)", () => {
    const key = "agent-registration[0x000100000101148004a169fb4a3325136eb29fa0ceb6d2e539a432][42]";
    const parsed = parseAgentRegistrationKey(key);
    expect(parsed?.registry).toBe(
      "0x000100000101148004a169fb4a3325136eb29fa0ceb6d2e539a432",
    );
    expect(parsed?.agentId).toBe(42n);
  });
});
