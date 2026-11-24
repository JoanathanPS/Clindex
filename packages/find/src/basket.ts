// Basket maths: what does the whole prescription cost, and what is the
// cheapest / fastest / fewest-stops way to fill it?

import { type Product, type SaltGroup, unitPrice } from "./catalog";

export interface BasketLine {
  lineId: string;
  group: SaltGroup;
  /** The product the doctor wrote (brand), if known. */
  prescribedId: number | null;
  /** Units needed, e.g. 30 tablets or 100 ml. */
  quantity: number;
}

export interface LineChoice {
  lineId: string;
  product: Product;
  packs: number;
  cost: number;
}

export interface PricePlan {
  id: "prescribed" | "cheapest" | "jan-aushadhi";
  title: string;
  lines: LineChoice[];
  total: number;
}

/** Packs needed to cover `quantity` units (1 pack if the pack size is unknown). */
export function packsFor(product: Product, quantity: number): number {
  return product.packCount ? Math.max(1, Math.ceil(quantity / product.packCount)) : 1;
}

function choose(lineId: string, product: Product, quantity: number): LineChoice {
  const packs = packsFor(product, quantity);
  return { lineId, product, packs, cost: round2(packs * product.mrp) };
}

/** Cheapest product in the group for this quantity (whole packs). */
export function cheapestFor(group: SaltGroup, quantity: number, filter: (p: Product) => boolean = () => true): Product | null {
  let best: Product | null = null;
  let bestCost = Infinity;
  for (const p of group.products) {
    if (!filter(p)) continue;
    const cost = packsFor(p, quantity) * p.mrp;
    if (cost < bestCost || (cost === bestCost && best && (unitPrice(p) ?? Infinity) < (unitPrice(best) ?? Infinity))) {
      best = p;
      bestCost = cost;
    }
  }
  return best;
}

/** MRP-based plans: as prescribed, cheapest same-salt, Jan Aushadhi first. */
export function pricePlans(lines: BasketLine[]): PricePlan[] {
  const prescribed = lines.map((l) => {
    const p = l.group.products.find((x) => x.id === l.prescribedId) ?? cheapestFor(l.group, l.quantity);
    return p ? choose(l.lineId, p, l.quantity) : null;
  });
  const cheapest = lines.map((l) => {
    const p = cheapestFor(l.group, l.quantity);
    return p ? choose(l.lineId, p, l.quantity) : null;
  });
  const jan = lines.map((l) => {
    const p = cheapestFor(l.group, l.quantity, (x) => x.janAushadhi) ?? cheapestFor(l.group, l.quantity);
    return p ? choose(l.lineId, p, l.quantity) : null;
  });
  const plan = (id: PricePlan["id"], title: string, choices: Array<LineChoice | null>): PricePlan => {
    const lines = choices.filter((c): c is LineChoice => c !== null);
    return { id, title, lines, total: round2(lines.reduce((s, c) => s + c.cost, 0)) };
  };
  return [
    plan("prescribed", "As prescribed", prescribed),
    plan("cheapest", "Cheapest same-salt", cheapest),
    plan("jan-aushadhi", "Jan Aushadhi first", jan),
  ];
}

// ---------------------------------------------------------------------------
// Multi-seller optimisation (works on any offer feed: affiliate, ONDC, ERP...)
// ---------------------------------------------------------------------------

export type StockConfidence = "confirmed" | "likely" | "unknown";

export interface Seller {
  id: string;
  name: string;
  kind: "online" | "store";
  deliveryFee: number;
  /** Delivery is free at or above this subtotal. */
  freeAbove: number | null;
  etaHours: number;
}

export interface Offer {
  sellerId: string;
  lineId: string;
  /** Price for the full line quantity. */
  price: number;
  inStock: boolean;
  confidence: StockConfidence;
}

export interface Stop {
  sellerId: string;
  lineIds: string[];
  subtotal: number;
  deliveryFee: number;
}

export interface SellerPlan {
  id: "cheapest" | "fastest" | "one-stop";
  stops: Stop[];
  total: number;
  etaHours: number;
  missing: string[];
}

function deliveryFor(seller: Seller, subtotal: number): number {
  return seller.freeAbove !== null && subtotal >= seller.freeAbove ? 0 : seller.deliveryFee;
}

function* subsets<T>(items: T[], maxSize: number): Generator<T[]> {
  const n = items.length;
  function* rec(start: number, acc: T[]): Generator<T[]> {
    if (acc.length) yield acc;
    if (acc.length === maxSize) return;
    for (let i = start; i < n; i++) yield* rec(i + 1, [...acc, items[i]]);
  }
  yield* rec(0, []);
}

interface Candidate {
  stops: Stop[];
  total: number;
  etaHours: number;
  missing: string[];
}

function evaluate(lineIds: string[], sellers: Seller[], offers: Offer[]): Candidate {
  const ids = new Set(sellers.map((s) => s.id));
  const byLine = new Map<string, Offer>();
  for (const o of offers) {
    if (!o.inStock || !ids.has(o.sellerId)) continue;
    const cur = byLine.get(o.lineId);
    if (!cur || o.price < cur.price) byLine.set(o.lineId, o);
  }
  const stops = new Map<string, Stop>();
  const missing: string[] = [];
  for (const lineId of lineIds) {
    const o = byLine.get(lineId);
    if (!o) {
      missing.push(lineId);
      continue;
    }
    const stop = stops.get(o.sellerId) ?? { sellerId: o.sellerId, lineIds: [], subtotal: 0, deliveryFee: 0 };
    stop.lineIds.push(lineId);
    stop.subtotal = round2(stop.subtotal + o.price);
    stops.set(o.sellerId, stop);
  }
  let total = 0;
  let eta = 0;
  for (const stop of stops.values()) {
    const seller = sellers.find((s) => s.id === stop.sellerId)!;
    stop.deliveryFee = deliveryFor(seller, stop.subtotal);
    total += stop.subtotal + stop.deliveryFee;
    eta = Math.max(eta, seller.etaHours);
  }
  return { stops: [...stops.values()], total: round2(total), etaHours: eta, missing };
}

/**
 * Finds the cheapest, fastest and best single-seller plans. Exhaustive over
 * seller subsets up to `maxStops` (sellers per city are few, so this is cheap).
 * Plans that cover more lines always beat plans that cover fewer.
 */
export function optimizeBasket(lineIds: string[], sellers: Seller[], offers: Offer[], maxStops = 3): SellerPlan[] {
  const candidates: Candidate[] = [];
  for (const subset of subsets(sellers, maxStops)) {
    const c = evaluate(lineIds, subset, offers);
    // Skip subsets with an unused seller (a smaller subset already covers it).
    if (c.stops.length === subset.length) candidates.push(c);
  }
  if (!candidates.length) return [];
  const coverage = (c: Candidate) => c.missing.length;
  const best = (score: (c: Candidate) => number, pool = candidates) =>
    pool.reduce((a, b) => (coverage(b) < coverage(a) || (coverage(b) === coverage(a) && score(b) < score(a)) ? b : a));

  const cheapest = best((c) => c.total);
  const fastest = best((c) => c.etaHours * 1e6 + c.total);
  const singles = candidates.filter((c) => c.stops.length === 1);
  const oneStop = singles.length ? best((c) => c.total, singles) : null;

  const plans: SellerPlan[] = [{ id: "cheapest", ...cheapest }];
  if (fastest !== cheapest) plans.push({ id: "fastest", ...fastest });
  if (oneStop && oneStop !== cheapest && oneStop !== fastest) plans.push({ id: "one-stop", ...oneStop });
  return plans;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
