// Tamper-evident audit log: every entry stores the hash of the previous one,
// so editing or deleting any entry breaks the chain from that point on.

import { sha256 } from "@noble/hashes/sha2.js";
import { b64url, canonicalJson, utf8 } from "./codec";

export interface AuditEntry {
  seq: number;
  at: number;
  actor: string;
  action: string;
  data: Record<string, unknown>;
  prev: string;
  hash: string;
}

export const GENESIS = "genesis";

function entryHash(e: Omit<AuditEntry, "hash">): string {
  return b64url(sha256(utf8(canonicalJson(e))));
}

export function appendAudit(chain: AuditEntry[], input: { at: number; actor: string; action: string; data: Record<string, unknown> }): AuditEntry[] {
  const prev = chain.length ? chain[chain.length - 1].hash : GENESIS;
  const base = { seq: chain.length, at: input.at, actor: input.actor, action: input.action, data: input.data, prev };
  return [...chain, { ...base, hash: entryHash(base) }];
}

export function verifyChain(chain: AuditEntry[]): { ok: true } | { ok: false; brokenAt: number } {
  let prev = GENESIS;
  for (let i = 0; i < chain.length; i++) {
    const { hash, ...rest } = chain[i];
    if (rest.seq !== i || rest.prev !== prev || entryHash(rest) !== hash) return { ok: false, brokenAt: i };
    prev = hash;
  }
  return { ok: true };
}
