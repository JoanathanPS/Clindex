// Opioid load in morphine milligram equivalents (MME) per day.
// Conversion factors: CDC Clinical Practice Guideline for Prescribing Opioids
// for Pain (2022), Table. Buprenorphine is intentionally excluded (CDC does
// not convert it to MME). Thresholds follow the same guideline's discussion
// of increased risk at >= 50 MME/day and further at >= 90 MME/day.

export const MME_FACTORS: Record<string, number> = {
  codeine: 0.15,
  tramadol: 0.2,
  tapentadol: 0.4,
  hydrocodone: 1,
  morphine: 1,
  oxycodone: 1.5,
  oxymorphone: 3,
  methadone: 4.7,
  hydromorphone: 5,
  /** mcg/hr for transdermal patches. */
  "fentanyl transdermal": 2.4,
};

const SEDATIVES = new Set(["alprazolam", "clonazepam", "diazepam", "lorazepam", "nitrazepam", "chlordiazepoxide", "midazolam", "clobazam", "etizolam", "zolpidem", "zopiclone", "eszopiclone"]);

export interface DailyDose {
  generic: string;
  /** mg per day (mcg/hr for fentanyl patches). */
  dailyAmount: number;
}

export type LoadLevel = "none" | "low" | "elevated" | "high";

export interface LoadAssessment {
  mme: number;
  level: LoadLevel;
  flags: string[];
  contributions: Array<{ generic: string; mme: number }>;
}

export function mmeFactor(generic: string): number | null {
  const n = generic.toLowerCase().trim();
  if (MME_FACTORS[n] !== undefined) return MME_FACTORS[n];
  const key = Object.keys(MME_FACTORS).find((k) => n.startsWith(`${k} `));
  return key ? MME_FACTORS[key] : null;
}

export function assessOpioidLoad(doses: DailyDose[]): LoadAssessment {
  const contributions = doses
    .map((d) => ({ generic: d.generic, factor: mmeFactor(d.generic), amount: d.dailyAmount }))
    .filter((d) => d.factor !== null && d.amount > 0)
    .map((d) => ({ generic: d.generic, mme: Math.round(d.factor! * d.amount * 10) / 10 }));
  const mme = Math.round(contributions.reduce((s, c) => s + c.mme, 0) * 10) / 10;
  const level: LoadLevel = mme === 0 ? "none" : mme < 50 ? "low" : mme < 90 ? "elevated" : "high";
  const flags: string[] = [];
  if (level === "elevated") flags.push("At or above 50 MME/day: reassess benefit vs risk; consider naloxone and closer follow-up.");
  if (level === "high") flags.push("At or above 90 MME/day: high overdose risk; justify, taper where possible, and co-prescribe naloxone.");
  const sedatives = doses.filter((d) => SEDATIVES.has(d.generic.toLowerCase().trim()));
  if (mme > 0 && sedatives.length) flags.push(`Opioid + sedative (${sedatives.map((s) => s.generic).join(", ")}): risk of fatal respiratory depression; avoid combining.`);
  if (contributions.length > 1) flags.push("More than one opioid at the same time.");
  return { mme, level, flags, contributions };
}

/** Daily amount from a strength like "50mg" and units per day. */
export function dailyAmount(strength: string, unitsPerDay: number): number {
  const m = strength.match(/(\d+(?:\.\d+)?)\s*mg/i);
  return m ? Number(m[1]) * unitsPerDay : 0;
}
