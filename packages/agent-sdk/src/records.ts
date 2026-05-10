import {
  PublicKey,
  type Connection,
  type TransactionInstruction,
} from "@solana/web3.js";
import {
  getRecordV2Key,
  getDomainKeySync,
  getHashedNameSync,
  getNameAccountKeySync,
  devnet,
  NAME_PROGRAM_ID,
  type Record,
} from "@bonfida/spl-name-service";
import {
  Record as SnsRecord,
  allocateAndPostRecord,
  allocateAndPostRecordInstruction,
  editRecord,
  editRecordInstruction,
  SNS_RECORDS_ID,
  SNS_RECORD_ID_DEVNET,
  CENTRAL_STATE_SNS_RECORDS_DEVNET,
} from "@bonfida/sns-records";
import { SystemProgram } from "@solana/web3.js";

// Detect a devnet connection by RPC URL. Devnet uses different ROOT_DOMAIN
// + SNS_RECORDS program + central state PDA than mainnet. This is enough
// for our needs; callers using a custom RPC for devnet can pass a wrapped
// connection that ends in "devnet" or a sentinel like "magicblock".
function isDevnet(connection: Connection): boolean {
  const ep = connection.rpcEndpoint;
  return ep.includes("devnet") || ep.includes("magicblock");
}

function devnetRecordV2Key(domain: string, recordKey: string): PublicKey {
  const { pubkey: domainPubkey } = devnet.utils.getDomainKeySync(domain);
  const hashed = getHashedNameSync(`\x02${recordKey}`);
  return getNameAccountKeySync(hashed, CENTRAL_STATE_SNS_RECORDS_DEVNET, domainPubkey);
}

// readRecordV2: fetch a single records-v2 value as a UTF-8 string, or null
// if absent.
//
// We do NOT use Bonfida's `getRecordV2` wrapper because it deserializes
// content using the fixed `Record` enum, which throws for SNSIP-Agent's
// custom keys (e.g. `agent.signing-pubkey`). Instead we read the raw
// account via `SnsRecord.retrieve` and decode as UTF-8 ourselves.
export async function readRecordV2(
  connection: Connection,
  domain: string,
  recordKey: string,
): Promise<string | null> {
  try {
    const pubkey = isDevnet(connection)
      ? devnetRecordV2Key(domain, recordKey)
      : getRecordV2Key(domain, recordKey as Record);
    const rec = await SnsRecord.retrieve(connection, pubkey);
    const content = rec.getContent();
    if (!content || content.length === 0) return null;
    return Buffer.from(content).toString("utf-8");
  } catch {
    // Most failures here mean "record account does not exist."
    return null;
  }
}

// writeRecordV2Ix: build the instruction to create or update a records-v2
// entry under any (string) key.
//
// Bonfida's high-level `createRecordV2Instruction` validates the key
// against the `Record` enum (rejects unknown keys). We sidestep that by
// calling `allocateAndPostRecord` / `editRecord` directly with raw
// UTF-8 content. The PDA derivation is the same as Bonfida's canonical
// `getRecordV2Key`, so any tool that respects the on-chain layout can
// read records we write.
//
// The `recordKey` MAY contain dots (e.g. `agent.signing-pubkey`) because
// `getRecordV2Key` derives the PDA by hashing `\x02<recordKey>` directly
// — it does NOT split on dots the way `getDomainKeySync(\`${k}.${d}\`)`
// does. See SNSIP-AGENT.md § "Solana adaptation note".
export async function writeRecordV2Ix(
  connection: Connection,
  params: {
    domain: string;
    recordKey: string;
    value: string;
    payer: PublicKey;
    domainOwner: PublicKey;
  },
): Promise<TransactionInstruction> {
  const { domain, recordKey, value, payer, domainOwner } = params;

  const useDevnet = isDevnet(connection);
  const recordPubkey = useDevnet
    ? devnetRecordV2Key(domain, recordKey)
    : getRecordV2Key(domain, recordKey as Record);
  const parent = useDevnet
    ? devnet.utils.getDomainKeySync(domain).pubkey
    : getDomainKeySync(domain).pubkey;

  const exists = (await connection.getAccountInfo(recordPubkey)) !== null;

  const prefixedKey = `\x02${recordKey}`;
  const content = Buffer.from(value, "utf-8");

  // Devnet path: call the underlying instruction class directly so we can
  // pass DEVNET central state + program ID. The high-level helpers
  // (allocateAndPostRecord / editRecord) hardcode mainnet.
  if (useDevnet) {
    const InstrClass = exists ? editRecordInstruction : allocateAndPostRecordInstruction;
    return new InstrClass({
      record: prefixedKey,
      content: Array.from(content),
    }).getInstruction(
      SNS_RECORD_ID_DEVNET,             // programId
      SystemProgram.programId,          // key 0
      NAME_PROGRAM_ID,                  // key 1
      payer,                            // key 2 (signer)
      recordPubkey,                     // key 3
      parent,                           // key 4
      domainOwner,                      // key 5 (signer)
      CENTRAL_STATE_SNS_RECORDS_DEVNET, // key 6
    );
  }

  if (exists) {
    return editRecord(
      payer, recordPubkey, parent, domainOwner,
      NAME_PROGRAM_ID, prefixedKey, content, SNS_RECORDS_ID,
    );
  }
  return allocateAndPostRecord(
    payer, recordPubkey, parent, domainOwner,
    NAME_PROGRAM_ID, prefixedKey, content, SNS_RECORDS_ID,
  );
}
