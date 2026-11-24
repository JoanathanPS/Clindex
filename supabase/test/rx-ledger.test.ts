// Runs migration 0004 on a real Postgres (PGlite) with minimal stubs for the
// Supabase pieces it depends on (auth.uid(), roles, profiles).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

const OWNER_A = "00000000-0000-0000-0000-00000000000a";
const OWNER_B = "00000000-0000-0000-0000-00000000000b";
const STRANGER = "00000000-0000-0000-0000-0000000000ff";
const PHARM_A = "10000000-0000-0000-0000-00000000000a";
const PHARM_B = "10000000-0000-0000-0000-00000000000b";

const STUBS = `
create role anon; create role authenticated;
create schema auth;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
create type public.user_role as enum ('clinician', 'pharmacist', 'researcher', 'admin');
create table public.profiles (id uuid primary key, role public.user_role not null default 'clinician');
create function public.current_user_role() returns public.user_role language sql stable as $$ select role from public.profiles where id = auth.uid() $$;
insert into public.profiles values ('${OWNER_A}', 'pharmacist'), ('${OWNER_B}', 'pharmacist'), ('${STRANGER}', 'clinician');
`;

let db: PGlite;
const as = (uid: string) => db.query(`select set_config('test.uid', $1, false)`, [uid]);
const dispense = (pharmacy: string, item: number, qty: number, opts: { online?: boolean; substituted?: boolean } = {}) =>
  db.query<{ event_id: number; remaining: number }>(`select * from public.dispense_rx_item('rx_1', $1, $2, $3, null, $4, $5)`, [item, qty, pharmacy, opts.substituted ?? false, opts.online ?? true]);
const errorOf = async (p: Promise<unknown>) => {
  try {
    await p;
    return null;
  } catch (e) {
    return (e as Error).message;
  }
};

beforeAll(async () => {
  db = new PGlite();
  await db.exec(STUBS);
  await db.exec(readFileSync(join(__dirname, "../migrations/0004_rx_ledger.sql"), "utf8"));
  await db.exec(`
    insert into public.prescribers (id, name, registration_no, council) values ('20000000-0000-0000-0000-000000000001', 'Dr. A', 'TN-1', 'TNMC');
    insert into public.signing_keys (kid, prescriber_id, public_key) values ('kid1', '20000000-0000-0000-0000-000000000001', 'pk');
    insert into public.pharmacies (id, name, licence_no, pincode, owner_id) values
      ('${PHARM_A}', 'A', 'L-A', '600042', '${OWNER_A}'), ('${PHARM_B}', 'B', 'L-B', '625001', '${OWNER_B}');
    insert into public.rx_tokens (id, kid, patient_hash, issued_at, expires_at, token) values ('rx_1', 'kid1', 'h', now(), now() + interval '30 days', 'CDX1.x.y');
    insert into public.rx_items (rx_id, item_no, drug, qty_authorized, no_substitution, controlled, expires_at) values
      ('rx_1', 1, 'Metformin 500', 60, false, null, now() + interval '30 days'),
      ('rx_1', 2, 'Atorvastatin 10', 30, true, null, now() + interval '30 days'),
      ('rx_1', 3, 'Tramadol 50', 10, false, 'opioid', now() + interval '7 days'),
      ('rx_1', 4, 'Old line', 5, false, null, now() - interval '1 day');
  `);
});

describe("dispense_rx_item", () => {
  it("rejects callers who do not run the pharmacy", async () => {
    await as(STRANGER);
    expect(await errorOf(dispense(PHARM_A, 1, 1))).toBe("not_pharmacy_member");
    await as(OWNER_B);
    expect(await errorOf(dispense(PHARM_A, 1, 1))).toBe("not_pharmacy_member");
  });

  it("splits a line across pharmacies and blocks over-dispensing", async () => {
    await as(OWNER_A);
    expect((await dispense(PHARM_A, 1, 20)).rows[0].remaining).toBe(40);
    await as(OWNER_B);
    expect(await errorOf(dispense(PHARM_B, 1, 41))).toBe("exceeds_remaining:40");
    expect((await dispense(PHARM_B, 1, 40)).rows[0].remaining).toBe(0);
    expect(await errorOf(dispense(PHARM_B, 1, 1))).toBe("fully_dispensed");
  });

  it("enforces controlled-online, no-substitution, expiry and quantity rules", async () => {
    await as(OWNER_A);
    expect(await errorOf(dispense(PHARM_A, 3, 5, { online: false }))).toBe("controlled_requires_online");
    expect((await dispense(PHARM_A, 3, 5)).rows[0].remaining).toBe(5);
    expect(await errorOf(dispense(PHARM_A, 2, 30, { substituted: true }))).toBe("substitution_not_allowed");
    expect(await errorOf(dispense(PHARM_A, 4, 1))).toBe("item_expired");
    expect(await errorOf(dispense(PHARM_A, 1, 0))).toBe("invalid_quantity");
    expect(await errorOf(dispense(PHARM_A, 9, 1))).toBe("unknown_item");
  });

  it("shows balances without revealing which pharmacy dispensed", async () => {
    await as(OWNER_B);
    const { rows, fields } = await db.query<{ item_no: number; remaining: number }>(`select * from public.rx_item_balances('rx_1')`);
    expect(rows.map((r) => [r.item_no, r.remaining])).toEqual([[1, 0], [2, 30], [3, 5], [4, 5]]);
    expect(fields.map((f) => f.name)).not.toContain("pharmacy_id");
  });
});

describe("audit chain", () => {
  it("records every successful dispense in an intact chain", async () => {
    const { rows } = await db.query<{ n: number }>(`select count(*)::int as n from public.audit_chain where action = 'dispense'`);
    expect(rows[0].n).toBe(3);
    expect((await db.query<{ broken: number | null }>(`select public.verify_audit_chain() as broken`)).rows[0].broken).toBeNull();
  });

  it("detects an edited entry", async () => {
    await db.exec(`update public.audit_chain set data = jsonb_set(data, '{qty}', '999') where seq = 1`);
    expect((await db.query<{ broken: number }>(`select public.verify_audit_chain() as broken`)).rows[0].broken).toBe(1);
  });
});
