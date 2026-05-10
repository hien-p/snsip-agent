const { Connection } = require('@solana/web3.js');

const MEMO_PROGRAM = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';

const ENTRIES = [
  {
    n: 1,
    interaction: 'Sign-in',
    sig: '5q734ioGY5B3Y15VnutLCfYdLtBNXVo2oKfQ667kjPLurjXbmdYF4UgiKq3mPPopxMCqxUqWDppVXFWmQwb3FTbY',
    expected: 'SNSIP-Login v1 · domain=swap-bot.sol · wallet=6AcSwibbv26kg7qAB28CXCAH2jSbSK39SeM5KuArjEt · t=2026-05-09T04:28:00.471Z',
  },
  {
    n: 2,
    interaction: 'Airdrop',
    sig: '5KtjMu6jtcnsdZd3z9qg2XcNhmRr4LRM1LoGAoLznK5BGcUNBYp1wkDrt9tz5i3dc7Fgy7TQTV4s4ThsgPM4Ut9g',
    expected: 'SNSIP-Airdrop v1 · agent=swap-bot.sol · claimer=6AcSwibbv26kg7qAB28CXCAH2jSbSK39SeM5KuArjEt · checks_passed=signing_key,endpoint,permission,not_expired · t=2026-05-09T04:28:00.471Z',
  },
  {
    n: 3,
    interaction: 'Swap allowed',
    sig: '2zWUKfQRzYfF9iTpdoKMejrWsUTEyuAPgyWTg5XBYrnj1v2NJ6bNhbiiaorj9ykYaFFKDe1o3fFZMg7Rijqa4r85',
    expected: 'SNSIP-Swap v1 · agent=swap-bot.sol · target=JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 · mint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v · amount=25000000 · gate=allowed · permission_label=swap-bot · t=2026-05-09T04:28:00.471Z',
  },
  {
    n: 4,
    interaction: 'Swap rejected',
    sig: '5xptGmV3wGvaTtyivmX8Zf5AknLdd4KCCKGULGzpiLQMxjeKSGzggTYFV7U7h1uyVH7AGqVNjgcuV7SFSUZRsiWb',
    expected: 'SNSIP-Swap v1 · agent=swap-bot.sol · target=JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 · mint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v · amount=500000000 · gate=rejected · reason="amount_500000000>cap_100000000" · t=2026-05-09T04:28:00.471Z',
  },
  {
    n: 5,
    interaction: 'Reputation positive',
    sig: '672V77Fuimv8YCmYKZREi36H6X4LsFr39AEWibqZ58LCB6faBj8fTfxX6Vxy173j26PL3J5fR3qUATrTigaZ7fbp',
    expected: 'SNSIP-Rep v2 · agent=swap-bot.sol · validator=6AcSwibbv26kg7qAB28CXCAH2jSbSK39SeM5KuArjEt · rating=positive · weight=1 · note="Completed Jupiter route within posted spend cap. Latency p95 = 412 ms." · t=2026-05-09T04:28:00.471Z',
  },
  {
    n: 6,
    interaction: 'Reputation neutral',
    sig: '35tw66j2mxoiASzfpv2Yh2FGG24H9Us74iUrboxHkvtsN9ZXY5z4ZmSSgokLPCabyCwVAr7dafBTadpqPvhWLVzj',
    expected: 'SNSIP-Rep v2 · agent=auditor.sol · validator=6AcSwibbv26kg7qAB28CXCAH2jSbSK39SeM5KuArjEt · rating=neutral · weight=1 · note="Refused 312 USDC swap (cap 100). Gate fired correctly." · t=2026-05-09T04:28:00.471Z',
  },
  {
    n: 7,
    interaction: 'Validation audit',
    sig: '2gTMLiozFzL4V3d1b3QgijCnNWYJNgD6D1oz9d8aLcRNWgDP9RcTsjocc5RfiqZ7sCwqLhrUpA85sAduHueF6VUk',
    expected: 'SNSIP-Val v2 · agent=auditor.sol · attestor=6AcSwibbv26kg7qAB28CXCAH2jSbSK39SeM5KuArjEt · class=audit · claim="Audited the Anchor program. No reentrancy. agent.signing-pubkey matches agent.controller." · t=2026-05-09T04:28:00.471Z',
  },
  {
    n: 8,
    interaction: 'Validation capability',
    sig: '3qmQvKFhrvVbJTcKso8nLbnUmHoDuNo9z1235tJ22vLAEgqDtf6berntSiy6ebX27vxhLMrYmqKXyp72KEmES3nL',
    expected: 'SNSIP-Val v2 · agent=swap-bot.sol · attestor=6AcSwibbv26kg7qAB28CXCAH2jSbSK39SeM5KuArjEt · class=capability · claim="Permission grant well-formed. Spend cap within sane bounds. Endpoint serves valid Ed25519." · t=2026-05-09T04:28:00.471Z',
  },
  {
    n: 9,
    interaction: 'Handshake',
    sig: '3KKKTZq7KfSDBTYgsBesYYLtRikKXNkDmYxkmTH7BDvkj7s2FbuGRZj9P46rsk9td45BZVMik3AMjH5u96dPcCNd',
    expected: 'SNSIP-Handshake v1 · alice=snsip-test-001.sol · bob=swap-bot.sol · rounds=5 · all_verified=true · t=2026-05-09T04:28:00.471Z',
  },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const c = new Connection('https://api.devnet.solana.com', 'confirmed');
  const results = [];

  for (const e of ENTRIES) {
    let tx = null;
    let err = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        tx = await c.getTransaction(e.sig, { maxSupportedTransactionVersion: 0 });
        break;
      } catch (ex) {
        err = ex;
        await sleep(400 * (attempt + 1));
      }
    }

    if (!tx) {
      results.push({ ...e, exists: false, bytesMatch: false, memoProgramOk: false, observed: null, note: err ? String(err.message || err).slice(0, 80) : 'not found' });
      await sleep(200);
      continue;
    }

    const logs = (tx.meta && tx.meta.logMessages) || [];

    // Find Memo program log line; format e.g. `Program log: Memo (len 123): "..."`
    let observed = null;
    for (const line of logs) {
      const m = line.match(/^Program log: Memo \(len \d+\): "(.*)"$/s);
      if (m) {
        observed = m[1];
        break;
      }
    }

    // Check Memo program is invoked
    const memoInvoked = logs.some((l) => l.includes('Program ' + MEMO_PROGRAM + ' invoke') || l.startsWith('Program ' + MEMO_PROGRAM));
    // Also check via account keys / static program ids
    let memoInKeys = false;
    try {
      const keys = tx.transaction.message.staticAccountKeys || tx.transaction.message.accountKeys || [];
      memoInKeys = keys.some((k) => k.toBase58 ? k.toBase58() === MEMO_PROGRAM : String(k) === MEMO_PROGRAM);
    } catch (e) {}

    // Log lines are JSON-style escaped within the outer quotes — unescape to recover raw memo bytes.
    const unescape = (s) => s == null ? s : s.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    const observedRaw = unescape(observed);
    const bytesMatch = observedRaw !== null && observedRaw === e.expected;

    results.push({
      ...e,
      exists: true,
      bytesMatch,
      memoProgramOk: memoInvoked || memoInKeys,
      observed: observedRaw,
      note: bytesMatch ? 'ok' : (observedRaw === null ? 'no memo log line' : 'mismatch'),
    });

    await sleep(220); // be nice to public RPC
  }

  console.log(JSON.stringify(results, null, 2));
})().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
