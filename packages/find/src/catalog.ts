// Client for the static, sharded medicine catalogue (see scripts/build-catalog.mjs).
// Works in the browser (relative URLs) and in Node (pass an absolute base URL).

import type { DosageForm } from "./salt";
import type { UnitKind } from "./pack";
import type { ControlledClass } from "./controlled";

export interface Product {
  id: number;
  name: string;
  mrp: number;
  packCount: number | null;
  unitKind: UnitKind | null;
  manufacturer: string;
  pack: string;
  janAushadhi: boolean;
}

export interface SaltGroup {
  gid: number;
  key: string;
  label: string;
  form: DosageForm;
  generics: string[];
  controlled: ControlledClass | null;
  /** Sorted cheapest-per-unit first. */
  products: Product[];
}

export interface SearchHit {
  label: string;
  kind: "brand" | "salt";
  gid: number;
  productId: number | null;
}

export interface CatalogMeta {
  builtAt: string;
  products: number;
  groups: number;
  janAushadhiProducts: number;
  buckets: number;
  sources: Array<{ name: string; url: string; licence: string; note: string }>;
}

type RawItem = [number, string, number, number | null, UnitKind | null, number, number, 0 | 1];
interface RawShard {
  m: string[];
  p: string[];
  g: Record<string, { k: string; l: string; f: DosageForm; g: string[]; c: ControlledClass | null; i: RawItem[] }>;
}

export function unitPrice(p: Product): number | null {
  return p.packCount ? p.mrp / p.packCount : null;
}

export function shardPrefix(query: string): string {
  return query.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 2);
}

export class Catalog {
  private cache = new Map<string, Promise<unknown>>();

  constructor(
    private readonly baseUrl = "/catalog",
    private readonly fetcher: typeof fetch = (...a) => fetch(...a),
  ) {}

  private get<T>(path: string): Promise<T> {
    if (!this.cache.has(path)) {
      const p = this.fetcher(`${this.baseUrl}/${path}`).then((r) => {
        if (r.status === 404) return null;
        if (!r.ok) throw new Error(`catalog ${path}: HTTP ${r.status}`);
        return r.json();
      });
      p.catch(() => this.cache.delete(path));
      this.cache.set(path, p);
    }
    return this.cache.get(path) as Promise<T>;
  }

  meta(): Promise<CatalogMeta> {
    return this.get<CatalogMeta>("meta.json");
  }

  /** Brand and salt search. Ranks prefix matches first, then word matches. */
  async search(query: string, limit = 12): Promise<SearchHit[]> {
    const q = query.trim().toLowerCase();
    const prefix = shardPrefix(q);
    if (prefix.length < 2) return [];
    const shard = (await this.get<Array<[string, 0 | 1, number, number | null]>>(`idx/${prefix}.json`)) ?? [];
    const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ");
    const hits: Array<SearchHit & { score: number }> = [];
    for (const [label, kind, gid, productId] of shard) {
      const l = norm(label);
      let score = -1;
      if (l.startsWith(q)) score = 0;
      else if (l.replace(/[^a-z0-9]/g, "").startsWith(q.replace(/[^a-z0-9]/g, ""))) score = 1;
      if (score < 0) continue;
      hits.push({ label, kind: kind === 1 ? "salt" : "brand", gid, productId, score: score + (kind === 1 ? 0 : 0.5) });
      if (hits.length > 400) break;
    }
    hits.sort((a, b) => a.score - b.score || a.label.length - b.label.length);
    return hits.slice(0, limit).map(({ score: _score, ...h }) => h);
  }

  async group(gid: number): Promise<SaltGroup | null> {
    const meta = await this.meta();
    const shard = await this.get<RawShard>(`grp/${gid % meta.buckets}.json`);
    const g = shard?.g[String(gid)];
    if (!shard || !g) return null;
    return {
      gid,
      key: g.k,
      label: g.l,
      form: g.f,
      generics: g.g,
      controlled: g.c,
      products: g.i.map(([id, name, mrp, packCount, unitKind, m, p, ja]) => ({
        id,
        name,
        mrp,
        packCount,
        unitKind,
        manufacturer: shard.m[m] ?? "",
        pack: shard.p[p] ?? "",
        janAushadhi: ja === 1,
      })),
    };
  }
}
