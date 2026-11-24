// Composition normalisation for Indian medicine data.
//
// The same molecule appears with different spellings, spacing and strength
// formats across brands ("Amoxycillin  (500mg)", "amoxycillin (500 mg)").
// Two products are interchangeable only if *all* of these match:
// every active ingredient, every strength, and the dosage form.

export type DosageForm =
  | "tablet"
  | "tablet-mr"
  | "tablet-dispersible"
  | "tablet-ec"
  | "capsule"
  | "capsule-mr"
  | "syrup"
  | "suspension"
  | "injection"
  | "drops"
  | "cream"
  | "ointment"
  | "gel"
  | "inhaler"
  | "spray"
  | "powder"
  | "solution"
  | "other";

const FORM_PATTERNS: Array<[DosageForm, RegExp]> = [
  ["tablet", /\btab(let)?s?\b/],
  ["capsule", /\bcap(sule)?s?\b/],
  ["syrup", /\bsyrup\b/],
  ["suspension", /\bsuspension\b/],
  ["injection", /\binjection|\binfusion|\bvial\b/],
  ["drops", /\bdrops?\b/],
  ["cream", /\bcream\b/],
  ["ointment", /\bointment\b/],
  ["gel", /\bgel\b/],
  ["inhaler", /\binhaler|\brotacap|\brespule/],
  ["spray", /\bspray\b/],
  ["powder", /\bpowder|\bsachet\b/],
  ["solution", /\bsolution|\blotion\b|\bliquid\b/],
];

// Release modifiers. A sustained-release tablet is NOT interchangeable with an
// immediate-release one, so these become separate forms.
const MODIFIED_RELEASE = /\b(sr|er|xr|cr|mr|pr|xl|cd|la|od|retard|extended|sustained|controlled|prolonged|modified)\b/;
const DISPERSIBLE = /\b(dt|md|dispersible|mouth dissolving|orally disintegrating|odt)\b/;
const ENTERIC = /\b(ec|enteric|gastro[- ]resistant|dr|delayed)\b/;

/** Detects the dosage form (including release type) from the name, then the pack label. */
export function detectForm(name: string, packLabel = ""): DosageForm {
  const lowerName = name.toLowerCase();
  let base: DosageForm = "other";
  outer: for (const text of [lowerName, packLabel.toLowerCase()]) {
    for (const [form, re] of FORM_PATTERNS) {
      if (re.test(text)) {
        base = form;
        break outer;
      }
    }
  }
  if (base === "tablet") {
    if (MODIFIED_RELEASE.test(lowerName)) return "tablet-mr";
    if (DISPERSIBLE.test(lowerName)) return "tablet-dispersible";
    if (ENTERIC.test(lowerName)) return "tablet-ec";
  }
  if (base === "capsule" && MODIFIED_RELEASE.test(lowerName)) return "capsule-mr";
  return base;
}

const FORM_LABELS: Partial<Record<DosageForm, string>> = {
  "tablet-mr": "SR/MR Tablet",
  "tablet-dispersible": "Dispersible Tablet",
  "tablet-ec": "Enteric-coated Tablet",
  "capsule-mr": "SR/MR Capsule",
};

export function formLabel(form: DosageForm): string {
  return FORM_LABELS[form] ?? titleCase(form);
}

/** "500 MG" -> "500mg", "0.05% w/w" -> "0.05%w/w". */
export function normalizeStrength(raw: string): string {
  return raw.toLowerCase().replace(/\s+/g, "").replace(/mcg/g, "mcg").replace(/iu\b/g, "iu");
}

export interface Ingredient {
  /** Lower-case molecule name as written in the source ("amoxycillin"). */
  name: string;
  /** Normalised strength ("500mg") or "" if absent. */
  strength: string;
}

/** Parses "Amoxycillin  (500mg) " into { name: "amoxycillin", strength: "500mg" }. */
export function parseIngredient(raw: string): Ingredient | null {
  const text = raw.trim();
  if (!text) return null;
  const m = text.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
  const name = (m ? m[1] : text).toLowerCase().replace(/\s+/g, " ").trim();
  if (!name) return null;
  const strength = m ? normalizeStrength(m[2]) : "";
  // The source uses "NA" / "na" for unknown strengths.
  return { name, strength: /^(na|n\/a|nil|-)?$/.test(strength) ? "" : strength };
}

/** Order-independent key for a set of ingredients plus dosage form. */
export function saltKey(ingredients: Ingredient[], form: DosageForm): string {
  const parts = ingredients
    .map((i) => (i.strength ? `${i.name} ${i.strength}` : i.name))
    .sort();
  return `${parts.join(" + ")} | ${form}`;
}

/** Human label: "Amoxycillin 500mg + Clavulanic Acid 125mg". */
export function saltLabel(ingredients: Ingredient[]): string {
  return ingredients
    .map((i) => `${titleCase(i.name)}${i.strength ? ` ${i.strength}` : ""}`)
    .join(" + ");
}

/** Search/display label including the form: "Cetirizine 10mg Tablet". */
export function groupDisplayLabel(label: string, form: DosageForm): string {
  return form === "other" ? label : `${label} ${formLabel(form)}`;
}

function titleCase(s: string): string {
  return s.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

// Indian (BAN/INN) names -> the generic names used by the clinical seed data
// (US-style INN). Only names that differ need an entry.
const GENERIC_ALIASES: Record<string, string> = {
  paracetamol: "acetaminophen",
  amoxycillin: "amoxicillin",
  "sodium valproate": "valproic acid",
  "divalproex sodium": "valproic acid",
  valproate: "valproic acid",
  "glyceryl trinitrate": "nitroglycerin",
  thyroxine: "levothyroxine",
  "levothyroxine sodium": "levothyroxine",
  "lithium carbonate": "lithium",
  "tramadol hydrochloride": "tramadol",
  "metformin hydrochloride": "metformin",
  "sildenafil citrate": "sildenafil",
  "ciprofloxacin hydrochloride": "ciprofloxacin",
  "cetirizine hydrochloride": "cetirizine",
  "clopidogrel bisulphate": "clopidogrel",
  "warfarin sodium": "warfarin",
};

/** Maps a source molecule name to the generic name the clinical engine uses. */
export function toGeneric(name: string): string {
  const n = name.toLowerCase().replace(/\s+/g, " ").trim();
  return GENERIC_ALIASES[n] ?? n;
}
