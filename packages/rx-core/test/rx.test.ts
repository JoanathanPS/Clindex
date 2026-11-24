import { describe, expect, it } from "vitest";
import {
  appendAudit, canonicalJson, decodeRx, dispense, forgeQuantity, type DispenseEvent, fromB64url, b64url, generateKeyPair, hashPatient,
  type KeyDirectory, pharmacyView, remainingByItem, type RxPayload, signRx, verifyChain, verifyRx,
} from "../src";

const NOW = 1_800_000_000;
const keys = generateKeyPair();
const directory: KeyDirectory = { [keys.kid]: { kid: keys.kid, publicKey: keys.publicKey, prescriber: "Dr. A" } };

const payload = (over: Partial<RxPayload> = {}): RxPayload => ({
  v: 1,
  id: "rx_1",
  iat: NOW,
  exp: NOW + 30 * 86400,
  doc: { name: "Dr. A", reg: "TN-12345", council: "TNMC", kid: keys.kid },
  pt: { h: hashPatient("+91 98765 43210", "salt"), age: 54, sex: "F" },
  items: [
    { n: 1, drug: "Metformin 500mg Tablet", generic: ["metformin"], gid: 1, qty: 60, unit: "tablet", sig: "1 BD", noSub: false, controlled: null },
    { n: 2, drug: "Atorvastatin 10mg Tablet", generic: ["atorvastatin"], gid: 2, qty: 30, unit: "tablet", sig: "1 HS", noSub: true, controlled: null },
    { n: 3, drug: "Tramadol 50mg Tablet", generic: ["tramadol"], gid: 3, qty: 10, unit: "tablet", sig: "1 SOS", noSub: false, controlled: "opioid" },
  ],
  ...over,
});

describe("codec", () => {
  it("canonical JSON is key-order independent", () => {
    expect(canonicalJson({ b: 1, a: [2, { d: 3, c: 4 }] })).toBe(canonicalJson({ a: [2, { c: 4, d: 3 }], b: 1 }));
  });
  it("base64url round-trips", () => {
    const bytes = new Uint8Array([0, 255, 62, 63, 1]);
    expect(fromB64url(b64url(bytes))).toEqual(bytes);
    expect(() => fromB64url("not valid!")).toThrow();
  });
});

describe("signing and verification", () => {
  it("verifies a genuine prescription offline", () => {
    const res = verifyRx(signRx(payload(), keys.secretKey), directory, NOW + 60);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.payload.items).toHaveLength(3);
  });

  it("rejects a token whose payload was edited (forged quantity)", () => {
    const token = signRx(payload(), keys.secretKey);
    const [p, , sig] = token.split(".");
    const forged = signRx(payload({ items: payload().items.map((i) => ({ ...i, qty: i.qty * 10 })) }), generateKeyPair().secretKey).split(".")[1];
    expect(verifyRx(`${p}.${forged}.${sig}`, directory, NOW).ok).toBe(false);
  });

  it("detects the forged-quantity attack used in the demo", () => {
    const forged = forgeQuantity(signRx(payload(), keys.secretKey))!;
    expect(decodeRx(forged)?.items[0].qty).toBe(600);
    expect(verifyRx(forged, directory, NOW)).toMatchObject({ ok: false, reason: "bad_signature" });
    expect(forgeQuantity("junk")).toBeNull();
  });

  it("rejects a prescription signed with someone else's key under this doctor's key id", () => {
    const res = verifyRx(signRx(payload(), generateKeyPair().secretKey), directory, NOW);
    expect(res).toMatchObject({ ok: false, reason: "bad_signature" });
  });

  it("rejects unknown and revoked keys", () => {
    expect(verifyRx(signRx(payload(), keys.secretKey), {}, NOW)).toMatchObject({ ok: false, reason: "unknown_key" });
    const revoked = { [keys.kid]: { ...directory[keys.kid], revoked: true } };
    expect(verifyRx(signRx(payload(), keys.secretKey), revoked, NOW)).toMatchObject({ ok: false, reason: "revoked_key" });
  });

  it("enforces expiry", () => {
    expect(verifyRx(signRx(payload(), keys.secretKey), directory, NOW + 31 * 86400)).toMatchObject({ ok: false, reason: "expired" });
  });

  it("rejects garbage", () => {
    expect(verifyRx("hello", directory)).toMatchObject({ ok: false, reason: "malformed" });
    expect(verifyRx("CDX1.@@@.x", directory)).toMatchObject({ ok: false, reason: "malformed" });
    expect(decodeRx("CDX1.abc.def")).toBeNull();
  });

  it("keeps the QR payload compact", () => {
    expect(signRx(payload(), keys.secretKey).length).toBeLessThan(900);
  });

  it("never puts the raw patient identifier in the token", () => {
    const token = signRx(payload(), keys.secretKey);
    expect(JSON.stringify(decodeRx(token))).not.toContain("98765");
    expect(hashPatient(" +91 98765 43210 ", "salt")).toBe(hashPatient("+91 98765 43210", "salt"));
    expect(hashPatient("x", "salt1")).not.toBe(hashPatient("x", "salt2"));
  });
});

