// Pack-size parsing so prices can be compared per unit
// ("strip of 10 tablets" vs "strip of 15 tablets").

export type UnitKind = "unit" | "ml" | "g";

export interface PackSize {
  count: number;
  kind: UnitKind;
}

export function parsePack(label: string): PackSize | null {
  const s = label.toLowerCase();
  const vol = s.match(/(\d+(?:\.\d+)?)\s*ml\b/);
  if (vol) return positive(Number(vol[1]), "ml");
  const mass = s.match(/(\d+(?:\.\d+)?)\s*(gm|g|gms)\b/);
  if (mass) return positive(Number(mass[1]), "g");
  const count = s.match(/of\s+(\d+(?:\.\d+)?)\s*(tablet|capsule|unit|sachet|respule|rotacap|vial|ampoule|patch|lozenge|suppositor|pessar|piece|dose)/);
  if (count) return positive(Number(count[1]), "unit");
  const single = s.match(/^(vial|ampoule|tube|bottle|packet|sachet|inhaler|pen|box) of 1\b/);
  if (single) return { count: 1, kind: "unit" };
  return null;
}

function positive(n: number, kind: UnitKind): PackSize | null {
  return Number.isFinite(n) && n > 0 ? { count: n, kind } : null;
}

export function unitLabel(kind: UnitKind): string {
  return kind === "ml" ? "ml" : kind === "g" ? "g" : "unit";
}
