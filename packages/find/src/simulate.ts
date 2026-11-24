// Deterministic SIMULATED offers for demonstrating the optimiser before real
// seller feeds are connected. Never present these as real prices.

import type { Offer, Seller } from "./basket";

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

export function simulateOffers(lines: Array<{ lineId: string; mrpCost: number; janCost: number | null }>, sellers: Seller[], seed: string): Offer[] {
  const offers: Offer[] = [];
  for (const line of lines) {
    for (const s of sellers) {
      const r = hash(`${seed}:${s.id}:${line.lineId}`);
      const r2 = hash(`${seed}:${line.lineId}:${s.id}:stock`);
      if (s.id.startsWith("jan")) {
        if (line.janCost === null) continue;
        offers.push({ sellerId: s.id, lineId: line.lineId, price: line.janCost, inStock: r2 > 0.25, confidence: "likely" });
        continue;
      }
      const discount = s.kind === "store" ? 0.05 * r : 0.08 + 0.17 * r;
      offers.push({
        sellerId: s.id,
        lineId: line.lineId,
        price: Math.round(line.mrpCost * (1 - discount) * 100) / 100,
        inStock: r2 > 0.15,
        confidence: s.kind === "store" ? "likely" : "confirmed",
      });
    }
  }
  return offers;
}
