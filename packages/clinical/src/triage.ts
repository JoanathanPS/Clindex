// Guided self-care: screen for red flags FIRST, then (only if none) explain
// common over-the-counter options with patient-specific cautions.
//
// This informs and routes; it never prescribes. Content is deliberately
// conservative and should be reviewed by a clinician before any real launch.

export type Disposition = "emergency" | "doctor" | "self-care";

export interface PatientContext {
  ageYears: number | null;
  pregnant: boolean;
  breastfeeding: boolean;
  kidneyDisease: boolean;
  liverDisease: boolean;
  stomachUlcer: boolean;
  bloodThinner: boolean;
  asthma: boolean;
}

export const EMPTY_CONTEXT: PatientContext = {
  ageYears: null, pregnant: false, breastfeeding: false, kidneyDisease: false, liverDisease: false, stomachUlcer: false, bloodThinner: false, asthma: false,
};

type ContextKey = Exclude<keyof PatientContext, "ageYears">;

export interface RedFlag {
  id: string;
  text: string;
  level: "emergency" | "doctor";
}

export interface SelfCareOption {
  id: string;
  label: string;
  /** Generic molecule name. */
  generic: string | null;
  /** Catalogue search to find and compare brands, or null if not in the catalogue. */
  findQuery: string | null;
  note: string;
  avoidIf: Partial<Record<ContextKey, string>>;
  cautionIf: Partial<Record<ContextKey, string>>;
}

export interface Protocol {
  id: string;
  title: string;
  redFlags: RedFlag[];
  options: SelfCareOption[];
  measures: string[];
  seeDoctorIf: string;
}

const PARACETAMOL: SelfCareOption = {
  id: "paracetamol",
  label: "Paracetamol",
  generic: "paracetamol",
  findQuery: "Paracetamol 650mg Tablet",
  note: "Follow the dose on the pack. Do not take two products that both contain paracetamol (many cold medicines do).",
  avoidIf: {},
  cautionIf: { liverDisease: "Liver disease or regular heavy alcohol use: ask a doctor or pharmacist for a safe maximum dose." },
};

const IBUPROFEN: SelfCareOption = {
  id: "ibuprofen",
  label: "Ibuprofen",
  generic: "ibuprofen",
  findQuery: "Ibuprofen 400mg Tablet",
  note: "Take with food. Short-term use only.",
  avoidIf: {
    kidneyDisease: "Kidney disease: anti-inflammatory painkillers can worsen kidney function.",
    stomachUlcer: "Stomach ulcer or bleeding history: risk of bleeding.",
    bloodThinner: "On a blood thinner: higher bleeding risk.",
    pregnant: "Pregnancy: avoid unless a doctor advises it.",
  },
  cautionIf: { asthma: "Asthma: can trigger wheezing in some people.", breastfeeding: "Breastfeeding: check with a pharmacist first." },
};

const GENERAL_EMERGENCY: RedFlag[] = [
  { id: "breathing", text: "Difficulty breathing or breathlessness at rest", level: "emergency" },
  { id: "confusion", text: "Confusion, fainting or very hard to wake", level: "emergency" },
];

