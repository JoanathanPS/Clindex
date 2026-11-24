"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  DEMO_SELLERS, formLabel, INDIA_SELLER_LINKS, JAN_AUSHADHI_LOCATOR, optimizeBasket, pricePlans, simulateOffers,
  type BasketLine, type PricePlan, type SearchHit, unitPrice,
} from "@clindex/find";
import { assessOpioidLoad, dailyAmount, runManualEngine, SEED_DRUGS, SEED_INTERACTIONS, SEED_RULES } from "@clindex/clinical";
import { PokedexDevice } from "@clindex/ui";
import { MedicineSearch } from "@/components/public/medicine-search";
import { catalog, rupees } from "@/lib/catalog";
import { useLocalStorage } from "@/lib/use-local-storage";

interface Line extends BasketLine {
  perDay: number | null;
}

interface PatientInput {
  age: string;
  egfr: string;
  pregnant: boolean;
  conditions: string;
  allergies: string;
}

const SAMPLE = ["Dolo 650 Tablet", "Glycomet 500 SR Tablet", "Ecosprin 75 Tablet", "Warfarin 5mg Tablet"];
const KNOWN = new Set(SEED_DRUGS.map((d) => d.drug_name.toLowerCase()));
// Show the names people in India know, keeping the international name.
const DISPLAY_NAME: Record<string, string> = { acetaminophen: "Paracetamol (acetaminophen)", amoxicillin: "Amoxycillin (amoxicillin)" };
const displayName = (g: string) => DISPLAY_NAME[g] ?? g;
const verdictTone = { safe: "text-success", caution: "text-warn", avoid: "text-danger" } as const;
const severityTone: Record<string, string> = { critical: "bg-danger text-white", high: "bg-danger/15 text-danger", moderate: "bg-warn/15 text-warn", low: "bg-ink/10 text-ink", safe: "bg-success/15 text-success" };

let lineCounter = 0;

