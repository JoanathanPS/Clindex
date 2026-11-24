import { describe, expect, it } from "vitest";
import { runManualEngine, type ManualInteraction, type ManualRule } from "../src";

const rules: ManualRule[] = [
  { drug_name: "Metformin", trigger_type: "lab", trigger_condition: "eGFR<30", risk_level: "avoid", effect: "Lactic acidosis risk", recommended_action: "Avoid" },
  { drug_name: "Metformin", trigger_type: "lab", trigger_condition: "eGFR30-45", risk_level: "caution", effect: "Accumulation risk", recommended_action: "Reduce dose" },
  { drug_name: "Ibuprofen", trigger_type: "condition", trigger_condition: "peptic_ulcer_disease", risk_level: "avoid", effect: "GI bleed", recommended_action: "Avoid" },
  { drug_name: "Amoxicillin", trigger_type: "allergy", trigger_condition: "penicillin_allergy", risk_level: "avoid", effect: "Anaphylaxis", recommended_action: "Avoid" },
  { drug_name: "Diazepam", trigger_type: "age", trigger_condition: "age_gt_65", risk_level: "caution", effect: "Falls", recommended_action: "Lower dose" },
  { drug_name: "Lisinopril", trigger_type: "pregnancy", trigger_condition: "pregnant", risk_level: "avoid", effect: "Fetal toxicity", recommended_action: "Avoid" },
];

const interactions: ManualInteraction[] = [
  { drug_a: "warfarin", drug_b: "aspirin", severity: "high", mechanism: "Bleeding", action: "Monitor INR" },
  { drug_a: "sildenafil", drug_b: "nitroglycerin", severity: "critical", mechanism: "Hypotension", action: "Contraindicated" },
];

const run = (drugs: string[], profile: Record<string, unknown> = {}) =>
  runManualEngine({ drugs: drugs.map((drug_name) => ({ drug_name })), profile, rules, interactions });

const verdictOf = (res: ReturnType<typeof run>, drug: string) =>
  res.assessments.find((a) => a.drug_name === drug)?.verdict;

describe("runManualEngine — patient-factor rules", () => {
  it("avoids metformin when eGFR < 30", () => {
    expect(verdictOf(run(["Metformin"], { kidney_labs: "eGFR 24" }), "metformin")).toBe("avoid");
  });

  it("cautions metformin when eGFR is in the 30-45 band (inclusive)", () => {
    expect(verdictOf(run(["Metformin"], { kidney_labs: "eGFR 30" }), "metformin")).toBe("caution");
    expect(verdictOf(run(["Metformin"], { kidney_labs: "eGFR 45" }), "metformin")).toBe("caution");
  });

  it("treats unknown labs as no data rather than a match", () => {
    expect(verdictOf(run(["Metformin"], { kidney_labs: "don't know" }), "metformin")).toBe("safe");
  });

  it("falls back to scanning any profile line mentioning the lab", () => {
    expect(verdictOf(run(["Metformin"], { notes: "latest egfr 22 last week" }), "metformin")).toBe("avoid");
  });

  it("matches conditions by keyword", () => {
    expect(verdictOf(run(["Ibuprofen"], { conditions: "History of peptic ulcer" }), "ibuprofen")).toBe("avoid");
  });

  it("matches penicillin allergy only from allergy fields", () => {
    expect(verdictOf(run(["Amoxicillin"], { drug_allergies: "Penicillin (rash)" }), "amoxicillin")).toBe("avoid");
    expect(verdictOf(run(["Amoxicillin"], { notes: "penicillin" }), "amoxicillin")).toBe("safe");
  });

  it("applies the age > 65 rule strictly", () => {
    expect(verdictOf(run(["Diazepam"], { age: "66" }), "diazepam")).toBe("caution");
    expect(verdictOf(run(["Diazepam"], { age: "65" }), "diazepam")).toBe("safe");
  });

  it("applies pregnancy rules only on an explicit yes", () => {
    expect(verdictOf(run(["Lisinopril"], { pregnancy: "Yes" }), "lisinopril")).toBe("avoid");
    expect(verdictOf(run(["Lisinopril"], { pregnancy: "unsure" }), "lisinopril")).toBe("safe");
  });
});

describe("runManualEngine — interactions", () => {
  it("finds interactions regardless of drug order", () => {
    const a = run(["Aspirin", "Warfarin"]);
    expect(a.interactions).toHaveLength(1);
    expect(a.interactions[0].severity).toBe("high");
    expect(verdictOf(a, "warfarin")).toBe("caution");
    expect(verdictOf(a, "aspirin")).toBe("caution");
  });

  it("escalates a critical interaction to avoid for both drugs", () => {
    const res = run(["Sildenafil", "Nitroglycerin"]);
    expect(verdictOf(res, "sildenafil")).toBe("avoid");
    expect(verdictOf(res, "nitroglycerin")).toBe("avoid");
  });

  it("reports unknown pairs as safe with an explicit note", () => {
    const res = run(["Paracetamol", "Cetirizine"]);
    expect(res.interactions[0].severity).toBe("safe");
    expect(res.interactions[0].explanation).toMatch(/No matching reference record/);
  });

  it("checks every pair exactly once", () => {
    expect(run(["a", "b", "c", "d"]).interactions).toHaveLength(6);
  });

  it("summarises an empty prescription", () => {
    expect(run([]).combined_summary).toBe("No drugs to assess.");
  });
});
