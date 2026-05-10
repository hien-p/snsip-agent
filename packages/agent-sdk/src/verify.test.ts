import { describe, it, expect } from "vitest";
import nacl from "tweetnacl";
import bs58 from "bs58";
import {
  bytesToHex,
  hexToBytes,
  generateNonce,
  localSignMessage,
  localVerifySignature,
  tamperByte,
  decodeSignatureBase58,
  decodePubkeyBase58,
} from "./verify.js";

function newAgentKp() {
  const kp = nacl.sign.keyPair();
  return {
    sk: bs58.encode(kp.secretKey),
    pk: bs58.encode(kp.publicKey),
  };
}

describe("hex helpers", () => {
  it("round-trips bytes", () => {
    const bytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef, 0x01]);
    expect(hexToBytes(bytesToHex(bytes))).toEqual(bytes);
  });

  it("accepts 0x prefix", () => {
    expect(hexToBytes("0xdeadbeef")).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
  });

  it("rejects odd-length hex", () => {
    expect(() => hexToBytes("0xabc")).toThrow();
  });
});

describe("generateNonce", () => {
  it("returns the requested length", () => {
    expect(generateNonce(32).length).toBe(32);
    expect(generateNonce(16).length).toBe(16);
  });

  it("is non-deterministic across calls", () => {
    const a = generateNonce();
    const b = generateNonce();
    expect(bytesToHex(a)).not.toBe(bytesToHex(b));
  });
});

describe("localSignMessage / localVerifySignature", () => {
  it("verifies a valid signature", () => {
    const { sk, pk } = newAgentKp();
    const msg = "hello, agent";
    const { signatureBase58, pubkeyBase58 } = localSignMessage(sk, msg);
    expect(pubkeyBase58).toBe(pk);
    expect(localVerifySignature(pubkeyBase58, msg, signatureBase58)).toBe(true);
  });

  it("rejects a mismatched pubkey", () => {
    const a = newAgentKp();
    const b = newAgentKp();
    const { signatureBase58 } = localSignMessage(a.sk, "x");
    expect(localVerifySignature(b.pk, "x", signatureBase58)).toBe(false);
  });

  it("rejects a tampered message", () => {
    const { sk } = newAgentKp();
    const msg = new Uint8Array([1, 2, 3, 4, 5]);
    const { signatureBase58, pubkeyBase58 } = localSignMessage(sk, msg);
    expect(localVerifySignature(pubkeyBase58, msg, signatureBase58)).toBe(true);
    expect(localVerifySignature(pubkeyBase58, tamperByte(msg, 0), signatureBase58)).toBe(false);
  });

  it("rejects a malformed signature gracefully (no throw)", () => {
    const { pk } = newAgentKp();
    expect(localVerifySignature(pk, "x", "not-base58!!!")).toBe(false);
  });
});

describe("decode helpers", () => {
  it("decodes a 32-byte pubkey", () => {
    const { pk } = newAgentKp();
    expect(decodePubkeyBase58(pk).length).toBe(32);
  });

  it("rejects wrong-length pubkey", () => {
    expect(() => decodePubkeyBase58(bs58.encode(new Uint8Array(31)))).toThrow();
  });

  it("decodes a 64-byte signature", () => {
    const { sk } = newAgentKp();
    const { signatureBase58 } = localSignMessage(sk, "x");
    expect(decodeSignatureBase58(signatureBase58).length).toBe(64);
  });
});