describe("dispense ledger", () => {
  const rx = payload();
  const apply = (events: DispenseEvent[], req: Parameters<typeof dispense>[2]) => {
    const r = dispense(rx, events, { at: NOW + 3600, ...req });
    if (!r.ok) throw new Error(r.reason);
    return [...events, r.event];
  };

  it("lets different pharmacies dispense different items", () => {
    let events = apply([], { itemNo: 1, qty: 60, pharmacyId: "A", online: true });
    events = apply(events, { itemNo: 2, qty: 30, pharmacyId: "B", online: true });
    expect([...remainingByItem(rx, events).values()]).toEqual([0, 0, 10]);
  });

  it("supports partial quantities and blocks the second spend", () => {
    const events = apply([], { itemNo: 1, qty: 20, pharmacyId: "A", online: true });
    expect(remainingByItem(rx, events).get(1)).toBe(40);
    expect(dispense(rx, events, { itemNo: 1, qty: 41, pharmacyId: "B", online: true, at: NOW })).toMatchObject({ ok: false, reason: "exceeds_remaining", remaining: 40 });
    const done = apply(events, { itemNo: 1, qty: 40, pharmacyId: "B", online: true });
    expect(dispense(rx, done, { itemNo: 1, qty: 1, pharmacyId: "C", online: true, at: NOW })).toMatchObject({ ok: false, reason: "fully_dispensed" });
  });

  it("requires online dispensing for controlled medicines", () => {
    expect(dispense(rx, [], { itemNo: 3, qty: 10, pharmacyId: "A", online: false, at: NOW })).toMatchObject({ ok: false, reason: "controlled_requires_online" });
    expect(dispense(rx, [], { itemNo: 3, qty: 10, pharmacyId: "A", online: true, at: NOW }).ok).toBe(true);
  });

  it("expires controlled lines after 7 days but normal lines later", () => {
    const at = NOW + 8 * 86400;
    expect(dispense(rx, [], { itemNo: 3, qty: 1, pharmacyId: "A", online: true, at })).toMatchObject({ ok: false, reason: "item_expired" });
    expect(dispense(rx, [], { itemNo: 1, qty: 1, pharmacyId: "A", online: true, at }).ok).toBe(true);
  });

  it("honours 'no substitution'", () => {
    expect(dispense(rx, [], { itemNo: 2, qty: 30, pharmacyId: "A", online: true, substituted: true, at: NOW })).toMatchObject({ ok: false, reason: "substitution_not_allowed" });
    expect(dispense(rx, [], { itemNo: 1, qty: 30, pharmacyId: "A", online: true, substituted: true, dispensedDrug: "Glycomet 500", at: NOW }).ok).toBe(true);
  });

  it("rejects bad quantities and unknown lines", () => {
    for (const qty of [0, -1, 1.5, Number.NaN]) {
      expect(dispense(rx, [], { itemNo: 1, qty, pharmacyId: "A", online: true, at: NOW })).toMatchObject({ ok: false, reason: "invalid_quantity" });
    }
    expect(dispense(rx, [], { itemNo: 9, qty: 1, pharmacyId: "A", online: true, at: NOW })).toMatchObject({ ok: false, reason: "unknown_item" });
  });

  it("ignores events from other prescriptions", () => {
    const foreign: DispenseEvent = { rxId: "rx_other", itemNo: 1, qty: 60, pharmacyId: "A", dispensedDrug: "x", substituted: false, online: true, at: NOW };
    expect(remainingByItem(rx, [foreign]).get(1)).toBe(60);
  });

  it("shows other pharmacies balances, not who dispensed", () => {
    const events = apply([], { itemNo: 1, qty: 60, pharmacyId: "A", online: true });
    const view = pharmacyView(rx, events, "B");
    expect(view[0]).toMatchObject({ remaining: 0, dispensedHere: 0, dispensedElsewhere: 60 });
    expect(JSON.stringify(view)).not.toContain('"A"');
  });
});

describe("audit chain", () => {
  const build = () =>
    [1, 2, 3].reduce((c, i) => appendAudit(c, { at: NOW + i, actor: "pharmacy:A", action: "dispense", data: { item: i } }), [] as ReturnType<typeof appendAudit>);

  it("verifies an untouched chain", () => {
    expect(verifyChain(build())).toEqual({ ok: true });
  });

  it("detects an edited entry", () => {
    const chain = build();
    chain[1] = { ...chain[1], data: { item: 99 } };
    expect(verifyChain(chain)).toEqual({ ok: false, brokenAt: 1 });
  });

  it("detects a deleted entry", () => {
    const chain = build();
    chain.splice(1, 1);
    expect(verifyChain(chain)).toEqual({ ok: false, brokenAt: 1 });
  });
});
