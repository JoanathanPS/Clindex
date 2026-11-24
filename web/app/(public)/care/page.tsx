import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Care", description: "When and where to see a doctor." };

const OPTIONS = [
  {
    title: "Emergency",
    body: "Chest pain, breathing difficulty, fainting, seizure, severe bleeding or signs of stroke.",
    action: { label: "Call 112", href: "tel:112" },
    tone: "border-danger !bg-danger text-white",
  },
  {
    title: "Free online consultation",
    body: "eSanjeevani is the Government of India's free national teleconsultation service, with doctors and specialists by video.",
    action: { label: "Open eSanjeevani", href: "https://esanjeevani.mohfw.gov.in" },
    tone: "bg-card",
  },
  {
    title: "Not sure if you need a doctor?",
    body: "Answer a few questions. Warning signs are checked before any medicine is mentioned.",
    action: { label: "Check symptoms", href: "/ask" },
    tone: "bg-card",
  },
];

export default function CarePage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow"><span />Care</p>
        <h1 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">Get to the right care, fast.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/70">
          ClinDex does not replace a doctor. When something needs a professional, we send you to one — and the prescription they write can be verified at any pharmacy.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {OPTIONS.map((o) => (
          <section key={o.title} className={`flex flex-col rounded-xl border-2 border-ink p-5 shadow-[4px_4px_0_#24201e] ${o.tone === "bg-card" ? "bg-card" : "bg-danger text-white"}`}>
            <h2 className="text-xl font-black">{o.title}</h2>
            <p className="mt-2 flex-1 text-sm leading-6 opacity-85">{o.body}</p>
            {o.action.href.startsWith("/") ? (
              <Link href={o.action.href} className="device-button device-button-light mt-4 self-start">{o.action.label}</Link>
            ) : (
              <a href={o.action.href} className="device-button device-button-light mt-4 self-start" target={o.action.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">{o.action.label}</a>
            )}
          </section>
        ))}
      </div>
      <section className="app-panel p-5">
        <h2 className="font-black">Partner doctors</h2>
        <p className="mt-2 text-sm leading-6 text-ink/70">
          In-app booking with verified doctors who issue signed ClinDex prescriptions is on the roadmap. Doctors interested in piloting can use the <Link href="/rx" className="font-bold underline">signed prescription demo</Link> today.
        </p>
      </section>
    </div>
  );
}
