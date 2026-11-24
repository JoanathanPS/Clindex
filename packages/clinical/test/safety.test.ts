import { describe, expect, it } from "vitest";
import { assessOpioidLoad, dailyAmount, EMPTY_CONTEXT, PROTOCOLS, runManualEngine, SEED_INTERACTIONS, SEED_RULES, triage } from "../src";

describe("seed data", () => {
  it("is lower-cased for the engine", () => {
    expect(SEED_RULES.every((r) => ["safe", "caution", "avoid"].includes(r.risk_level))).toBe(true);
    expect(SEED_INTERACTIONS.length).toBeGreaterThan(20);
  });

  it("drives the engine end-to-end (warfarin + aspirin)", () => {
    const res = runManualEngine({ drugs: [{ drug_name: "warfarin" }, { drug_name: "aspirin" }], profile: {}, rules: SEED_RULES, interactions: SEED_INTERACTIONS });
    expect(res.interactions[0].severity).toBe("high");
  });

  it("applies the seeded metformin eGFR rule", () => {
    const res = runManualEngine({ drugs: [{ drug_name: "metformin" }], profile: { kidney_labs: "eGFR 25" }, rules: SEED_RULES, interactions: SEED_INTERACTIONS });
    expect(res.assessments[0].verdict).toBe("avoid");
  });
});

describe("opioid load (MME)", () => {
  it("converts with CDC factors", () => {
    expect(assessOpioidLoad([{ generic: "tramadol", dailyAmount: 200 }]).mme).toBe(40);
    expect(assessOpioidLoad([{ generic: "oxycodone", dailyAmount: 40 }]).mme).toBe(60);
  });

  it("grades risk levels", () => {
    expect(assessOpioidLoad([]).level).toBe("none");
    expect(assessOpioidLoad([{ generic: "tramadol", dailyAmount: 100 }]).level).toBe("low");
    expect(assessOpioidLoad([{ generic: "morphine", dailyAmount: 50 }]).level).toBe("elevated");
    expect(assessOpioidLoad([{ generic: "morphine", dailyAmount: 90 }]).level).toBe("high");
  });

  it("flags opioid + benzodiazepine and multiple opioids", () => {
    const res = assessOpioidLoad([{ generic: "tramadol", dailyAmount: 100 }, { generic: "codeine", dailyAmount: 60 }, { generic: "alprazolam", dailyAmount: 1 }]);
    expect(res.flags.some((f) => f.includes("sedative"))).toBe(true);
    expect(res.flags.some((f) => f.includes("More than one opioid"))).toBe(true);
  });

  it("ignores non-opioids and salt suffixes", () => {
    expect(assessOpioidLoad([{ generic: "paracetamol", dailyAmount: 2000 }]).mme).toBe(0);
    expect(assessOpioidLoad([{ generic: "tramadol hydrochloride", dailyAmount: 100 }]).mme).toBe(20);
    expect(dailyAmount("50mg", 3)).toBe(150);
  });
});

describe("self-care triage", () => {
  it("sends every emergency red flag to emergency", () => {
    for (const p of PROTOCOLS) {
      for (const f of p.redFlags.filter((x) => x.level === "emergency")) {
        expect(triage(p.id, [f.id], EMPTY_CONTEXT).disposition).toBe("emergency");
      }
    }
  });

  it("sends every doctor red flag to a doctor", () => {
    for (const p of PROTOCOLS) {
      for (const f of p.redFlags.filter((x) => x.level === "doctor")) {
        expect(triage(p.id, [f.id], EMPTY_CONTEXT).disposition).toBe("doctor");
      }
    }
  });

  it("routes children and pregnancy to a doctor", () => {
    expect(triage("fever", [], { ...EMPTY_CONTEXT, ageYears: 6 }).disposition).toBe("doctor");
    expect(triage("headache", [], { ...EMPTY_CONTEXT, pregnant: true }).disposition).toBe("doctor");
  });

  it("offers self-care with patient-specific exclusions", () => {
    const res = triage("headache", [], { ...EMPTY_CONTEXT, ageYears: 40, kidneyDisease: true });
    expect(res.disposition).toBe("self-care");
    expect(res.options.find((o) => o.option.id === "ibuprofen")?.allowed).toBe(false);
    expect(res.options.find((o) => o.option.id === "paracetamol")?.allowed).toBe(true);
  });

  it("never suggests ibuprofen for fever (dengue risk)", () => {
    expect(triage("fever", [], EMPTY_CONTEXT).options.map((o) => o.option.id)).not.toContain("ibuprofen");
  });

  it("adds age cautions for older adults", () => {
    const res = triage("cold", [], { ...EMPTY_CONTEXT, ageYears: 70 });
    expect(res.options[0].cautions.some((c) => c.includes("65+"))).toBe(true);
  });
});
