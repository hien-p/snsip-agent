"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState, useCallback } from "react";
import {
  listOwnedDomains,
  resolveAgent,
  resolveDomainOwner,
  readRecordV2,
  ALL_AGENT_RECORD_KEYS,
  type ResolvedAgent,
} from "@snsip/agent-sdk";

export function useOwnedDomains() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [domains, setDomains] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!publicKey) {
      setDomains([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await listOwnedDomains(connection, publicKey);
      setDomains(list);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [connection, publicKey]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { domains, loading, error, refresh };
}

export function useResolveDomain(domain: string | null) {
  const { connection } = useConnection();
  const [owner, setOwner] = useState<string | null>(null);
  const [agent, setAgent] = useState<ResolvedAgent | null>(null);
  const [records, setRecords] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!domain) {
      setOwner(null);
      setAgent(null);
      setRecords({});
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const [ownerKey, agentRes, recordEntries] = await Promise.all([
          resolveDomainOwner(connection, domain).catch(() => null),
          resolveAgent(connection, domain),
          Promise.all(
            ALL_AGENT_RECORD_KEYS.map(async (k) => [k, await readRecordV2(connection, domain, k)] as const),
          ),
        ]);
        if (cancelled) return;
        setOwner(ownerKey?.toBase58() ?? null);
        setAgent(agentRes);
        setRecords(Object.fromEntries(recordEntries));
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [connection, domain]);

  return { owner, agent, records, loading, error };
}
