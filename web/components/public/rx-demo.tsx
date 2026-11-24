"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import QRCode from "qrcode";
import { groupDisplayLabel, type SearchHit } from "@clindex/find";
import {
  appendAudit, type AuditEntry, DISPENSE_MESSAGES, dispense, type DispenseEvent, forgeQuantity, generateKeyPair, hashPatient, type KeyDirectory,
  type KeyPair, pharmacyView, type RxItem, type RxPayload, signRx, verifyChain, verifyRx, type VerifyResult,
} from "@clindex/rx-core";
import { MedicineSearch } from "@/components/public/medicine-search";
import { canScanQr, QrScanner } from "@/components/public/qr-scanner";
import { catalog } from "@/lib/catalog";
import { useLocalStorage } from "@/lib/use-local-storage";

const PATIENT_SALT = "clindex-demo-salt";
const PHARMACIES = [
  { id: "pharmacy-a", name: "Pharmacy A · Chennai" },
  { id: "pharmacy-b", name: "Pharmacy B · Madurai" },
  { id: "pharmacy-c", name: "Pharmacy C · Online" },
];
const VERIFY_TEXT: Record<string, string> = {
  malformed: "Not a ClinDex prescription (or it was corrupted).",
  unknown_key: "Signed by an unknown key — not a registered prescriber.",
  revoked_key: "The prescriber's key has been revoked.",
  bad_signature: "FORGED: the contents do not match the doctor's signature.",
  expired: "This prescription has expired.",
  not_yet_valid: "Issue date is in the future.",
};

interface State {
  keys: KeyPair | null;
  directory: KeyDirectory;
  events: DispenseEvent[];
  audit: AuditEntry[];
  issued: Array<{ id: string; token: string; at: number }>;
}
const EMPTY: State = { keys: null, directory: {}, events: [], audit: [], issued: [] };
const STORE = "clindex.rx.demo.v1";

const now = () => Math.floor(Date.now() / 1000);
const noopSubscribe = () => () => {};
const fmt = (s: number) => new Date(s * 1000).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