export const PROTOCOLS: Protocol[] = [
  {
    id: "fever",
    title: "Fever",
    redFlags: [
      ...GENERAL_EMERGENCY,
      { id: "stiff-neck", text: "Stiff neck, severe headache or a rash that does not fade when pressed", level: "emergency" },
      { id: "seizure", text: "A fit / seizure", level: "emergency" },
      { id: "three-days", text: "Fever for 3 days or more", level: "doctor" },
      { id: "high", text: "Temperature 39.4 °C (103 °F) or higher", level: "doctor" },
      { id: "dengue-signs", text: "Bleeding gums or nose, red spots on skin, or severe body, joint or eye pain", level: "doctor" },
      { id: "urine", text: "Burning when passing urine or pain in the side", level: "doctor" },
      { id: "immunity", text: "Weak immunity (chemotherapy, long-term steroids, HIV, transplant)", level: "doctor" },
    ],
    options: [PARACETAMOL],
    measures: ["Drink plenty of fluids (water, ORS, soups).", "Rest and wear light clothing.", "Avoid ibuprofen and aspirin until dengue has been ruled out in dengue season."],
    seeDoctorIf: "See a doctor if the fever lasts 3 days or any warning sign appears.",
  },
  {
    id: "headache",
    title: "Headache",
    redFlags: [
      ...GENERAL_EMERGENCY,
      { id: "thunderclap", text: "Sudden, severe 'worst ever' headache", level: "emergency" },
      { id: "head-injury", text: "Headache after a head injury", level: "emergency" },
      { id: "neuro", text: "Weakness, numbness, trouble speaking or loss of vision", level: "emergency" },
      { id: "fever-neck", text: "Headache with fever and stiff neck", level: "emergency" },
      { id: "new-over-50", text: "New kind of headache after age 50", level: "doctor" },
      { id: "waking", text: "Headaches that wake you up or keep getting worse over weeks", level: "doctor" },
      { id: "overuse", text: "Needing painkillers on more than 10 days a month", level: "doctor" },
    ],
    options: [PARACETAMOL, IBUPROFEN],
    measures: ["Drink water and rest in a quiet, dark room.", "Regular meals and sleep help prevent tension headaches."],
    seeDoctorIf: "See a doctor if headaches keep coming back or painkillers are needed often.",
  },
  {
    id: "cold",
    title: "Cold, sneezing & runny nose",
    redFlags: [
      ...GENERAL_EMERGENCY,
      { id: "swelling", text: "Swelling of lips, face or tongue", level: "emergency" },
      { id: "ten-days", text: "Symptoms for more than 10 days", level: "doctor" },
      { id: "ear-chest", text: "Ear pain, chest pain or coughing up blood", level: "doctor" },
      { id: "high-fever", text: "High fever with the cold", level: "doctor" },
    ],
    options: [
      {
        id: "cetirizine",
        label: "Cetirizine (antihistamine)",
        generic: "cetirizine",
        findQuery: "Cetirizine 10mg Tablet",
        note: "Helps sneezing and runny nose from allergies. Can cause drowsiness: do not drive if affected.",
        avoidIf: {},
        cautionIf: { kidneyDisease: "Kidney disease: a lower dose may be needed — ask a pharmacist.", pregnant: "Pregnancy: check with a doctor first.", breastfeeding: "Breastfeeding: check with a pharmacist first." },
      },
    ],
    measures: ["Steam inhalation and saline nose drops.", "Warm fluids, honey with warm water (not for children under 1).", "Rest."],
    seeDoctorIf: "See a doctor if it lasts more than 10 days or breathing gets harder.",
  },
  {
    id: "acidity",
    title: "Acidity & heartburn",
    redFlags: [
      { id: "chest", text: "Chest pain spreading to arm, jaw or back, or with sweating (could be the heart)", level: "emergency" },
      { id: "blood", text: "Vomiting blood or black, tarry stools", level: "emergency" },
      { id: "swallow", text: "Difficulty swallowing or unexplained weight loss", level: "doctor" },
      { id: "two-weeks", text: "Symptoms most days for more than 2 weeks", level: "doctor" },
      { id: "over-55", text: "New symptoms after age 55", level: "doctor" },
    ],
    options: [
      {
        id: "antacid",
        label: "Antacid (aluminium / magnesium hydroxide)",
        generic: "aluminium hydroxide + magnesium hydroxide",
        findQuery: "Aluminium Hydroxide",
        note: "Quick, short-term relief. Take 2 hours apart from other medicines (it can block their absorption).",
        avoidIf: { kidneyDisease: "Kidney disease: magnesium and aluminium can build up — ask a doctor." },
        cautionIf: {},
      },
    ],
    measures: ["Smaller meals; avoid lying down for 3 hours after eating.", "Cut down on spicy, fried food, tea/coffee, alcohol and smoking.", "Raise the head of the bed if symptoms come at night."],
    seeDoctorIf: "See a doctor if you need antacids most days for 2 weeks.",
  },
  {
    id: "diarrhoea",
    title: "Loose motions (diarrhoea)",
    redFlags: [
      { id: "drowsy", text: "Very drowsy, confused, or no urine for 8 hours", level: "emergency" },
      { id: "cannot-drink", text: "Cannot keep any fluids down", level: "emergency" },
      { id: "blood-stool", text: "Blood in stool", level: "doctor" },
      { id: "fever", text: "Fever with loose motions", level: "doctor" },
      { id: "two-days", text: "Lasting more than 2 days, or severe stomach pain", level: "doctor" },
    ],
    options: [
      {
        id: "ors",
        label: "ORS (oral rehydration salts)",
        generic: "oral rehydration salts",
        findQuery: null,
        note: "The most important treatment: replaces lost water and salts. Mix exactly as the pack says.",
        avoidIf: {},
        cautionIf: { kidneyDisease: "Kidney or heart failure: ask a doctor how much fluid is safe." },
      },
    ],
    measures: ["Keep drinking: ORS, water, coconut water, rice water.", "Continue light food (rice, curd, banana).", "Wash hands well; avoid street food until better."],
    seeDoctorIf: "See a doctor if it lasts more than 2 days or warning signs appear.",
  },
];

export interface OptionVerdict {
  option: SelfCareOption;
  allowed: boolean;
  reasons: string[];
  cautions: string[];
}

export interface TriageResult {
  disposition: Disposition;
  reasons: string[];
  options: OptionVerdict[];
}

export function triage(protocolId: string, flagged: string[], ctx: PatientContext): TriageResult {
  const protocol = PROTOCOLS.find((p) => p.id === protocolId);
  if (!protocol) throw new Error(`unknown protocol ${protocolId}`);
  const hit = protocol.redFlags.filter((f) => flagged.includes(f.id));
  const emergency = hit.filter((f) => f.level === "emergency");
  if (emergency.length) return { disposition: "emergency", reasons: emergency.map((f) => f.text), options: [] };

  const reasons = hit.map((f) => f.text);
  if (ctx.ageYears !== null && ctx.ageYears < 12) reasons.push("Children under 12 need doses by weight — please ask a doctor or pharmacist.");
  if (ctx.pregnant) reasons.push("During pregnancy, check any medicine with a doctor first.");
  if (reasons.length) return { disposition: "doctor", reasons, options: [] };

  const options = protocol.options.map((option) => {
    const avoid = (Object.entries(option.avoidIf) as Array<[ContextKey, string]>).filter(([k]) => ctx[k]).map(([, v]) => v);
    const cautions = (Object.entries(option.cautionIf) as Array<[ContextKey, string]>).filter(([k]) => ctx[k]).map(([, v]) => v);
    if (ctx.ageYears !== null && ctx.ageYears >= 65) cautions.push("Age 65+: start with the lowest dose and check with a pharmacist about your other medicines.");
    return { option, allowed: avoid.length === 0, reasons: avoid, cautions };
  });
  return { disposition: "self-care", reasons: [], options };
}
