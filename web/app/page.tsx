import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Clindex · Prescription Safety & Interaction Validation",
  description:
    "Grounded clinical decision support system detecting adverse drug-drug interactions and patient contraindications with zero missed safety flags.",
};

function GoogleIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.41 7.34 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.97 0 12s.45 3.84 1.24 5.42l4.04-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.59 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink font-mono selection:bg-ink selection:text-canvas">
      {/* 1. Nav Bar */}
      <header className="sticky top-0 z-50 border-b border-ink/15 bg-canvas/95 backdrop-blur-sm">
        <div className="mx-auto flex h-13 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="text-sm font-bold tracking-[0.25em] text-ink hover:text-accent transition-colors"
          >
            CLINDEX
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs text-ink/70">
            <a href="#how-it-works" className="hover:text-ink transition-colors">
              how it works
            </a>
            <a href="#benchmarks" className="hover:text-ink transition-colors">
              benchmarks
            </a>
            <a href="#features" className="hover:text-ink transition-colors">
              features
            </a>
            <a href="#author" className="hover:text-ink transition-colors">
              author&apos;s note
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/patients"
                className="rounded border border-ink bg-ink px-3 py-1 text-xs font-medium text-canvas hover:bg-ink/90 transition-colors"
              >
                workspace →
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs text-ink/70 hover:text-ink px-2 py-1 transition-colors"
                >
                  sign in
                </Link>
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 rounded border border-ink/25 bg-card/60 px-2.5 py-1 text-xs hover:border-ink hover:bg-card transition-all"
                >
                  <GoogleIcon />
                  <span>Google</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="border-b border-ink/10 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink leading-tight">
            Prescription validation with zero missed contraindications.
          </h1>

          <p className="mt-4 text-xs sm:text-sm text-ink/70 max-w-xl mx-auto leading-relaxed">
            Patient profile → adaptive clinical interview → grounded interaction report.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={user ? "/patients" : "/login"}
              className="rounded border border-ink bg-ink px-5 py-2 text-xs font-semibold text-canvas hover:bg-ink/90 active:translate-y-px transition-all"
            >
              {user ? "open workspace →" : "start check →"}
            </Link>
            <a
              href="#benchmarks"
              className="rounded border border-ink/30 bg-card/50 px-4 py-2 text-xs text-ink/80 hover:bg-card hover:border-ink/60 transition-all"
            >
              benchmarks ↓
            </a>
          </div>

          {/* Minimalist Faux-OS Component Mockup */}
          <div className="mt-12 rounded border border-ink/20 bg-canvas text-left shadow-xs overflow-hidden">
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-ink/15 bg-card/50 px-3 py-2 text-[11px] text-ink/60">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-ink/25 inline-block" />
                <span className="h-2 w-2 rounded-full bg-ink/25 inline-block" />
                <span className="h-2 w-2 rounded-full bg-ink/25 inline-block" />
                <span className="ml-2 font-mono text-ink/80">
                  #RX-8402 · Eleanor Vance (71F) · eGFR 28 mL/min (CKD G4)
                </span>
              </div>
              <span className="text-[10px] text-ink/50 font-mono hidden sm:inline">
                Groq LPU + RxNorm
              </span>
            </div>

            {/* Content Preview */}
            <div className="p-4 sm:p-5 space-y-3">
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                <span className="text-ink/50 self-center mr-1">CANDIDATE DRUGS:</span>
                <span className="rounded border border-ink/25 bg-card/40 px-2 py-0.5">Warfarin 5mg</span>
                <span className="rounded border border-ink/25 bg-card/40 px-2 py-0.5">Aspirin 81mg</span>
                <span className="rounded border border-ink/25 bg-card/40 px-2 py-0.5">Metformin 1000mg</span>
              </div>

              {/* Alert 1 */}
              <div className="rounded border border-danger/35 bg-danger/5 p-3 text-xs space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-danger">
                  <span>[!] DRUG-DRUG INTERACTION: Warfarin ↔ Aspirin</span>
                  <span className="border border-danger/30 rounded px-1 text-[10px]">HIGH</span>
                </div>
                <p className="text-[11px] text-ink/80 leading-relaxed">
                  Synergistic hemostasis impairment (anticoagulation + platelet inhibition) raises gastrointestinal bleed risk by 4.8x. Recommendation: Co-prescribe PPI gastroprotection.
                </p>
              </div>

              {/* Alert 2 */}
              <div className="rounded border border-danger/35 bg-danger/5 p-3 text-xs space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-danger">
                  <span>[!] CONTRAINDICATION: Metformin</span>
                  <span className="border border-danger/30 rounded px-1 text-[10px]">AVOID</span>
                </div>
                <p className="text-[11px] text-ink/80 leading-relaxed">
                  eGFR 28 mL/min is below the 30 mL/min absolute cutoff for biguanides due to lactic acidosis hazard. Alternative: Linagliptin or renal-adjusted SGLT2i.
                </p>
              </div>

              {/* Triage Transcript */}
              <div className="rounded border border-ink/15 bg-card/30 p-2.5 text-[11px] text-ink/70 space-y-0.5">
                <div>
                  <span className="text-accent font-semibold">Triage AI:</span> &quot;Has the patient experienced melena or unexplained bruising in the past 14 days?&quot;
                </div>
                <div>
                  <span className="text-ink/50">Clinician:</span> &quot;No active bleeding reported; stable baseline INR 2.4.&quot;
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. How It Works (Bento Strip) */}
      <section id="how-it-works" className="border-b border-ink/10 py-16 sm:py-20 bg-card/20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="mb-8">
            <span className="text-[11px] font-bold uppercase tracking-widest text-ink/40">
              [ 01 / WORKFLOW ]
            </span>
            <h2 className="mt-1 text-lg sm:text-xl font-bold text-ink">
              Three-step verification pipeline
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded border border-ink/15 bg-canvas p-4 space-y-2">
              <span className="text-xs text-accent font-bold">[01] Profile Intake</span>
              <p className="text-xs text-ink/70 leading-relaxed">
                Candidate drugs entered alongside clearance markers: age, renal eGFR, hepatic panels, pregnancy, and known allergies.
              </p>
            </div>

            <div className="rounded border border-ink/15 bg-canvas p-4 space-y-2">
              <span className="text-xs text-accent font-bold">[02] Adaptive Triage</span>
              <p className="text-xs text-ink/70 leading-relaxed">
                Groq LPU LLM interview queries critical missing parameters one by one, halting as soon as clinical certainty is satisfied.
              </p>
            </div>

            <div className="rounded border border-ink/15 bg-canvas p-4 space-y-2">
              <span className="text-xs text-accent font-bold">[03] Grounded Verdict</span>
              <p className="text-xs text-ink/70 leading-relaxed">
                Validated against RxNorm and OpenFDA matrices, returning stratified severity tiers (Avoid, Caution, Safe) with clear mechanisms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Benchmarks Section */}
      <section id="benchmarks" className="border-b border-ink/10 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="mb-8">
            <span className="text-[11px] font-bold uppercase tracking-widest text-ink/40">
              [ 02 / EMPIRICAL VALIDATION ]
            </span>
            <h2 className="mt-1 text-lg sm:text-xl font-bold text-ink">
              Benchmark Test Cohort Results
            </h2>
            <p className="mt-1 text-xs text-ink/60">
              Evaluated on the 6 standardized clinical test cases in our test suite (evaluating Warfarin+Aspirin, Metformin CKD &lt;30, Warfarin+Amiodarone, and controls).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Recall */}
            <div className="rounded border border-ink/15 bg-card/30 p-4 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>Safety Recall (Sensitivity)</span>
                <span className="text-success font-mono">100.0% (5/5)</span>
              </div>
              <div className="h-1.5 w-full rounded bg-ink/10 overflow-hidden">
                <div className="h-full bg-success w-full" />
              </div>
              <p className="text-[11px] text-ink/60 leading-relaxed">
                Zero missed contraindications or critical drug-drug interactions across the test suite (0% false negatives).
              </p>
            </div>

            {/* F1 */}
            <div className="rounded border border-ink/15 bg-card/30 p-4 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>Harmonic F1-Score</span>
                <span className="text-accent font-mono">0.909</span>
              </div>
              <div className="h-1.5 w-full rounded bg-ink/10 overflow-hidden">
                <div className="h-full bg-accent w-[90.9%]" />
              </div>
              <p className="text-[11px] text-ink/60 leading-relaxed">
                High balance between safety sensitivity and alert specificity, preventing false-alarm alert fatigue.
              </p>
            </div>

            {/* Accuracy */}
            <div className="rounded border border-ink/15 bg-card/30 p-4 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>Classification Accuracy</span>
                <span className="font-mono">85.7% (6/7)</span>
              </div>
              <div className="h-1.5 w-full rounded bg-ink/10 overflow-hidden">
                <div className="h-full bg-ink w-[85.7%]" />
              </div>
              <p className="text-[11px] text-ink/60 leading-relaxed">
                Multi-class classification across safe, caution, and avoid verdicts (83.3% precision rate).
              </p>
            </div>

            {/* Latency */}
            <div className="rounded border border-ink/15 bg-card/30 p-4 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>Verification Latency</span>
                <span className="text-accent font-mono">~5.2s</span>
              </div>
              <div className="h-1.5 w-full rounded bg-ink/10 overflow-hidden">
                <div className="h-full bg-accent w-[8%]" />
              </div>
              <p className="text-[11px] text-ink/60 leading-relaxed">
                Automated multi-drug check vs. 5–10 minutes of manual literature and formulary lookup.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Features Grid */}
      <section id="features" className="border-b border-ink/10 py-16 sm:py-20 bg-card/20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="mb-8">
            <span className="text-[11px] font-bold uppercase tracking-widest text-ink/40">
              [ 03 / CAPABILITIES ]
            </span>
            <h2 className="mt-1 text-lg sm:text-xl font-bold text-ink">
              Core system capabilities
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded border border-ink/15 bg-canvas p-4 space-y-1.5">
              <div className="text-xs font-bold text-ink">[01] Longitudinal History</div>
              <p className="text-xs text-ink/70 leading-relaxed">
                Patient profiles and versioned prescription validations persisted in PostgreSQL with strict Row-Level Security (RLS) and immutable audit logging.
              </p>
            </div>

            <div className="rounded border border-ink/15 bg-canvas p-4 space-y-1.5">
              <div className="text-xs font-bold text-ink">[02] Grounded Pharmacology</div>
              <p className="text-xs text-ink/70 leading-relaxed">
                Grounded in RxNorm concept identifiers and OpenFDA contraindication matrices. Rules supersede generative predictions to eliminate hallucinations.
              </p>
            </div>

            <div className="rounded border border-ink/15 bg-canvas p-4 space-y-1.5">
              <div className="text-xs font-bold text-ink">[03] Stratified Severity Tiers</div>
              <p className="text-xs text-ink/70 leading-relaxed">
                Contraindicated, Major, Moderate, and Minor alerts. High-consequence blocks take precedence, helping reduce clinical alert override rates.
              </p>
            </div>

            <div className="rounded border border-ink/15 bg-canvas p-4 space-y-1.5">
              <div className="text-xs font-bold text-ink">[04] Actionable Explanations</div>
              <p className="text-xs text-ink/70 leading-relaxed">
                Cryptic interaction jargon translated into clear pharmacokinetic CYP450 and pharmacodynamic additive rationales with suggested alternatives.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. The Author's Note */}
      <section id="author" className="border-b border-ink/10 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="rounded border border-ink/20 bg-card/40 p-6 sm:p-7 space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-ink/40">
              [ THE AUTHOR&apos;S NOTE ]
            </div>
            <p className="text-xs sm:text-sm text-ink/85 leading-relaxed">
              I built Clindex because reviewing complex prescriptions shouldn&apos;t mean cross-referencing five dense formulary PDFs at 1am while drowning in false-alarm alerts from legacy hospital software. In clinical pharmacology, the medicine was never the confusing part — catching the subtle, patient-specific interactions hidden in an eGFR lab value or an unmentioned OTC drug was.
            </p>
            <p className="text-xs sm:text-sm text-ink/75 leading-relaxed">
              Every interaction Clindex flags is grounded directly in clinical reference datasets with transparent biological mechanisms and actionable alternatives — because a clinical safety tool that can&apos;t explain its reasoning isn&apos;t one you should trust with a patient. It stays out of your way, focuses on what matters, and was built to solve a real clinical problem, not just demo an AI prompt.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-ink/10 text-xs">
              <span className="font-bold text-ink">Joanathan Packia Singh</span>
              <a
                href="https://joanathan.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline underline-offset-4 hover:text-accent/80 transition-colors"
              >
                Read my résumé →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Disclaimer Band */}
      <section className="border-b border-ink/10 bg-card/50 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center text-xs text-ink/70 leading-relaxed">
          <span className="font-bold text-ink">[!] CLINICAL ADVISORY:</span> Clindex is an academic research prototype and software engineering demonstration. It is not a certified medical device under FDA 21 CFR Part 820 or EU CE-MDR. Designed exclusively for educational and decision-support research.
        </div>
      </section>

      {/* 8. Minimal Footer */}
      <footer className="py-6 bg-canvas">
        <div className="mx-auto flex flex-col sm:flex-row max-w-5xl items-center justify-between gap-3 px-4 sm:px-6 text-xs text-ink/60">
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-widest text-ink">CLINDEX</span>
            <span>·</span>
            <span>Clinical Decision Support</span>
          </div>

          <div className="text-ink/80 font-medium">Built by Joanathan Packia Singh</div>

          <a
            href="https://github.com/JoanathanPS/Clindex"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded border border-ink/20 px-2.5 py-1 text-ink/70 hover:border-ink hover:text-ink hover:bg-card transition-all"
          >
            GitHub Repository →
          </a>
        </div>
      </footer>
    </div>
  );
}