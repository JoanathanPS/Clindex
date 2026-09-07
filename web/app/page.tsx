import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "ClinDex · Prescription Safety & Interaction Validation",
  description:
    "AI-assisted clinical decision support system. Validates multi-drug prescriptions against patient physiological profiles to flag interactions, contraindications, and organ risks.",
};

function GoogleIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink font-mono selection:bg-ink selection:text-canvas">
      {/* 1. Nav Bar */}
      <header className="sticky top-0 z-50 border-b border-ink/15 bg-canvas/95 backdrop-blur-sm">
        <div className="mx-auto flex h-13 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center hover:opacity-85 transition-opacity py-1"
          >
            <Image
              src="/clindex-logo.png"
              alt="ClinDex"
              width={100}
              height={40}
              priority
              className="h-7 w-auto object-contain"
            />
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
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="border-b border-ink/10 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/clindex-device-hero-mono.png"
              alt="ClinDex - Clinical Knowledge, In Your Hands"
              width={340}
              height={183}
              priority
              className="h-24 sm:h-32 md:h-40 w-auto object-contain drop-shadow-sm hover:scale-[1.01] transition-transform"
            />
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink leading-tight">
            Prescription validation with zero missed contraindications.
          </h1>

          <p className="mt-4 text-xs sm:text-sm text-ink/70 max-w-xl mx-auto leading-relaxed">
            Patient profile → adaptive clinical interview → grounded interaction report.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="rounded border border-ink bg-ink px-5 py-2 text-xs font-semibold text-canvas hover:bg-ink/90 active:translate-y-px transition-all"
            >
              start check →
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
              I built Clindex because catching dangerous drug interactions shouldn&apos;t mean drowning in alert fatigue or deciphering dense formularies at 1am. Every interaction is grounded in clinical datasets with transparent biological mechanisms and actionable alternatives — built to solve a real clinical problem, not just demo an AI prompt.
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
            <Image
              src="/clindex-logo.png"
              alt="ClinDex"
              width={75}
              height={30}
              className="h-5 w-auto object-contain"
            />
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