export function FindApp() {
  const params = useSearchParams();
  const [lines, setLines] = useState<Line[]>([]);
  const [patient, setPatient] = useState<PatientInput>({ age: "", egfr: "", pregnant: false, conditions: "", allergies: "" });
  const [planId, setPlanId] = useState<PricePlan["id"]>("cheapest");
  const [pincode, setPincode] = useLocalStorage("clindex.pincode", "");
  const [showSellers, setShowSellers] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const addHit = useCallback(async (hit: SearchHit) => {
    const group = await catalog.group(hit.gid);
    if (!group) return;
    const product = group.products.find((p) => p.id === hit.productId) ?? null;
    setLines((cur) => [
      ...cur,
      { lineId: `l${++lineCounter}`, group, prescribedId: product?.id ?? null, quantity: product?.packCount ?? group.products[0]?.packCount ?? 10, perDay: null },
    ]);
  }, []);

  const addByQuery = useCallback(
    async (q: string) => {
      const [hit] = await catalog.search(q, 1);
      if (hit) await addHit(hit);
      return !!hit;
    },
    [addHit],
  );

  // Deep links from Ask: /find?add=<brand or salt>
  useEffect(() => {
    const q = params.get("add");
    if (!q) return;
    let done = false;
    catalog
      .search(q, 1)
      .then(async ([hit]) => {
        if (done) return;
        if (!hit) setNotice(`“${q}” is not in the catalogue yet.`);
        else await addHit(hit);
      })
      .catch(() => !done && setNotice("Catalogue unavailable — try again."));
    return () => {
      done = true;
    };
  }, [params, addHit]);

  async function loadSample() {
    setBusy(true);
    setLines([]);
    for (const q of SAMPLE) await addByQuery(q);
    setPatient({ age: "67", egfr: "28", pregnant: false, conditions: "Type 2 diabetes, CKD stage 4", allergies: "" });
    setBusy(false);
  }

  const update = (lineId: string, patch: Partial<Line>) => setLines((cur) => cur.map((l) => (l.lineId === lineId ? { ...l, ...patch } : l)));
  const remove = (lineId: string) => setLines((cur) => cur.filter((l) => l.lineId !== lineId));

  // ---- CHECK -------------------------------------------------------------
  const generics = useMemo(() => [...new Set(lines.flatMap((l) => l.group.generics))], [lines]);
  const check = useMemo(() => {
    if (!generics.length) return null;
    const profile: Record<string, unknown> = {
      age: patient.age,
      kidney_labs: patient.egfr ? `eGFR ${patient.egfr}` : "not known",
      pregnancy: patient.pregnant ? "yes" : "no",
      conditions: patient.conditions,
      drug_allergies: patient.allergies,
    };
    const result = runManualEngine({ drugs: generics.map((drug_name) => ({ drug_name })), profile, rules: SEED_RULES, interactions: SEED_INTERACTIONS });
    const known = (a: string, b: string) => SEED_INTERACTIONS.some((i) => (i.drug_a === a && i.drug_b === b) || (i.drug_a === b && i.drug_b === a));
    return {
      ...result,
      flaggedPairs: result.interactions.filter((i) => known(i.drug_a, i.drug_b) && i.severity !== "safe"),
      uncovered: generics.filter((g) => !KNOWN.has(g)),
    };
  }, [generics, patient]);

  const opioid = useMemo(() => {
    const doses = lines.flatMap((l) =>
      l.group.generics.map((g) => {
        const strength = l.group.label.toLowerCase().split(" + ").find((part) => part.startsWith(g.split(" ")[0])) ?? l.group.label;
        return { generic: g, dailyAmount: l.perDay ? dailyAmount(strength, l.perDay) : 0, controlled: l.group.controlled };
      }),
    );
    if (!lines.some((l) => l.group.controlled)) return null;
    return assessOpioidLoad(doses);
  }, [lines]);

  // ---- FIND --------------------------------------------------------------
  const plans = useMemo(() => (lines.length ? pricePlans(lines) : []), [lines]);
  const plan = plans.find((p) => p.id === planId) ?? plans[0];
  const prescribedTotal = plans.find((p) => p.id === "prescribed")?.total ?? 0;

  const sellerPlans = useMemo(() => {
    if (!showSellers || !lines.length) return [];
    const cheapest = plans.find((p) => p.id === "cheapest");
    const jan = plans.find((p) => p.id === "jan-aushadhi");
    const offers = simulateOffers(
      lines.map((l) => {
        const c = cheapest?.lines.find((x) => x.lineId === l.lineId);
        const j = jan?.lines.find((x) => x.lineId === l.lineId);
        return { lineId: l.lineId, mrpCost: c?.cost ?? 0, janCost: j?.product.janAushadhi ? j.cost : null };
      }),
      DEMO_SELLERS,
      pincode || "000000",
    );
    return optimizeBasket(lines.map((l) => l.lineId), DEMO_SELLERS, offers);
  }, [showSellers, lines, plans, pincode]);

  async function share() {
    const flagged = check?.flaggedPairs.length ?? 0;
    const cheapest = plans.find((p) => p.id === "cheapest");
    const text = `ClinDex check: ${lines.length} medicine${lines.length === 1 ? "" : "s"}, ${flagged} interaction${flagged === 1 ? "" : "s"} flagged. Same-salt basket ${rupees(cheapest?.total ?? 0)} vs ${rupees(prescribedTotal)} as prescribed.`;
    try {
      if (navigator.share) await navigator.share({ text, url: location.origin + "/find" });
      else {
        await navigator.clipboard.writeText(`${text} ${location.origin}/find`);
        setNotice("Summary copied to clipboard.");
      }
    } catch {}
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1fr_1.05fr] lg:items-start">
        <div>
          <p className="eyebrow"><span />Scan · Check · Find</p>
          <h1 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">What is in this prescription, is it safe, and where is it cheapest?</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-ink/70">
            Add each medicine as written. ClinDex groups every brand with the same salt, strength and form, checks the combination against the patient, and prices the whole basket.
          </p>
          <div className="mt-6 space-y-3">
            <MedicineSearch onSelect={addHit} autoFocus />
            <div className="flex flex-wrap gap-3">
              <button className="control-button bg-card" onClick={loadSample} disabled={busy}>
                {busy ? "Loading…" : "Try a sample prescription"}
              </button>
              {lines.length ? (
                <button className="control-button bg-canvas" onClick={() => setLines([])}>Clear</button>
              ) : null}
            </div>
            {notice ? <p className="text-xs font-bold text-ink/60" role="status">{notice}</p> : null}
          </div>
        </div>

        <PokedexDevice screenTitle="Prescription" screenTag={`${lines.length} item${lines.length === 1 ? "" : "s"}`} footer={["Same salt · same strength · same form", "MRP data"]}>
          {lines.length === 0 ? (
            <p className="py-10 text-center text-xs">Search a medicine or load the sample to begin.</p>
          ) : (
            <ul className="space-y-3">
              {lines.map((l) => {
                const p = l.group.products.find((x) => x.id === l.prescribedId);
                return (
                  <li key={l.lineId} className="border-b border-[#2c443a]/20 pb-3 last:border-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-black">{p?.name ?? l.group.label}</p>
                        <p className="screen-label mt-0.5 normal-case tracking-normal">{l.group.label} · {formLabel(l.group.form)} · {l.group.products.length} brands</p>
                      </div>
                      <button className="text-[10px] font-black uppercase underline" onClick={() => remove(l.lineId)} aria-label={`Remove ${p?.name ?? l.group.label}`}>
                        Remove
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px]">
                      <label className="flex items-center gap-1">
                        Qty
                        <input type="number" min={1} value={l.quantity} onChange={(e) => update(l.lineId, { quantity: Math.max(1, Number(e.target.value) || 1) })} className="w-16 border border-[#2c443a] bg-[#eef5e6] px-1 py-0.5" />
                        {l.group.products[0]?.unitKind === "ml" ? "ml" : l.group.products[0]?.unitKind === "g" ? "g" : "units"}
                      </label>
                      {l.group.controlled ? (
                        <>
                          <span className="screen-status bg-[#edc1a8]">{l.group.controlled}</span>
                          <label className="flex items-center gap-1">
                            Per day
                            <input type="number" min={0} step={0.5} value={l.perDay ?? ""} onChange={(e) => update(l.lineId, { perDay: e.target.value ? Number(e.target.value) : null })} className="w-14 border border-[#2c443a] bg-[#eef5e6] px-1 py-0.5" />
                          </label>
                        </>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </PokedexDevice>
      </section>

      {lines.length ? (
        <>
          <section className="app-surface p-5 sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-black">1 · Check</h2>
              <p className="console-label">Patient-aware · deterministic reference engine</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Input label="Age" value={patient.age} onChange={(age) => setPatient({ ...patient, age })} inputMode="numeric" />
              <Input label="eGFR (kidney)" value={patient.egfr} onChange={(egfr) => setPatient({ ...patient, egfr })} inputMode="decimal" placeholder="if known" />
              <Input label="Conditions" value={patient.conditions} onChange={(conditions) => setPatient({ ...patient, conditions })} placeholder="e.g. asthma, ulcer" />
              <Input label="Allergies" value={patient.allergies} onChange={(allergies) => setPatient({ ...patient, allergies })} placeholder="e.g. penicillin" />
              <label className="flex items-end gap-2 pb-2 text-sm font-bold">
                <input type="checkbox" checked={patient.pregnant} onChange={(e) => setPatient({ ...patient, pregnant: e.target.checked })} className="h-4 w-4 accent-[#e43d35]" />
                Pregnant
              </label>
            </div>

            {check ? (
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="console-label">Each medicine for this patient</h3>
                  <ul className="mt-3 space-y-2">
                    {check.assessments.map((a) => (
                      <li key={a.drug_name} className="app-panel flex items-start justify-between gap-3 p-3 text-sm">
                        <div>
                          <p className="font-black capitalize">{displayName(a.drug_name)}</p>
                          <p className="mt-1 text-xs text-ink/65">{KNOWN.has(a.drug_name) ? a.driving_factor || "No patient-specific flag found." : "Not yet in our reference set — ask a pharmacist."}</p>
                          {a.side_effects ? <p className="mt-1 text-xs text-ink/65">{a.side_effects}</p> : null}
                        </div>
                        <span className={`shrink-0 text-xs font-black uppercase ${KNOWN.has(a.drug_name) ? verdictTone[a.verdict] : "text-ink/50"}`}>
                          {KNOWN.has(a.drug_name) ? a.verdict : "No data"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="console-label">Interactions between them</h3>
                  {check.flaggedPairs.length ? (
                    <ul className="mt-3 space-y-2">
                      {check.flaggedPairs.map((i) => (
                        <li key={`${i.drug_a}-${i.drug_b}`} className="app-panel p-3 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-black capitalize">{displayName(i.drug_a)} + {displayName(i.drug_b)}</p>
                            <span className={`rounded px-2 py-0.5 text-[10px] font-black uppercase ${severityTone[i.severity]}`}>{i.severity}</span>
                          </div>
                          <p className="mt-2 text-xs leading-5 text-ink/70">{i.mechanism}</p>
                          <p className="mt-1 text-xs font-bold leading-5">{i.explanation}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-ink/65">No interactions found in our reference data for this combination.</p>
                  )}
                  {check.uncovered.length ? (
                    <p className="mt-3 text-xs leading-5 text-ink/55">
                      Not yet covered by the reference set: <span className="capitalize">{check.uncovered.map(displayName).join(", ")}</span>. Absence of a flag is not proof of safety.
                    </p>
                  ) : null}
                  {opioid ? (
                    <div className="mt-4 rounded-lg border-2 border-danger/50 bg-danger/5 p-3 text-sm">
                      <p className="font-black">Habit-forming medicine · {opioid.mme} MME/day</p>
                      <p className="mt-1 text-xs text-ink/70">Enter tablets per day on the opioid line to compute morphine-equivalent load (CDC 2022 factors). Sold only against a valid prescription.</p>
                      {opioid.flags.map((f) => <p key={f} className="mt-2 text-xs font-bold text-danger">{f}</p>)}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </section>

          <section className="app-surface p-5 sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-black">2 · Find the cheapest basket</h2>
              <button className="text-xs font-black uppercase underline decoration-accent decoration-2 underline-offset-4" onClick={share}>Share result</button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {plans.map((p) => {
                const saving = prescribedTotal - p.total;
                return (
                  <button key={p.id} onClick={() => setPlanId(p.id)} aria-pressed={plan?.id === p.id} className={`rounded-lg border-2 border-ink p-4 text-left transition-transform hover:-translate-y-0.5 ${plan?.id === p.id ? "bg-ink text-card shadow-[3px_3px_0_#e43d35]" : "bg-card"}`}>
                    <p className="text-[10px] font-black uppercase tracking-[.14em] opacity-70">{p.title}</p>
                    <p className="mt-2 text-2xl font-black">{rupees(p.total)}</p>
                    <p className="mt-1 text-xs font-bold">{p.id === "prescribed" ? "MRP of the brands written" : saving > 0.005 ? `Save ${rupees(saving)} (${Math.round((saving / (prescribedTotal || 1)) * 100)}%)` : "Same as prescribed"}</p>
                  </button>
                );
              })}
            </div>

            {plan ? (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead>
                    <tr className="console-label">
                      <th className="py-2 pr-3">Medicine</th>
                      <th className="py-2 pr-3">Packs</th>
                      <th className="py-2 pr-3">Per unit</th>
                      <th className="py-2 pr-3">Cost</th>
                      <th className="py-2">Buy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.lines.map((c) => {
                      const up = unitPrice(c.product);
                      return (
                        <tr key={c.lineId} className="border-t border-ink/15 align-top">
                          <td className="py-3 pr-3">
                            <p className="font-black">{c.product.name}{c.product.janAushadhi ? <span className="ml-2 rounded bg-success/15 px-1.5 py-0.5 text-[10px] font-black uppercase text-success">Jan Aushadhi</span> : null}</p>
                            <p className="text-xs text-ink/55">{c.product.manufacturer || "—"} · {c.product.pack}</p>
                          </td>
                          <td className="py-3 pr-3">{c.packs}</td>
                          <td className="py-3 pr-3">{up ? rupees(up) : "—"}</td>
                          <td className="py-3 pr-3 font-black">{rupees(c.cost)}</td>
                          <td className="py-3">
                            {c.product.janAushadhi ? (
                              <a className="text-xs font-bold underline" href={JAN_AUSHADHI_LOCATOR} target="_blank" rel="noreferrer">Find a Kendra</a>
                            ) : (
                              <div className="flex flex-wrap gap-x-3 gap-y-1">
                                {INDIA_SELLER_LINKS.map((s) => (
                                  <a key={s.id} className="text-xs font-bold underline" href={s.url(c.product.name.replace(/\b(tablet|capsule|syrup)s?\b/gi, "").trim())} target="_blank" rel="noreferrer sponsored">{s.name}</a>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="mt-3 text-xs leading-5 text-ink/55">
                  Prices are MRP from an open dataset snapshot (Indian Medicine Dataset, MIT) and indicative Jan Aushadhi prices — sellers usually discount, so check at checkout. Same-salt brands share molecule, strength and form; confirm with your pharmacist before switching, and never switch a line your doctor marked “no substitution”. Ranking never depends on commission.
                </p>
              </div>
            ) : null}
          </section>

          <section className="app-surface p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">3 · Delivery &amp; stock by pincode</h2>
                <p className="mt-1 text-xs text-ink/60">Cheapest, fastest and one-stop plans across sellers, including delivery fees.</p>
              </div>
              <div className="flex items-end gap-2">
                <Input
                  label="Pincode"
                  value={pincode}
                  inputMode="numeric"
                  onChange={(v) => {
                    setPincode(v.replace(/\D/g, "").slice(0, 6));
                  }}
                />
                <button className="control-button bg-accent text-white" onClick={() => setShowSellers((s) => !s)} disabled={pincode.length !== 6}>
                  {showSellers ? "Hide" : "Plan"}
                </button>
              </div>
            </div>
            {showSellers ? (
              <div className="mt-5">
                <p className="inline-block rounded border-2 border-warn bg-warn/10 px-2 py-1 text-[11px] font-black uppercase tracking-wider text-warn">
                  Simulated offers — live seller stock &amp; prices activate when partner feeds connect
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {sellerPlans.map((sp) => (
                    <div key={sp.id} className="app-panel p-4">
                      <p className="text-[10px] font-black uppercase tracking-[.14em] text-ink/60">{sp.id === "one-stop" ? "One stop" : sp.id}</p>
                      <p className="mt-1 text-2xl font-black">{rupees(sp.total)}</p>
                      <p className="text-xs font-bold">{sp.etaHours < 1 ? `${Math.round(sp.etaHours * 60)} min` : `${sp.etaHours} h`} · {sp.stops.length} stop{sp.stops.length === 1 ? "" : "s"}</p>
                      <ul className="mt-3 space-y-2 text-xs">
                        {sp.stops.map((st) => (
                          <li key={st.sellerId} className="border-t border-ink/15 pt-2">
                            <p className="font-black">{DEMO_SELLERS.find((s) => s.id === st.sellerId)?.name}</p>
                            <p className="text-ink/65">{st.lineIds.length} item{st.lineIds.length === 1 ? "" : "s"} · {rupees(st.subtotal)} + {st.deliveryFee ? `${rupees(st.deliveryFee)} delivery` : "free delivery"}</p>
                          </li>
                        ))}
                      </ul>
                      {sp.missing.length ? <p className="mt-2 text-xs font-bold text-danger">{sp.missing.length} item(s) out of stock everywhere nearby</p> : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-xs text-ink/55">Enter a 6-digit pincode to plan delivery and pickup.</p>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}

function Input({ label, value, onChange, ...rest }: { label: string; value: string; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <label className="block">
      <span className="console-label mb-1 block">{label}</span>
      <input className="field-input py-2 text-sm placeholder:text-ink/35" value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
    </label>
  );
}
