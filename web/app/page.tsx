import Link from "next/link";
import Image from "next/image";
import { PokedexDevice } from "@clindex/ui";
import { PublicNav } from "@/components/public/public-nav";

const medications = [
  ["Dolo 650", "₹2.28/tab", "rose"],
  ["Same salt", "₹0.33/tab", "sun"],
  ["Ecosprin 75", "Warfarin!", "sky"],
] as const;

const DOORS = [
  { href: "/find", num: "01", title: "Find", body: "Price the whole prescription. Same salt, same strength, cheapest brand — plus Jan Aushadhi." },
  { href: "/find", num: "02", title: "Check", body: "Patient-aware interaction and kidney, pregnancy and age checks before anyone pays." },
  { href: "/ask", num: "03", title: "Ask", body: "What a medicine does, from the official label — and warning signs before self-care." },
  { href: "/rx", num: "04", title: "Rx", body: "Signed QR prescriptions that cannot be forged or collected twice, even across pharmacies." },
  { href: "/care", num: "05", title: "Care", body: "Routes you to emergency care or a free government teleconsultation when it matters." },
];

export const metadata = { title: "ClinDex | Every medicine, checked and found", description: "Check a prescription for interactions, find the cheapest same-salt basket, and verify signed prescriptions." };

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-canvas text-ink">
      <div className="page-grid" aria-hidden="true" />
      <PublicNav />
      <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-10 sm:px-8 lg:grid-cols-[.85fr_1.15fr] lg:py-16">
        <div className="order-2 lg:order-1">
          <Image src="/clindex-device-hero-mono.png" alt="" width={340} height={183} className="mb-6 h-12 w-auto object-contain sm:h-14" />
          <h1 className="max-w-xl text-4xl font-black leading-[.95] sm:text-6xl">Every medicine. <em>Checked.</em> Found.</h1>
          <p className="mt-6 max-w-md text-sm leading-7 text-ink/65 sm:text-base">
            Type what the doctor wrote. ClinDex checks it against the patient, finds the same salt for less, and makes prescriptions you can verify.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Link href="/find" className="device-button">Check a prescription <span>&gt;</span></Link>
            <Link href="/ask" className="device-link">Ask about a medicine</Link>
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <PokedexDevice className="mx-auto max-w-[680px]" screenTitle="Basket Scanner" screenTag="Scan 001" footer={["Decision support only", "246k medicines"]}>
            <div className="flex items-start justify-between border-b border-[#2c443a]/20 pb-3">
              <div><p className="screen-label">Prescription</p><h2>4 medicines <span>/ 67F · eGFR 28</span></h2></div>
              <b className="screen-status">Needs review</b>
            </div>
            <div className="grid grid-cols-3 py-3 text-center">
              <div><p className="screen-label">As written</p><b>₹121</b></div>
              <div className="border-x border-[#2c443a]/20"><p className="screen-label">Alerts</p><b className="text-[#c74038]">02</b></div>
              <div><p className="screen-label">Same salt</p><b>₹64</b></div>
            </div>
            <div className="space-y-2 border-t border-[#2c443a]/20 py-3">
              {medications.map(([name, dose, color]) => (
                <div key={name} className="med-row"><i className={`med-dot ${color}`} /><b>{name}</b><span>{dose}</span></div>
              ))}
            </div>
            <div className="alert-card"><b>Warfarin + Aspirin <span>HIGH</span></b><p>Elevated bleeding risk. Monitor INR; discuss before combining.</p></div>
            <div className="alert-card caution"><b>Metformin + eGFR 28 <span>AVOID</span></b><p>Below the 30 mL/min cutoff. Review alternative therapy.</p></div>
          </PokedexDevice>
        </div>
      </section>
      <section className="relative z-10 border-y-2 border-ink bg-ink px-5 py-4 text-card">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3 text-xs font-bold uppercase tracking-[.14em]">
          <span>246k medicines · 15k salt groups</span>
          <span className="text-[#e6bd43]">Ranking never depends on commission</span>
          <span>Signed · verifiable · single-use</span>
        </div>
      </section>
      <section className="relative z-10 mx-auto grid max-w-7xl gap-4 px-5 py-14 sm:grid-cols-2 sm:px-8 lg:grid-cols-5">
        {DOORS.map((d) => (
          <Link key={d.title} href={d.href} className="group border-t-2 border-ink pt-4">
            <b className="text-xs text-accent">{d.num}</b>
            <h2 className="mt-3 text-xl font-black group-hover:text-accent">{d.title}</h2>
            <p className="mt-2 text-sm leading-6 text-ink/65">{d.body}</p>
          </Link>
        ))}
      </section>
      <footer className="relative z-10 border-t-2 border-ink bg-card px-4 py-4 text-center text-[10px] font-bold uppercase tracking-[.1em] text-ink/55">
        Information and decision support only — not a certified medical device and not medical advice.
      </footer>
    </main>
  );
}
