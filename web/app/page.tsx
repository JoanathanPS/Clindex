import Link from "next/link";
import Image from "next/image";

const medications = [
  ["Warfarin", "5 mg", "rose"],
  ["Aspirin", "81 mg", "sun"],
  ["Metformin", "1000 mg", "sky"],
] as const;

export const metadata = { title: "ClinDex | Prescription Safety", description: "Clinical prescription safety scanner." };

export default function HomePage() {
  return <main className="min-h-screen overflow-hidden bg-canvas text-ink">
    <div className="page-grid" aria-hidden="true" />
    <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
      <Link href="/" className="flex items-center gap-3"><span className="brand-orb"><i /></span><Image src="/clindex-logo.png" alt="ClinDex" width={100} height={40} priority className="h-7 w-auto" /></Link>
      <Link href="/login" className="device-button device-button-light">Open app</Link>
    </header>
    <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:py-16">
      <div className="order-2 lg:order-1"><p className="eyebrow"><span /> Live clinical console</p><h1 className="mt-5 max-w-xl text-4xl font-black leading-[.95] sm:text-6xl">Clinical safety, <em>captured.</em></h1><p className="mt-6 max-w-md text-sm leading-7 text-ink/65 sm:text-base">ClinDex turns a prescription and patient profile into a focused safety readout. Review interactions, organ risks, and a clear next action in one handheld view.</p><div className="mt-7 flex gap-4"><Link href="/login" className="device-button">Try the checker <span>&gt;</span></Link><a href="#workflow" className="device-link">How it works</a></div><p className="mt-10 border-t border-ink/20 pt-5 text-[10px] font-bold uppercase tracking-[.16em] text-ink/55">RxNorm grounded <b className="mx-4 text-accent">*</b> academic prototype</p></div>
      <div className="order-1 lg:order-2"><div className="pokedex-shell mx-auto max-w-[680px]"><div className="pokedex-hinge"><span /><span /><span /></div><div className="pokedex-top"><div className="lens"><i /></div><div className="flex gap-2 pt-2"><b className="indicator red" /><b className="indicator yellow" /><b className="indicator green" /></div><p>ClinDex 1.0</p></div><div className="pokedex-body"><div className="screen-bezel"><div className="screen-header"><span>Drug Safety Scanner</span><span>Live Scan 001</span></div><div className="screen-content"><div className="flex items-start justify-between border-b border-[#2c443a]/20 pb-3"><div><p className="screen-label">Patient profile</p><h2>Eleanor Vance <span>/ 71F</span></h2></div><b className="screen-status">Needs review</b></div><div className="grid grid-cols-3 py-3 text-center"><div><p className="screen-label">Renal</p><b>eGFR 28</b></div><div className="border-x border-[#2c443a]/20"><p className="screen-label">Alerts</p><b className="text-[#c74038]">02</b></div><div><p className="screen-label">Drugs</p><b>03</b></div></div><div className="space-y-2 border-t border-[#2c443a]/20 py-3">{medications.map(([name,dose,color]) => <div key={name} className="med-row"><i className={`med-dot ${color}`} /><b>{name}</b><span>{dose}</span></div>)}</div><div className="alert-card"><b>Warfarin + Aspirin <span>HIGH</span></b><p>Elevated bleeding risk. Consider gastroprotection and INR monitoring.</p></div><div className="alert-card caution"><b>Metformin + CKD G4 <span>AVOID</span></b><p>eGFR is below the 30 mL/min cutoff. Review alternative therapy.</p></div></div></div><div className="pokedex-controls"><div className="d-pad"><i /></div><div className="control-center"><i /><div><b>A</b><b>B</b></div><p>SELECT <span>START</span></p></div><div className="speaker"><i /><i /><i /><i /><i /></div></div></div><div className="pokedex-foot"><span>Clinical decision support only</span><span>+ live system</span></div></div></div>
    </section>
    <section id="workflow" className="relative z-10 border-y-2 border-ink bg-ink px-5 py-4 text-card"><div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3 text-xs font-bold uppercase tracking-[.14em]"><span>Interaction intelligence</span><span className="text-[#e6bd43]">Built for deliberate clinical review</span><span>Patient-specific context</span></div></section>
    <section className="relative z-10 mx-auto grid max-w-7xl gap-4 px-5 py-14 sm:grid-cols-3 sm:px-8">{[["01","Scan","Add medications and the patient profile."],["02","Triangulate","ClinDex identifies missing clinical context."],["03","Review","Receive clear risk notes and practical alternatives."]].map(([num,title,body]) => <div key={num} className="border-t-2 border-ink pt-4"><b className="text-xs text-accent">{num}</b><h2 className="mt-3 text-xl font-black">{title}</h2><p className="mt-2 max-w-xs text-sm leading-6 text-ink/65">{body}</p></div>)}</section>
  </main>;
}
