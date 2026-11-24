import { describe, expect, it } from "vitest";
import { computeMetrics, isAction, round4, type VerdictRow } from "../src";

const row = (caseId: number, drug: string, verdict: string): VerdictRow => ({ caseId, drug, verdict });

describe("computeMetrics", () => {
  it("binarizes caution/avoid as action", () => {
    expect(isAction("Caution")).toBe(true);
    expect(isAction("avoid")).toBe(true);
    expect(isAction("safe")).toBe(false);
  });

  it("computes a confusion matrix per (case, drug)", () => {
    const expected = [row(1, "a", "avoid"), row(1, "b", "safe"), row(2, "a", "safe"), row(2, "c", "caution")];
    const predicted = [row(1, "a", "caution"), row(1, "b", "caution"), row(2, "a", "safe"), row(2, "c", "safe")];
    // tp=1 (1:a), fp=1 (1:b), tn=1 (2:a), fn=1 (2:c)
    const m = computeMetrics(expected, predicted);
    expect(m.accuracy).toBe(0.5);
    expect(m.precision).toBe(0.5);
    expect(m.recall).toBe(0.5);
    expect(m.f1).toBe(0.5);
    expect(m.fpr).toBe(0.5);
    expect(m.fnr).toBe(0.5);
  });

  it("counts a missing prediction as safe (a missed contraindication)", () => {
    const m = computeMetrics([row(1, "a", "avoid")], []);
    expect(m.recall).toBe(0);
    expect(m.fnr).toBe(1);
  });

  it("matches drugs case-insensitively", () => {
    expect(computeMetrics([row(1, "Warfarin", "avoid")], [row(1, "warfarin", "avoid")]).recall).toBe(1);
  });

  it("rounds to four decimals", () => {
    expect(round4(0.909090909)).toBe(0.9091);
  });
});