export function RxDemo() {
  const [stored, setState] = useLocalStorage<State>(STORE, EMPTY);
  const state = useMemo(() => ({ ...EMPTY, ...stored }), [stored]);

  const [handoff, setHandoff] = useState("");

  const audit = useCallback((s: State, actor: string, action: string, data: Record<string, unknown>): State => ({ ...s, audit: appendAudit(s.audit, { at: now(), actor, action, data }) }), []);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow"><span />Signed prescriptions</p>
        <h1 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">A prescription that cannot be forged or used twice.</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-ink/70">
          The doctor signs with a private key on their device (Ed25519). Any pharmacy verifies the QR offline with the public key, and a shared ledger tracks every line, so the same medicine cannot be collected twice — even split across pharmacies.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <DoctorPanel state={state} setState={setState} audit={audit} onIssued={setHandoff} />
        <PharmacyPanel state={state} setState={setState} audit={audit} handoff={handoff} />
      </div>
      <LedgerPanel state={state} setState={setState} />
      <p className="text-xs leading-5 text-ink/55">
        Demo mode: keys, ledger and audit log live in this browser only. In production the ledger is a shared Postgres table with a locking dispense function (supabase/migrations/0004_rx_ledger.sql) and keys are tied to verified medical-council registrations.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------

type Setter = (next: State | ((prev: State) => State)) => void;
type Auditor = (s: State, actor: string, action: string, data: Record<string, unknown>) => State;

interface DraftItem extends RxItem {
  key: string;
}

function DoctorPanel({ state, setState, audit, onIssued }: { state: State; setState: Setter; audit: Auditor; onIssued: (t: string) => void }) {
  const [doctor, setDoctor] = useState({ name: "Dr. Kavya Raman", reg: "TNMC-84213", council: "Tamil Nadu Medical Council" });
  const [patient, setPatient] = useState({ phone: "98765 43210", age: "58", sex: "F" });
  const [items, setItems] = useState<DraftItem[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);

  function ensureKeys() {
    if (state.keys && state.directory[state.keys.kid] && !state.directory[state.keys.kid].revoked) return;
    const keys = generateKeyPair();
    setState((s) => audit({ ...s, keys, directory: { ...s.directory, [keys.kid]: { kid: keys.kid, publicKey: keys.publicKey, prescriber: doctor.name } } }, `doctor:${doctor.reg}`, "key.created", { kid: keys.kid }));
  }

  async function add(hit: SearchHit) {
    const g = await catalog.group(hit.gid);
    if (!g) return;
    const product = g.products.find((p) => p.id === hit.productId);
    setItems((cur) => [
      ...cur,
      {
        key: crypto.randomUUID(),
        n: cur.length + 1,
        drug: product?.name ?? groupDisplayLabel(g.label, g.form),
        generic: g.generics,
        gid: g.gid,
        qty: product?.packCount ?? 10,
        unit: g.form === "syrup" || g.form === "suspension" ? "ml" : g.form.split("-")[0],
        sig: "",
        noSub: false,
        controlled: g.controlled,
      },
    ]);
  }

  async function sign() {
    if (!state.keys || !items.length) return;
    const iat = now();
    const payload: RxPayload = {
      v: 1,
      id: `rx_${crypto.randomUUID().slice(0, 8)}`,
      iat,
      exp: iat + 30 * 86400,
      doc: { name: doctor.name, reg: doctor.reg, council: doctor.council, kid: state.keys.kid },
      pt: { h: hashPatient(patient.phone, PATIENT_SALT), age: patient.age ? Number(patient.age) : null, sex: patient.sex || null },
      items: items.map((draft, i) => {
        const { key, ...it } = draft;
        void key;
        return { ...it, n: i + 1 };
      }),
    };
    const t = signRx(payload, state.keys.secretKey);
    setToken(t);
    setQr(await QRCode.toDataURL(t, { errorCorrectionLevel: "M", margin: 1, width: 360, color: { dark: "#24201e", light: "#fff7e8" } }));
    setState((s) => audit({ ...s, issued: [...s.issued, { id: payload.id, token: t, at: iat }] }, `doctor:${doctor.reg}`, "rx.issued", { rx: payload.id, items: payload.items.length }));
    onIssued(t);
  }

  function revoke() {
    if (!state.keys) return;
    const kid = state.keys.kid;
    setState((s) => audit({ ...s, directory: { ...s.directory, [kid]: { ...s.directory[kid], revoked: true } } }, `doctor:${doctor.reg}`, "key.revoked", { kid }));
  }

  const keyStatus = state.keys ? (state.directory[state.keys.kid]?.revoked ? "revoked" : "active") : "none";

  return (
    <section className="app-surface space-y-4 p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-black">Doctor</h2>
        <span className="console-label">Key: {keyStatus === "none" ? "not created" : `${state.keys!.kid.slice(0, 8)}… ${keyStatus}`}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Doctor" value={doctor.name} onChange={(name) => setDoctor({ ...doctor, name })} />
        <Field label="Reg. no." value={doctor.reg} onChange={(reg) => setDoctor({ ...doctor, reg })} />
        <Field label="Council" value={doctor.council} onChange={(council) => setDoctor({ ...doctor, council })} />
        <Field label="Patient phone (hashed)" value={patient.phone} onChange={(phone) => setPatient({ ...patient, phone })} />
        <Field label="Age" value={patient.age} onChange={(age) => setPatient({ ...patient, age })} />
        <Field label="Sex" value={patient.sex} onChange={(sex) => setPatient({ ...patient, sex })} />
      </div>
      <div className="flex flex-wrap gap-2">
        <button className="control-button bg-ink text-card" onClick={ensureKeys} disabled={keyStatus === "active"}>
          {keyStatus === "active" ? "Signing key ready" : keyStatus === "revoked" ? "Create new key" : "Create signing key"}
        </button>
        {keyStatus === "active" ? <button className="control-button bg-card" onClick={revoke}>Revoke key</button> : null}
      </div>

      <div>
        <p className="console-label mb-2">Medicines</p>
        <MedicineSearch onSelect={add} placeholder="Add a medicine, e.g. Glycomet 500 or Ultracet" />
        <ul className="mt-3 space-y-2">
          {items.map((it) => (
            <li key={it.key} className="app-panel space-y-2 p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="font-black">{it.drug}{it.controlled ? <span className="ml-2 rounded bg-danger/15 px-1.5 text-[10px] uppercase text-danger">{it.controlled}</span> : null}</p>
                <button className="text-[10px] font-black uppercase underline" onClick={() => setItems((c) => c.filter((x) => x.key !== it.key))}>Remove</button>
              </div>
              <div className="grid gap-2 sm:grid-cols-[90px_1fr_auto] sm:items-center">
                <input aria-label="Quantity" type="number" min={1} className="field-input py-1.5 text-sm" value={it.qty} onChange={(e) => setItems((c) => c.map((x) => (x.key === it.key ? { ...x, qty: Math.max(1, Number(e.target.value) || 1) } : x)))} />
                <input aria-label="Directions" className="field-input py-1.5 text-sm" placeholder="Directions, e.g. 1 twice daily after food" value={it.sig} onChange={(e) => setItems((c) => c.map((x) => (x.key === it.key ? { ...x, sig: e.target.value } : x)))} />
                <label className="flex items-center gap-1 text-xs font-bold">
                  <input type="checkbox" className="accent-[#e43d35]" checked={it.noSub} onChange={(e) => setItems((c) => c.map((x) => (x.key === it.key ? { ...x, noSub: e.target.checked } : x)))} />
                  No substitution
                </label>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <button className="device-button" onClick={sign} disabled={keyStatus !== "active" || !items.length}>Sign prescription <span>&gt;</span></button>
      {keyStatus !== "active" ? <p className="text-xs text-ink/55">Create a signing key first.</p> : null}

      {token && qr ? (
        <div className="grid gap-4 border-t-2 border-ink pt-4 sm:grid-cols-[180px_1fr]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="Signed prescription QR code" className="w-full rounded border-2 border-ink" />
          <div className="min-w-0 space-y-2">
            <p className="console-label">Signed token · {token.length} characters</p>
            <p className="break-all rounded bg-canvas p-2 font-mono text-[10px] leading-4">{token}</p>
            <button className="control-button bg-card text-xs" onClick={() => navigator.clipboard?.writeText(token)}>Copy token</button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function PharmacyPanel({ state, setState, audit, handoff }: { state: State; setState: Setter; audit: Auditor; handoff: string }) {
  const [pharmacyId, setPharmacyId] = useState(PHARMACIES[0].id);
  const [online, setOnline] = useState(true);
  const [token, setToken] = useState("");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [qty, setQty] = useState<Record<number, number>>({});
  const [subs, setSubs] = useState<Record<number, string>>({});
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const scanSupported = useSyncExternalStore(noopSubscribe, canScanQr, () => false);

  // A freshly signed prescription is handed to the pharmacy input.
  const [seenHandoff, setSeenHandoff] = useState(handoff);
  if (handoff !== seenHandoff) {
    setSeenHandoff(handoff);
    if (handoff) {
      setToken(handoff);
      setResult(null);
    }
  }

  const check = useCallback(
    (t: string) => {
      const r = verifyRx(t, state.directory);
      setResult(r);
      setMessage(null);
      setState((s) => audit(s, `pharmacy:${pharmacyId}`, r.ok ? "rx.verified" : "rx.rejected", { rx: r.payload?.id ?? null, reason: r.ok ? null : r.reason }));
    },
    [state.directory, pharmacyId, audit, setState],
  );

  // A forger multiplies every quantity by 10 but keeps the doctor's signature.
  function tamper() {
    const forged = forgeQuantity(token);
    if (!forged) return;
    setToken(forged);
    check(forged);
  }

  const view = result?.ok ? pharmacyView(result.payload, state.events, pharmacyId) : null;

  function doDispense(item: RxItem, remaining: number) {
    if (!result?.ok) return;
    const sub = subs[item.n]?.trim();
    const r = dispense(result.payload, state.events, {
      itemNo: item.n,
      qty: qty[item.n] ?? remaining,
      pharmacyId,
      online,
      substituted: !!sub,
      dispensedDrug: sub || item.drug,
    });
    if (!r.ok) {
      setMessage({ ok: false, text: `${item.drug}: ${DISPENSE_MESSAGES[r.reason]}${r.reason === "exceeds_remaining" ? ` Only ${r.remaining} left.` : ""}` });
      setState((s) => audit(s, `pharmacy:${pharmacyId}`, "dispense.refused", { rx: result.payload.id, item: item.n, reason: r.reason }));
      return;
    }
    setMessage({ ok: true, text: `Dispensed ${r.event.qty} × ${r.event.dispensedDrug}. ${r.remainingAfter} left on this line.` });
    setState((s) => audit({ ...s, events: [...s.events, r.event] }, `pharmacy:${pharmacyId}`, "dispense", { rx: result.payload.id, item: item.n, qty: r.event.qty, substituted: r.event.substituted, online }));
  }

  return (
    <section className="app-surface space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-black">Pharmacy</h2>
        <div className="flex items-center gap-3">
          <select aria-label="Pharmacy" className="field-input w-auto py-1.5 text-xs" value={pharmacyId} onChange={(e) => { setPharmacyId(e.target.value); setMessage(null); }}>
            {PHARMACIES.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <label className="flex items-center gap-1 text-xs font-bold">
            <input type="checkbox" className="accent-[#e43d35]" checked={online} onChange={(e) => setOnline(e.target.checked)} />
            Online
          </label>
        </div>
      </div>
      <textarea aria-label="Prescription token" className="field-input h-24 font-mono text-[11px]" placeholder="Scan the QR or paste the token (CDX1.…)" value={token} onChange={(e) => setToken(e.target.value.trim())} />
      <div className="flex flex-wrap gap-2">
        <button className="control-button bg-ink text-card" onClick={() => check(token)} disabled={!token}>Verify</button>
        {scanSupported ? <button className="control-button bg-card" onClick={() => setScanning(true)}>Scan QR</button> : null}
        <button className="control-button bg-card" onClick={tamper} disabled={!token} title="Multiply every quantity by 10 while keeping the original signature">Forgery test (×10 qty)</button>
      </div>
      {scanning ? <QrScanner onResult={(t) => { setScanning(false); setToken(t); check(t); }} onClose={() => setScanning(false)} /> : null}

      {result ? (
        result.ok ? (
          <div className="space-y-3">
            <div className="rounded-lg border-2 border-success bg-success/10 p-3 text-sm">
              <p className="font-black text-success">Genuine · signed by {result.prescriber}</p>
              <p className="mt-1 text-xs text-ink/70">{result.payload.doc.reg} · {result.payload.doc.council} · issued {fmt(result.payload.iat)} · valid until {fmt(result.payload.exp)}</p>
              <p className="mt-1 text-xs text-ink/70">Patient ref {result.payload.pt.h.slice(0, 10)}… · {result.payload.pt.age ?? "?"}{result.payload.pt.sex ?? ""}</p>
            </div>
            <ul className="space-y-2">
              {view!.map(({ item, remaining, dispensedHere, dispensedElsewhere }) => (
                <li key={item.n} className="app-panel space-y-2 p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-black">{item.n}. {item.drug}</p>
                      <p className="text-xs text-ink/60">{item.sig || "—"}{item.noSub ? " · no substitution" : ""}{item.controlled ? ` · ${item.controlled}: online only` : ""}</p>
                    </div>
                    <p className="shrink-0 text-right text-xs">
                      <b className="text-base">{remaining}</b>/{item.qty} left
                      {dispensedElsewhere ? <span className="block text-ink/55">{dispensedElsewhere} dispensed elsewhere</span> : null}
                      {dispensedHere ? <span className="block text-ink/55">{dispensedHere} dispensed here</span> : null}
                    </p>
                  </div>
                  {remaining > 0 ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <input aria-label="Quantity to dispense" type="number" min={1} max={remaining} className="field-input w-20 py-1 text-sm" value={qty[item.n] ?? remaining} onChange={(e) => setQty({ ...qty, [item.n]: Number(e.target.value) })} />
                      {!item.noSub ? <input aria-label="Substitute brand" className="field-input w-44 py-1 text-sm" placeholder="Substitute (optional)" value={subs[item.n] ?? ""} onChange={(e) => setSubs({ ...subs, [item.n]: e.target.value })} /> : null}
                      <button className="control-button bg-accent text-white" onClick={() => doDispense(item, remaining)}>Dispense</button>
                    </div>
                  ) : (
                    <p className="text-xs font-black uppercase text-ink/50">Fully dispensed</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-lg border-2 border-danger bg-danger/10 p-3 text-sm font-black text-danger">{VERIFY_TEXT[result.reason]}</div>
        )
      ) : null}
      {message ? <p role="status" className={`text-sm font-bold ${message.ok ? "text-success" : "text-danger"}`}>{message.text}</p> : null}
      <p className="text-xs text-ink/55">Try it: dispense one line at Pharmacy A, switch to Pharmacy B, verify again, and try to collect the same line.</p>
    </section>
  );
}

function LedgerPanel({ state, setState }: { state: State; setState: Setter }) {
  const [tampered, setTampered] = useState<AuditEntry[] | null>(null);
  const chain = tampered ?? state.audit;
  const integrity = useMemo(() => verifyChain(chain), [chain]);

  const h1 = useMemo(() => {
    const byId = new Map(state.issued.map((i) => [i.id, i.token]));
    return state.events.flatMap((e) => {
      const tok = byId.get(e.rxId);
      const r = tok ? verifyRx(tok, state.directory, e.at) : null;
      const payload = r && (r.ok ? r.payload : r.payload);
      const item = payload?.items.find((it) => it.n === e.itemNo);
      if (!payload || !item?.controlled) return [];
      return [{ e, payload, item }];
    });
  }, [state]);

  function downloadH1() {
    const rows = [["Date", "Rx", "Patient ref", "Prescriber", "Reg no", "Medicine", "Qty", "Pharmacy"], ...h1.map(({ e, payload, item }) => [fmt(e.at), payload.id, payload.pt.h, payload.doc.name, payload.doc.reg, e.dispensedDrug || item.drug, String(e.qty), e.pharmacyId])];
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "schedule-h1-register.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="app-surface space-y-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-black">Ledger &amp; audit</h2>
        <button className="control-button bg-card text-xs" onClick={() => { if (confirm("Reset the demo (keys, ledger and audit log)?")) { setState(EMPTY); setTampered(null); } }}>Reset demo</button>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <p className="console-label">Dispense events ({state.events.length})</p>
          <div className="mt-2 max-h-64 overflow-auto">
            <table className="w-full text-left text-xs">
              <thead><tr className="console-label"><th className="py-1">Time</th><th>Rx · line</th><th>Qty</th><th>Pharmacy</th></tr></thead>
              <tbody>
                {state.events.slice().reverse().map((e, i) => (
                  <tr key={i} className="border-t border-ink/10">
                    <td className="py-1.5 pr-2">{fmt(e.at)}</td>
                    <td className="pr-2">{e.rxId} · {e.itemNo}{e.substituted ? " (sub)" : ""}</td>
                    <td className="pr-2">{e.qty}</td>
                    <td>{e.pharmacyId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!state.events.length ? <p className="mt-2 text-xs text-ink/55">Nothing dispensed yet.</p> : null}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="console-label">Hash-chained audit log ({chain.length})</p>
            <span className={`text-xs font-black ${integrity.ok ? "text-success" : "text-danger"}`}>{integrity.ok ? "Chain intact" : `Tampering detected at #${integrity.brokenAt}`}</span>
          </div>
          <div className="mt-2 max-h-64 overflow-auto font-mono text-[10px] leading-4">
            {chain.slice().reverse().map((a) => (
              <p key={a.seq} className={`border-t border-ink/10 py-1 ${!integrity.ok && a.seq >= integrity.brokenAt ? "text-danger" : ""}`}>
                #{a.seq} {a.action} · {a.actor} · {a.hash.slice(0, 10)}… ← {a.prev.slice(0, 8)}
              </p>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <button className="control-button bg-card text-xs" disabled={state.audit.length < 2 || !!tampered} onClick={() => setTampered(state.audit.map((a, i) => (i === Math.floor(state.audit.length / 2) ? { ...a, data: { ...a.data, qty: 999 } } : a)))}>Edit an old entry</button>
            {tampered ? <button className="control-button bg-card text-xs" onClick={() => setTampered(null)}>Restore</button> : null}
          </div>
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between gap-2">
          <p className="console-label">Schedule H1 register (auto-generated)</p>
          <button className="control-button bg-card text-xs" onClick={downloadH1} disabled={!h1.length}>Download CSV</button>
        </div>
        {h1.length ? (
          <ul className="mt-2 space-y-1 text-xs">
            {h1.map(({ e, payload, item }, i) => (
              <li key={i}>{fmt(e.at)} · {e.dispensedDrug || item.drug} × {e.qty} · {payload.doc.name} ({payload.doc.reg}) · patient {payload.pt.h.slice(0, 8)}… · {e.pharmacyId}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-ink/55">Dispense a controlled medicine (e.g. Ultracet or Alprax) to see it logged here automatically.</p>
        )}
      </div>
    </section>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="console-label mb-1 block">{label}</span>
      <input className="field-input py-1.5 text-sm" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
