// openFDA drug label lookup (runs in the browser; openFDA allows CORS).
// US labels: Indian products can differ in strength, excipients and approved uses.

export interface LabelSection {
  key: string;
  title: string;
  text: string;
}

export interface LabelSummary {
  generic: string;
  brand: string | null;
  setId: string | null;
  effectiveTime: string | null;
  sections: LabelSection[];
  url: string | null;
}

const SECTIONS: Array<[string, string]> = [
  ["indications_and_usage", "What it is used for"],
  ["purpose", "Purpose"],
  ["boxed_warning", "Boxed warning"],
  ["do_not_use", "Do not use"],
  ["contraindications", "Do not use if"],
  ["warnings", "Warnings"],
  ["warnings_and_cautions", "Warnings"],
  ["drug_interactions", "Interactions"],
  ["adverse_reactions", "Side effects"],
  ["pregnancy_or_breast_feeding", "Pregnancy / breastfeeding"],
];

export function clip(text: string, max = 700): string {
  const t = text.replace(/\s+/g, " ").replace(/^\d+(\.\d+)*\s+[A-Z &]+\s+/, "").trim();
  return t.length > max ? `${t.slice(0, max).replace(/\s+\S*$/, "")}…` : t;
}

export function parseLabel(generic: string, json: unknown): LabelSummary | null {
  const r = (json as { results?: Array<Record<string, unknown>> })?.results?.[0];
  if (!r) return null;
  const openfda = (r.openfda ?? {}) as Record<string, string[] | undefined>;
  const seen = new Set<string>();
  const sections: LabelSection[] = [];
  for (const [key, title] of SECTIONS) {
    const v = r[key];
    if (!Array.isArray(v) || !v.length || seen.has(title)) continue;
    seen.add(title);
    sections.push({ key, title, text: clip(String(v[0])) });
  }
  const setId = typeof r.set_id === "string" ? r.set_id : null;
  return {
    generic,
    brand: openfda.brand_name?.[0] ?? null,
    setId,
    effectiveTime: typeof r.effective_time === "string" ? r.effective_time : null,
    sections,
    url: setId ? `https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=${setId}` : null,
  };
}

export async function fetchLabel(generic: string): Promise<LabelSummary | null> {
  const q = encodeURIComponent(`openfda.generic_name:"${generic}"`);
  const res = await fetch(`https://api.fda.gov/drug/label.json?search=${q}&limit=1`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`openFDA ${res.status}`);
  return parseLabel(generic, await res.json());
}
