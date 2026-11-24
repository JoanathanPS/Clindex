import { describe, expect, it } from "vitest";
import { type Offer, type Product, type SaltGroup, type Seller, Catalog, optimizeBasket, packsFor, pricePlans, simulateOffers } from "../src";

const product = (id: number, mrp: number, packCount: number | null, ja = false): Product => ({
  id, name: `P${id}`, mrp, packCount, unitKind: "unit", manufacturer: "M", pack: `strip of ${packCount}`, janAushadhi: ja,
});
const group = (gid: number, products: Product[]): SaltGroup => ({
  gid, key: `k${gid}`, label: `G${gid}`, form: "tablet", generics: [], controlled: null, products,
});

describe("pricePlans", () => {
  const para = group(1, [product(10, 3.3, 10), product(11, 10, 10, true), product(12, 34.27, 15)]);
  const lines = [{ lineId: "a", group: para, prescribedId: 12, quantity: 15 }];

  it("prices whole packs", () => {
    expect(packsFor(product(1, 10, 10), 15)).toBe(2);
    expect(packsFor(product(1, 10, null), 15)).toBe(1);
  });

  it("returns prescribed, cheapest and Jan Aushadhi plans", () => {
    const [prescribed, cheapest, jan] = pricePlans(lines);
    expect(prescribed.total).toBe(34.27); // 1 strip of 15
    expect(cheapest.total).toBe(6.6); // 2 strips of 10
    expect(jan.lines[0].product.janAushadhi).toBe(true);
    expect(jan.total).toBe(20);
  });

  it("falls back to the cheapest product if the prescribed id is unknown", () => {
    const [prescribed] = pricePlans([{ ...lines[0], prescribedId: 999 }]);
    expect(prescribed.lines[0].product.id).toBe(10);
  });
});

describe("optimizeBasket", () => {
  const sellers: Seller[] = [
    { id: "a", name: "A", kind: "online", deliveryFee: 50, freeAbove: 100, etaHours: 24 },
    { id: "b", name: "B", kind: "online", deliveryFee: 30, freeAbove: null, etaHours: 2 },
    { id: "c", name: "C", kind: "store", deliveryFee: 0, freeAbove: null, etaHours: 1 },
  ];
  const offer = (sellerId: string, lineId: string, price: number, inStock = true): Offer => ({ sellerId, lineId, price, inStock, confidence: "confirmed" });

  it("picks the cheapest full-coverage plan including delivery fees", () => {
    const offers = [offer("a", "x", 60), offer("a", "y", 50), offer("b", "x", 55), offer("b", "y", 45), offer("c", "x", 80, false)];
    const plans = optimizeBasket(["x", "y"], sellers, offers);
    const cheapest = plans.find((p) => p.id === "cheapest")!;
    // A: 110, free delivery (>=100) = 110; B: 100 + 30 = 130
    expect(cheapest.total).toBe(110);
    expect(cheapest.stops.map((s) => s.sellerId)).toEqual(["a"]);
    expect(cheapest.missing).toEqual([]);
  });

  it("prefers coverage over price and reports missing lines", () => {
    const offers = [offer("a", "x", 10), offer("b", "y", 10), offer("c", "x", 1)];
    const plans = optimizeBasket(["x", "y", "z"], sellers, offers);
    expect(plans[0].missing).toEqual(["z"]);
    expect(plans[0].stops.flatMap((s) => s.lineIds).sort()).toEqual(["x", "y"]);
  });

  it("splits across sellers when that is cheaper", () => {
    const offers = [offer("b", "x", 10), offer("b", "y", 90), offer("c", "y", 20), offer("c", "x", 95)];
    const cheapest = optimizeBasket(["x", "y"], sellers, offers)[0];
    expect(cheapest.stops).toHaveLength(2);
    expect(cheapest.total).toBe(60); // 10 + 30 delivery + 20
  });

  it("finds a faster plan when one exists", () => {
    const offers = [offer("a", "x", 10), offer("c", "x", 70)]; // A = 60 (24h), C = 70 (1h)
    const plans = optimizeBasket(["x"], sellers, offers);
    expect(plans.find((p) => p.id === "cheapest")?.total).toBe(60);
    expect(plans.find((p) => p.id === "fastest")?.etaHours).toBe(1);
  });

  it("returns nothing without sellers", () => {
    expect(optimizeBasket(["x"], [], [])).toEqual([]);
  });
});

describe("simulateOffers", () => {
  it("is deterministic and never above MRP", () => {
    const lines = [{ lineId: "x", mrpCost: 100, janCost: 40 }];
    const a = simulateOffers(lines, [{ id: "online-a", name: "A", kind: "online", deliveryFee: 0, freeAbove: null, etaHours: 1 }], "s");
    const b = simulateOffers(lines, [{ id: "online-a", name: "A", kind: "online", deliveryFee: 0, freeAbove: null, etaHours: 1 }], "s");
    expect(a).toEqual(b);
    expect(a[0].price).toBeLessThanOrEqual(100);
  });
});

describe("Catalog client", () => {
  const files: Record<string, unknown> = {
    "/c/meta.json": { buckets: 2 },
    "/c/idx/do.json": [["Dolo 650 Tablet", 0, 3, 58235], ["Dolo Cold Tablet", 0, 4, 1], ["Paracetamol 650mg", 1, 3, null]],
    "/c/grp/1.json": { m: ["Micro Labs"], p: ["strip of 15 tablets"], g: { "3": { k: "k", l: "Paracetamol 650mg", f: "tablet", g: ["acetaminophen"], c: null, i: [[58235, "Dolo 650 Tablet", 34.27, 15, "unit", 0, 0, 0]] } } },
  };
  const fetcher = (async (url: string) => {
    const body = files[url];
    return { ok: !!body, status: body ? 200 : 404, json: async () => body } as Response;
  }) as typeof fetch;
  const catalog = new Catalog("/c", fetcher);

  it("searches by prefix within a shard", async () => {
    const hits = await catalog.search("dolo 6");
    expect(hits.map((h) => h.label)).toEqual(["Dolo 650 Tablet"]);
  });

  it("returns nothing for short or unknown queries", async () => {
    expect(await catalog.search("d")).toEqual([]);
    expect(await catalog.search("zz")).toEqual([]);
  });

  it("hydrates a group with interned strings", async () => {
    const g = await catalog.group(3);
    expect(g?.products[0]).toMatchObject({ name: "Dolo 650 Tablet", manufacturer: "Micro Labs", pack: "strip of 15 tablets", janAushadhi: false });
  });
});
