// Indicative list of habit-forming molecules that need tighter dispensing
// (India: NDPS Act / Schedule H1 / Schedule X). Not exhaustive — verify
// against the current schedules before relying on it.

export type ControlledClass = "opioid" | "benzodiazepine" | "z-drug" | "stimulant" | "barbiturate";

const CONTROLLED: Record<string, ControlledClass> = {
  morphine: "opioid",
  codeine: "opioid",
  "codeine phosphate": "opioid",
  tramadol: "opioid",
  tapentadol: "opioid",
  oxycodone: "opioid",
  hydrocodone: "opioid",
  hydromorphone: "opioid",
  fentanyl: "opioid",
  buprenorphine: "opioid",
  methadone: "opioid",
  pentazocine: "opioid",
  dextropropoxyphene: "opioid",
  alprazolam: "benzodiazepine",
  clonazepam: "benzodiazepine",
  diazepam: "benzodiazepine",
  lorazepam: "benzodiazepine",
  nitrazepam: "benzodiazepine",
  chlordiazepoxide: "benzodiazepine",
  midazolam: "benzodiazepine",
  clobazam: "benzodiazepine",
  etizolam: "benzodiazepine",
  zolpidem: "z-drug",
  zopiclone: "z-drug",
  eszopiclone: "z-drug",
  methylphenidate: "stimulant",
  modafinil: "stimulant",
  phenobarbitone: "barbiturate",
  phenobarbital: "barbiturate",
};

export function controlledClass(generic: string): ControlledClass | null {
  const n = generic.toLowerCase().trim();
  if (CONTROLLED[n]) return CONTROLLED[n];
  // Salt forms: "tramadol hydrochloride", "alprazolam (sr)" ...
  const first = Object.keys(CONTROLLED).find((k) => n.startsWith(`${k} `));
  return first ? CONTROLLED[first] : null;
}
