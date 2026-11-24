import { describe, expect, it } from "vitest";
import { controlledClass, detectForm, groupDisplayLabel, parseIngredient, parsePack, saltKey, saltLabel, toGeneric } from "../src";

describe("salt normalisation", () => {
  it("parses messy ingredient strings", () => {
    expect(parseIngredient("Amoxycillin  (500mg) ")).toEqual({ name: "amoxycillin", strength: "500mg" });
    expect(parseIngredient("  Clavulanic Acid (125 MG)")).toEqual({ name: "clavulanic acid", strength: "125mg" });
    expect(parseIngredient("Vitamin D3")).toEqual({ name: "vitamin d3", strength: "" });
    expect(parseIngredient("   ")).toBeNull();
    expect(parseIngredient("Cetirizine (NA)")).toEqual({ name: "cetirizine", strength: "" });
  });

  it("builds order-independent keys that include the dosage form", () => {
    const a = [parseIngredient("Amoxycillin (500mg)")!, parseIngredient("Clavulanic Acid (125mg)")!];
    const b = [...a].reverse();
    expect(saltKey(a, "tablet")).toBe(saltKey(b, "tablet"));
    expect(saltKey(a, "tablet")).not.toBe(saltKey(a, "syrup"));
    expect(saltLabel(a)).toBe("Amoxycillin 500mg + Clavulanic Acid 125mg");
    expect(groupDisplayLabel("Cetirizine 10mg", "tablet")).toBe("Cetirizine 10mg Tablet");
    expect(groupDisplayLabel("Mystery", "other")).toBe("Mystery");
  });

  it("does not group different strengths together", () => {
    expect(saltKey([parseIngredient("Paracetamol (500mg)")!], "tablet")).not.toBe(saltKey([parseIngredient("Paracetamol (650mg)")!], "tablet"));
  });

  it("detects dosage forms", () => {
    expect(detectForm("Dolo 650 Tablet")).toBe("tablet");
    expect(detectForm("Crocin Syrup")).toBe("syrup");
    expect(detectForm("Foo", "strip of 10 capsules")).toBe("capsule");
    expect(detectForm("Mystery")).toBe("other");
  });

  it("separates release types that are not interchangeable", () => {
    expect(detectForm("Glycomet 500 SR Tablet")).toBe("tablet-mr");
    expect(detectForm("Glycomet 500 Tablet")).toBe("tablet");
    expect(detectForm("Ecosprin 75 EC Tablet")).toBe("tablet-ec");
    expect(detectForm("Amoxyclav DT Tablet")).toBe("tablet-dispersible");
    expect(detectForm("Venlor XR Capsule")).toBe("capsule-mr");
    expect(groupDisplayLabel("Metformin 500mg", "tablet-mr")).toBe("Metformin 500mg SR/MR Tablet");
  });

  it("maps Indian names to the clinical engine's generic names", () => {
    expect(toGeneric("Paracetamol")).toBe("acetaminophen");
    expect(toGeneric("amoxycillin")).toBe("amoxicillin");
    expect(toGeneric("Metformin")).toBe("metformin");
  });

  it("flags habit-forming molecules", () => {
    expect(controlledClass("tramadol")).toBe("opioid");
    expect(controlledClass("Tramadol Hydrochloride")).toBe("opioid");
    expect(controlledClass("alprazolam")).toBe("benzodiazepine");
    expect(controlledClass("paracetamol")).toBeNull();
  });
});

describe("pack parsing", () => {
  it("reads counts, volumes and masses", () => {
    expect(parsePack("strip of 10 tablets")).toEqual({ count: 10, kind: "unit" });
    expect(parsePack("bottle of 100 ml Syrup")).toEqual({ count: 100, kind: "ml" });
    expect(parsePack("tube of 30 gm Cream")).toEqual({ count: 30, kind: "g" });
    expect(parsePack("vial of 1 Injection")).toEqual({ count: 1, kind: "unit" });
    expect(parsePack("something odd")).toBeNull();
  });
});
