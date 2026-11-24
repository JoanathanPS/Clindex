"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formLabel, groupDisplayLabel, type SaltGroup, type SearchHit, unitPrice } from "@clindex/find";
import { EMPTY_CONTEXT, PROTOCOLS, type PatientContext, triage, type TriageResult } from "@clindex/clinical";
import { MedicineSearch } from "@/components/public/medicine-search";
import { catalog, rupees } from "@/lib/catalog";
import { fetchLabel, type LabelSummary } from "@/lib/fda-label";

type Tab = "medicine" | "unwell";

export function AskApp() {
  const [tab, setTab] = useState<Tab>("medicine");
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow"><span />Ask</p>
        <h1 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">Understand a medicine. Know when to see a doctor.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/70">Every answer shows where it came from. ClinDex informs and screens; it never prescribes.</p>
      </div>
      <div className="flex gap-2" role="tablist">
        {([["medicine", "About a medicine"], ["unwell", "I feel unwell"]] as const).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`control-button ${tab === id ? "bg-ink text-card" : "bg-card"}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === "medicine" ? <MedicinePanel /> : <TriagePanel />}
    </div>
  );
}

// ---------------------------------------------------------------------------

function MedicinePanel() {
  const [group, setGroup] = useState<SaltGroup | null>(null);
  const [brand, setBrand] = useState<string | null>(null);
  const [labels, setLabels] = useState<Record<string, LabelSummary | null | "error">>({});
  const [loading, setLoading] = useState(false);

  async function select(hit: SearchHit) {
    const g = await catalog.group(hit.gid);
    setGroup(g);
    setBrand(hit.kind === "brand" ? hit.label : null);
    setLabels({});
    if (!g) return;
    setLoading(true);
    const entries = await Promise.all(
      g.generics.map(async (gen) => {
        try {
          return [gen, await fetchLabel(gen)] as const;
        } catch {
          return [gen, "error"] as const;
        }
      }),
    );
    setLabels(Object.fromEntries(entries));
    setLoading(false);
  }

  const prices = useMemo(() => {
    if (!group) return null;
    const units = group.products.map(unitPrice).filter((n): n is number => n !== null);
    const ja = group.products.find((p) => p.janAushadhi);
    return { min: Math.min(...units), max: Math.max(...units), brands: group.products.length, cheapest: group.products.slice(0, 3), ja };
  }, [group]);

  return (
    <div className="space-y-5">
      <MedicineSearch onSelect={select} autoFocus />
      {group && prices ? (
        <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
          <section className="app-surface p-5">
            <p className="console-label">{brand ? "Brand" : "Salt"}</p>
            <h2 className="mt-1 text-2xl font-black">{brand ?? group.label}</h2>
            <p className="mt-1 text-sm text-ink/70">Contains <b>{group.label}</b> · {formLabel(group.form)}</p>
            {group.controlled ? (
              <p className="mt-3 rounded border-2 border-danger/50 bg-danger/5 p-2 text-xs font-bold text-danger">
                Habit-forming ({group.controlled}). Use only as prescribed; pharmacies must verify a prescription.
              </p>
            ) : null}
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="app-panel p-3"><dt className="console-label">Brands</dt><dd className="mt-1 text-xl font-black">{prices.brands}</dd></div>
              <div className="app-panel p-3"><dt className="console-label">Per unit</dt><dd className="mt-1 text-xl font-black">{Number.isFinite(prices.min) ? `${rupees(prices.min)}–${rupees(prices.max)}` : "—"}</dd></div>
            </dl>
            <h3 className="console-label mt-5">Cheapest same-salt brands</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {prices.cheapest.map((p) => (
                <li key={p.id} className="flex justify-between gap-3">
                  <span className="truncate">{p.name}</span>
                  <span className="shrink-0 font-bold">{rupees(p.mrp)} <span className="text-xs font-normal text-ink/55">/ {p.pack}</span></span>
                </li>
              ))}
            </ul>
            {prices.ja ? <p className="mt-3 text-xs font-bold text-success">Jan Aushadhi option: {prices.ja.name} — {rupees(prices.ja.mrp)}</p> : null}
            <Link href={`/find?add=${encodeURIComponent(brand ?? groupDisplayLabel(group.label, group.form))}`} className="device-button mt-5">Price my basket <span>&gt;</span></Link>
          </section>

          <section className="app-surface p-5">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-lg font-black">From the official label</h2>
              <span className="console-label">openFDA · US label</span>
            </div>
            {loading ? <p className="mt-4 text-sm text-ink/60">Fetching label…</p> : null}
            {group.generics.map((gen) => {
              const label = labels[gen];
              if (label === undefined) return null;
              if (label === "error") return <p key={gen} className="mt-4 text-sm text-ink/60">Could not reach openFDA for <b className="capitalize">{gen}</b>. Try again later.</p>;
              if (!label || !label.sections.length) return <p key={gen} className="mt-4 text-sm text-ink/60">No US label found for <b className="capitalize">{gen}</b>. Ask your pharmacist for the Indian package insert.</p>;
              return (
                <article key={gen} className="mt-4 border-t border-ink/15 pt-4">
                  <h3 className="font-black capitalize">{gen}</h3>
                  <div className="mt-2 space-y-3">
                    {label.sections.slice(0, 5).map((s) => (
                      <div key={s.key}>
                        <p className="console-label">{s.title}</p>
                        <p className="mt-1 text-sm leading-6 text-ink/80">{s.text}</p>
                      </div>
                    ))}
                  </div>
                  {label.url ? (
                    <a className="mt-3 inline-block text-xs font-bold underline" href={label.url} target="_blank" rel="noreferrer">
                      Source: DailyMed label{label.brand ? ` (${label.brand})` : ""}{label.effectiveTime ? `, ${label.effectiveTime.slice(0, 4)}` : ""}
                    </a>
                  ) : null}
                </article>
              );
            })}
            <AskQuestion group={group} labels={labels} />
            <p className="mt-4 text-xs leading-5 text-ink/55">US labels can differ from Indian products. Always follow your doctor, your pharmacist and the leaflet in the pack.</p>
          </section>
        </div>
      ) : (
        <p className="text-sm text-ink/60">Try “Dolo 650”, “Pan 40”, “Metformin” or “Cetirizine 10mg Tablet”.</p>
      )}
    </div>
  );
}

function AskQuestion({ group, labels }: { group: SaltGroup; labels: Record<string, LabelSummary | null | "error"> }) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/ask").then((r) => r.json()).then((d) => setEnabled(!!d.enabled)).catch(() => setEnabled(false));
  }, []);

  if (!enabled) return null;
  const context = Object.values(labels)
    .filter((l): l is LabelSummary => !!l && l !== "error")
    .map((l) => ({ source: l.url ?? "openFDA", generic: l.generic, sections: l.sections }));

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setBusy(true);
    setAnswer(null);
    try {
      const res = await fetch("/api/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: q, medicine: group.label, context }) });
      const data = await res.json();
      setAnswer(data.answer ?? data.error ?? "No answer.");
    } catch {
      setAnswer("Could not reach the assistant.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={ask} className="mt-6 border-t-2 border-ink pt-4">
      <p className="console-label">Ask about this medicine</p>
      <div className="mt-2 flex gap-2">
        <input className="field-input py-2 text-sm" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Can I take it with food? Is it safe with alcohol?" maxLength={300} />
        <button className="control-button bg-accent text-white" disabled={busy}>{busy ? "…" : "Ask"}</button>
      </div>
      {answer ? <p className="mt-3 whitespace-pre-line rounded-lg bg-canvas p-3 text-sm leading-6">{answer}</p> : null}
      <p className="mt-2 text-[11px] text-ink/50">Answers only from the label shown above; it will say so when the label does not cover your question.</p>
    </form>
  );
}

// ---------------------------------------------------------------------------

const CONTEXT_FIELDS: Array<[keyof Omit<PatientContext, "ageYears">, string]> = [
  ["pregnant", "Pregnant"],
  ["breastfeeding", "Breastfeeding"],
  ["kidneyDisease", "Kidney disease"],
  ["liverDisease", "Liver disease"],
  ["stomachUlcer", "Stomach ulcer / bleeding"],
  ["bloodThinner", "On a blood thinner"],
  ["asthma", "Asthma"],
];

function TriagePanel() {
  const [protocolId, setProtocolId] = useState(PROTOCOLS[0].id);
  const [flags, setFlags] = useState<string[]>([]);
  const [ctx, setCtx] = useState<PatientContext>(EMPTY_CONTEXT);
  const [age, setAge] = useState("");
  const [result, setResult] = useState<TriageResult | null>(null);
  const protocol = PROTOCOLS.find((p) => p.id === protocolId)!;

  function run(e: React.FormEvent) {
    e.preventDefault();
    setResult(triage(protocolId, flags, { ...ctx, ageYears: age ? Number(age) : null }));
  }

  return (
    <form onSubmit={run} className="grid gap-5 lg:grid-cols-[1fr_1fr]">
      <section className="app-surface space-y-5 p-5">
        <div>
          <p className="console-label">What is the problem?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {PROTOCOLS.map((p) => (
              <button type="button" key={p.id} aria-pressed={p.id === protocolId} onClick={() => { setProtocolId(p.id); setFlags([]); setResult(null); }} className={`control-button px-3 py-1.5 text-xs ${p.id === protocolId ? "bg-ink text-card" : "bg-card"}`}>
                {p.title}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
          <label className="block">
            <span className="console-label mb-1 block">Age</span>
            <input className="field-input py-2 text-sm" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 3))} required />
          </label>
          <fieldset>
            <legend className="console-label mb-1">About the person</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {CONTEXT_FIELDS.map(([k, label]) => (
                <label key={k} className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" className="accent-[#e43d35]" checked={ctx[k]} onChange={(e) => setCtx({ ...ctx, [k]: e.target.checked })} />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <fieldset>
          <legend className="console-label">Tick anything that applies</legend>
          <div className="mt-2 space-y-2">
            {protocol.redFlags.map((f) => (
              <label key={f.id} className="flex items-start gap-2 text-sm leading-5">
                <input type="checkbox" className="mt-1 accent-[#e43d35]" checked={flags.includes(f.id)} onChange={(e) => setFlags(e.target.checked ? [...flags, f.id] : flags.filter((x) => x !== f.id))} />
                {f.text}
              </label>
            ))}
          </div>
        </fieldset>
        <button className="device-button">Check <span>&gt;</span></button>
      </section>

      <section aria-live="polite">
        {result ? <TriageResultCard result={result} protocolId={protocolId} /> : (
          <div className="app-panel p-5 text-sm text-ink/60">Answer the questions and press Check. Warning signs are always checked before any medicine is mentioned.</div>
        )}
      </section>
    </form>
  );
}

function TriageResultCard({ result, protocolId }: { result: TriageResult; protocolId: string }) {
  const protocol = PROTOCOLS.find((p) => p.id === protocolId)!;
  if (result.disposition === "emergency") {
    return (
      <div className="rounded-xl border-4 border-danger bg-danger p-5 text-white shadow-[6px_6px_0_#24201e]">
        <p className="text-xs font-black uppercase tracking-[.16em]">Emergency</p>
        <h2 className="mt-2 text-2xl font-black">Get emergency care now.</h2>
        <p className="mt-2 text-sm">Call <a href="tel:112" className="font-black underline">112</a> or an ambulance on <a href="tel:108" className="font-black underline">108</a>, or go to the nearest hospital.</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">{result.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
      </div>
    );
  }
  if (result.disposition === "doctor") {
    return (
      <div className="rounded-xl border-4 border-warn bg-card p-5 shadow-[4px_4px_0_#24201e]">
        <p className="text-xs font-black uppercase tracking-[.16em] text-warn">See a doctor</p>
        <h2 className="mt-2 text-2xl font-black">Please talk to a doctor before taking anything.</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">{result.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
        <Link href="/care" className="device-button mt-4">Talk to a doctor <span>&gt;</span></Link>
      </div>
    );
  }
  return (
    <div className="app-surface p-5">
      <p className="text-xs font-black uppercase tracking-[.16em] text-success">Self-care is reasonable</p>
      <h2 className="mt-2 text-xl font-black">No warning signs. Common options:</h2>
      <ul className="mt-4 space-y-3">
        {result.options.map((o) => (
          <li key={o.option.id} className={`app-panel p-3 ${o.allowed ? "" : "opacity-80"}`}>
            <div className="flex items-center justify-between gap-2">
              <p className="font-black">{o.option.label}</p>
              <span className={`text-[10px] font-black uppercase ${o.allowed ? "text-success" : "text-danger"}`}>{o.allowed ? "Suitable" : "Not for you"}</span>
            </div>
            <p className="mt-1 text-xs leading-5 text-ink/70">{o.option.note}</p>
            {o.reasons.map((r) => <p key={r} className="mt-1 text-xs font-bold text-danger">{r}</p>)}
            {o.cautions.map((c) => <p key={c} className="mt-1 text-xs font-bold text-warn">{c}</p>)}
            {o.allowed && o.option.findQuery ? (
              <Link href={`/find?add=${encodeURIComponent(o.option.findQuery)}`} className="mt-2 inline-block text-xs font-black underline decoration-accent decoration-2 underline-offset-4">Compare prices &gt;</Link>
            ) : null}
          </li>
        ))}
      </ul>
      <h3 className="console-label mt-5">Also helps</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{protocol.measures.map((m) => <li key={m}>{m}</li>)}</ul>
      <p className="mt-4 text-sm font-bold">{protocol.seeDoctorIf}</p>
    </div>
  );
}
