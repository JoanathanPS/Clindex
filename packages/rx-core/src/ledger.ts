// Per-item dispense ledger: the prescription is immutable, the ledger records
// what has been handed out. Same idea as preventing double-spending.
//
// This is the pure reference implementation; the database version
// (supabase/migrations/0004_rx_ledger.sql, function dispense_rx_item)
// enforces the same rules with a row lock.

import type { RxItem, RxPayload } from "./types";

export interface DispenseEvent {
  rxId: string;
  itemNo: number;
  qty: number;
  pharmacyId: string;
  /** What was actually handed over (may be a same-salt substitute). */
  dispensedDrug: string;
  substituted: boolean;
  online: boolean;
  at: number; // unix seconds
}

export interface DispenseRequest {
  itemNo: number;
  qty: number;
  pharmacyId: string;
  online: boolean;
  dispensedDrug?: string;
  substituted?: boolean;
  at?: number;
}

export type DispenseFailure =
  | "unknown_item"
  | "invalid_quantity"
  | "fully_dispensed"
  | "exceeds_remaining"
  | "item_expired"
  | "controlled_requires_online"
  | "substitution_not_allowed";

export type DispenseResult =
  | { ok: true; event: DispenseEvent; remainingAfter: number }
  | { ok: false; reason: DispenseFailure; remaining: number };

/** Controlled items are only valid for a short window after issue. */
export const CONTROLLED_VALID_DAYS = 7;

export function itemExpiry(payload: RxPayload, item: RxItem): number {
  return item.controlled ? Math.min(payload.exp, payload.iat + CONTROLLED_VALID_DAYS * 86400) : payload.exp;
}

export function dispensedQty(payload: RxPayload, events: DispenseEvent[], itemNo: number): number {
  return events.filter((e) => e.rxId === payload.id && e.itemNo === itemNo).reduce((s, e) => s + e.qty, 0);
}

export function remainingByItem(payload: RxPayload, events: DispenseEvent[]): Map<number, number> {
  return new Map(payload.items.map((it) => [it.n, Math.max(0, it.qty - dispensedQty(payload, events, it.n))]));
}

export function dispense(payload: RxPayload, events: DispenseEvent[], req: DispenseRequest): DispenseResult {
  const item = payload.items.find((it) => it.n === req.itemNo);
  if (!item) return { ok: false, reason: "unknown_item", remaining: 0 };
  const remaining = Math.max(0, item.qty - dispensedQty(payload, events, item.n));
  const at = req.at ?? Math.floor(Date.now() / 1000);

  if (!Number.isFinite(req.qty) || req.qty <= 0 || !Number.isInteger(req.qty)) return { ok: false, reason: "invalid_quantity", remaining };
  if (remaining === 0) return { ok: false, reason: "fully_dispensed", remaining };
  if (req.qty > remaining) return { ok: false, reason: "exceeds_remaining", remaining };
  if (at > itemExpiry(payload, item)) return { ok: false, reason: "item_expired", remaining };
  if (item.controlled && !req.online) return { ok: false, reason: "controlled_requires_online", remaining };
  if (req.substituted && item.noSub) return { ok: false, reason: "substitution_not_allowed", remaining };

  const event: DispenseEvent = {
    rxId: payload.id,
    itemNo: item.n,
    qty: req.qty,
    pharmacyId: req.pharmacyId,
    dispensedDrug: req.dispensedDrug ?? item.drug,
    substituted: !!req.substituted,
    online: req.online,
    at,
  };
  return { ok: true, event, remainingAfter: remaining - req.qty };
}

/**
 * What another pharmacy may see: balances, never where or when other
 * pharmacies dispensed.
 */
export function pharmacyView(payload: RxPayload, events: DispenseEvent[], pharmacyId: string) {
  const remaining = remainingByItem(payload, events);
  return payload.items.map((it) => {
    const mine = events.filter((e) => e.rxId === payload.id && e.itemNo === it.n && e.pharmacyId === pharmacyId).reduce((s, e) => s + e.qty, 0);
    const total = it.qty - (remaining.get(it.n) ?? 0);
    return { item: it, remaining: remaining.get(it.n) ?? 0, dispensedHere: mine, dispensedElsewhere: total - mine };
  });
}

export const DISPENSE_MESSAGES: Record<DispenseFailure, string> = {
  unknown_item: "This line is not on the prescription.",
  invalid_quantity: "Enter a whole quantity greater than zero.",
  fully_dispensed: "Already fully dispensed.",
  exceeds_remaining: "More than the remaining balance.",
  item_expired: "This line has expired.",
  controlled_requires_online: "Controlled medicine: must be dispensed online so the shared ledger is checked.",
  substitution_not_allowed: "The doctor marked this line 'no substitution'.",
};
