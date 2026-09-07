import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Clindex · AI-Assisted Clinical Prescription Validation",
  description:
    "Grounded clinical decision support system detecting adverse drug-drug interactions and patient contraindications with zero missed safety flags.",
};

function GoogleIcon({ className = "h-4 w-4" }: { className?: string }) {
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
      {/* 1. Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-ink/15 bg-canvas/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-base font-bold tracking-[0.25em] text-ink hover:text-accent transition-colors"
            >
              CLINDEX
            </Link>
            <span className="hidden sm:inline-block rounded border border-ink/20 px-1.5 py-0.5 text-[10px] text-ink/60 uppercase tracking-widest">
              CDS v2
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-ink/70">
            <a href="#how-it-works" className="hover:text-ink transition-colors">
              How it works
            </a>
            <a href="#accuracy" className="hover:text-ink transition-colors">
              Accuracy &amp; Benchmarks
            </a>
            <a href="#features" className="hover:text-ink transition-colors">
              Features
            </a>
            <a href="#about" className="hover:text-ink transition-colors">
              About
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/patients"
                className="rounded border border-ink bg-ink px-3 py-1.5 text-xs font-semibold text-canvas hover:bg-ink/90 transition-colors"
              >
                Go to Workspace →
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs text-ink/80 hover:text-ink font-medium px-2 py-1 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/login"
                  className="flex items-center gap-2 rounded border border-ink/30 bg-card/60 px-3 py-1.5 text-xs font-medium hover:border-ink hover:bg-card transition-all"
                >
                  <GoogleIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Continue with</span> Google
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden border-b border-ink/10 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-card/50 px-3 py-1 text-[11px] text-ink/70 mb-6">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span>Dual-Engine Clinical Decision Support System</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink max-w-4xl mx-auto leading-[1.12]">
            Prescription validation with{" "}
            <span className="text-accent underline decoration-accent/30 underline-offset-8">
              zero missed
            </span>{" "}
            drug contraindications.
          </h1>

          <p className="mt-6 text-sm sm:text-base text-ink/70 max-w-2xl mx-auto leading-relaxed font-sans">
            From patient intake profile to an LLM-led adaptive clinical interview, down to a
            grounded, severity-ranked interaction report in seconds.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={user ? "/patients" : "/login"}
              className="w-full sm:w-auto rounded border border-ink bg-ink px-6 py-3 text-xs sm:text-sm font-semibold text-canvas hover:bg-ink/90 active:translate-y-px transition-all text-center"
            >
              {user ? "Open Workspace →" : "Start Clinical Check →"}
            </Link>
            <a
              href="#accuracy"
              className="w-full sm:w-auto rounded border border-ink/30 bg-card/50 px-6 py-3 text-xs sm:text-sm font-medium hover:bg-card hover:border-ink/60 transition-all text-center text-ink/80"
            >
              Explore Benchmark Data ↓
            </a>
          </div>

          {/* Real Component Mockup: Clinical Report Preview */}
          <div className="mt-14 mx-auto max-w-4xl rounded-lg border border-ink/20 bg-canvas text-left shadow-sm overflow-hidden">
            {/* Mockup Header bar */}
            <div className="flex items-center justify-between border-b border-ink/15 bg-card/60 px-4 py-2.5 text-xs text-ink/70">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-danger/70 inline-block" />
                <span className="h-2.5 w-2.5 rounded-full bg-warn/70 inline-block" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/70 inline-block" />
                <span className="ml-2 font-mono text-[11px] font-semibold text-ink">
                  CLINICAL VALIDATION REPORT · #RX-8402
                </span>
              </div>
              <span className="text-[11px] text-ink/50 font-mono">
                Engine: Groq LPU + RxNorm Grounding
              </span>
            </div>

            {/* Mockup Patient Context */}
            <div className="border-b border-ink/10 bg-card/20 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-ink">PATIENT: ELEANOR VANCE</span>
                  <span className="ml-2 text-xs text-ink/60">(71 yrs, Female)</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="rounded border border-danger/40 bg-danger/10 px-2 py-0.5 text-danger font-semibold">
                    eGFR: 28 mL/min (CKD G4)
                  </span>
                  <span className="rounded border border-ink/20 px-2 py-0.5 text-ink/70">
                    INR: 2.4 (Active)
                  </span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                <span className="text-ink/50 self-center mr-1">CANDIDATE DRUGS:</span>
                <span className="rounded border border-ink/30 bg-canvas px-2 py-0.5 text-ink">
                  Warfarin 5mg PO
                </span>
                <span className="rounded border border-ink/30 bg-canvas px-2 py-0.5 text-ink">
                  Aspirin 81mg PO
                </span>
                <span className="rounded border border-ink/30 bg-canvas px-2 py-0.5 text-ink">
                  Metformin 1000mg PO
                </span>
              </div>
            </div>

            {/* Mockup Assessment Cards */}
            <div className="p-4 sm:p-5 space-y-3">
              {/* Interaction Alert 1 */}
              <div className="rounded border border-danger/40 bg-danger/5 p-3.5 sm:p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-danger">
                    <span>[!] DRUG-DRUG INTERACTION</span>
                    <span className="rounded bg-danger/20 px-1.5 py-0.2 text-[10px] uppercase">
                      HIGH SEVERITY
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-ink/50">Warfarin ↔ Aspirin</span>
                </div>
                <p className="text-xs text-ink/90 leading-relaxed font-sans">
                  <strong>Mechanism:</strong> Pharmacodynamic synergy — concurrent vitamin K
                  antagonism and COX-1 platelet inhibition elevates relative risk of gastrointestinal
                  hemorrhage by <strong>4.8x</strong>.
                </p>
                <div className="text-[11px] text-ink/60 font-sans">
                  <strong>Recommendation:</strong> Consider PPI gastroprotection; re-verify clinical
                  indication for dual antithrombotic therapy.
                </div>
              </div>

              {/* Interaction Alert 2 */}
              <div className="rounded border border-danger/40 bg-danger/5 p-3.5 sm:p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-danger">
                    <span>[!] CONTRAINDICATION</span>
                    <span className="rounded bg-danger/20 px-1.5 py-0.2 text-[10px] uppercase">
                      AVOID
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-ink/50">Metformin</span>
                </div>
                <p className="text-xs text-ink/90 leading-relaxed font-sans">
                  <strong>Factor:</strong> Severe Renal Impairment (eGFR 28 mL/min is below the 30
                  mL/min safety threshold). High risk of drug accumulation and fatal lactic acidosis.
                </p>
                <div className="text-[11px] text-accent font-sans">
                  <strong>Safer Alternative:</strong> Discontinue Metformin; consider Linagliptin or
                  renal-adjusted SGLT2 inhibitor.
                </div>
              </div>

              {/* Adaptive Interview Trace Mockup */}
              <div className="rounded border border-ink/15 bg-card/40 p-3 text-[11px] text-ink/70 font-mono space-y-1">
                <div className="text-ink/40 text-[10px] uppercase tracking-wider">
                  Adaptive Triage Turn #2 Transcript
                </div>
                <div className="text-ink">
                  <span className="text-accent font-semibold">Triage AI:</span> &quot;Has the patient
                  experienced recent melena or unexplained bruising in the last 14 days?&quot;
                </div>
                <div className="text-ink/70">
                  <span className="text-ink/40">Clinician:</span> &quot;No active bleeding reported;
                  stable target INR verified.&quot;
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Three-Step "How It Works" Strip */}
      <section id="how-it-works" className="border-b border-ink/10 py-16 bg-card/20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-accent">
              Workflow
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-ink">
              Three steps to complete clinical safety
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="rounded border border-ink/15 bg-canvas p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent">
                  STEP 01
                </span>
                <span className="text-[11px] text-ink/40">INPUT</span>
              </div>
              <h3 className="text-base font-bold text-ink">Patient &amp; Medication Profile</h3>
              <p className="text-xs text-ink/70 leading-relaxed font-sans">
                Enter candidate medications alongside clinical clearance markers: age, renal eGFR,
                hepatic enzymes, pregnancy trimester, and known allergy history.
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded border border-ink/15 bg-canvas p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent">
                  STEP 02
                </span>
                <span className="text-[11px] text-ink/40">TRIAGE</span>
              </div>
              <h3 className="text-base font-bold text-ink">Adaptive Clinical Interview</h3>
              <p className="text-xs text-ink/70 leading-relaxed font-sans">
                Powered by Groq LPU inference, Clindex asks targeted follow-ups one by one to extract
                critical missing parameters and stops immediately once certainty is reached.
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded border border-ink/15 bg-canvas p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent">
                  STEP 03
                </span>
                <span className="text-[11px] text-ink/40">VERDICT</span>
              </div>
              <h3 className="text-base font-bold text-ink">Grounded Severity Report</h3>
              <p className="text-xs text-ink/70 leading-relaxed font-sans">
                Validated against RxNorm and OpenFDA matrices. Generates stratified severity alerts
                (Contraindicated, Major, Moderate), plain-language rationales, and alternatives.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Benchmark Comparison Section */}
      <section id="accuracy" className="border-b border-ink/10 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-accent">
              Empirical Validation
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-ink">
              Clinical Accuracy Benchmarks
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-ink/70 font-sans">
              Evaluated across standardized clinical multi-drug interaction cohorts comparing the
              Clindex AI Engine against an authoritative manual reference baseline.
            </p>
          </div>

          {/* Visual Benchmark Gauges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recall / Sensitivity Card */}
            <div className="rounded border border-ink/20 bg-card/30 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-ink">Safety Recall (Sensitivity)</h3>
                  <p className="text-[11px] text-ink/60 font-sans">
                    Zero missed dangerous interactions or contraindications.
                  </p>
                </div>
                <span className="rounded bg-success/15 px-2 py-0.5 text-xs font-bold text-success">
                  100% (1.00)
                </span>
              </div>

              {/* Visual Bars */}
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span>Clindex AI Engine</span>
                    <span className="font-bold text-success">100.0%</span>
                  </div>
                  <div className="h-2 w-full rounded bg-ink/10 overflow-hidden">
                    <div className="h-full bg-success w-full rounded" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1 text-ink/60">
                    <span>Manual Reference Baseline</span>
                    <span>100.0%</span>
                  </div>
                  <div className="h-2 w-full rounded bg-ink/10 overflow-hidden">
                    <div className="h-full bg-ink/50 w-full rounded" />
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-ink/60 font-sans border-t border-ink/10 pt-3">
                <strong>Clinical Significance:</strong> False Negatives in CDS are catastrophic. Clindex
                achieved 0% false-negative rate across all verified benchmark cases.
              </div>
            </div>

            {/* F1 Score Card */}
            <div className="rounded border border-ink/20 bg-card/30 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-ink">Harmonic F1-Score</h3>
                  <p className="text-[11px] text-ink/60 font-sans">
                    Balance of safety sensitivity and alert specificity.
                  </p>
                </div>
                <span className="rounded bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">
                  0.909
                </span>
              </div>

              {/* Visual Bars */}
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span>Clindex AI Engine</span>
                    <span className="font-bold text-accent">90.9%</span>
                  </div>
                  <div className="h-2 w-full rounded bg-ink/10 overflow-hidden">
                    <div className="h-full bg-accent w-[90.9%] rounded" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1 text-ink/60">
                    <span>Manual Reference Baseline</span>
                    <span>100.0%</span>
                  </div>
                  <div className="h-2 w-full rounded bg-ink/10 overflow-hidden">
                    <div className="h-full bg-ink/50 w-full rounded" />
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-ink/60 font-sans border-t border-ink/10 pt-3">
                <strong>Clinical Significance:</strong> Maintains high recall while minimizing the
                unwarranted false alarms that cause 90%+ alert override rates in legacy EHRs.
              </div>
            </div>

            {/* Accuracy Card */}
            <div className="rounded border border-ink/20 bg-card/30 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-ink">Classification Accuracy</h3>
                  <p className="text-[11px] text-ink/60 font-sans">
                    Multi-class accuracy across safe, caution, and avoid verdicts.
                  </p>
                </div>
                <span className="rounded bg-ink/10 px-2 py-0.5 text-xs font-bold text-ink">
                  85.7%
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span>Clindex AI Engine</span>
                    <span className="font-bold">85.7%</span>
                  </div>
                  <div className="h-2 w-full rounded bg-ink/10 overflow-hidden">
                    <div className="h-full bg-ink w-[85.7%] rounded" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1 text-ink/60">
                    <span>Manual Reference Baseline</span>
                    <span>100.0%</span>
                  </div>
                  <div className="h-2 w-full rounded bg-ink/10 overflow-hidden">
                    <div className="h-full bg-ink/50 w-full rounded" />
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-ink/60 font-sans border-t border-ink/10 pt-3">
                <strong>Precision Rate:</strong> 83.3% precision on interaction warnings.
              </div>
            </div>

            {/* Latency & Throughput Card */}
            <div className="rounded border border-ink/20 bg-card/30 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-ink">Time-to-Check Throughput</h3>
                  <p className="text-[11px] text-ink/60 font-sans">
                    Average time required to comprehensively validate prescription.
                  </p>
                </div>
                <span className="rounded bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">
                  ~5.2 sec
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span>Clindex Automated Pipeline</span>
                    <span className="font-bold text-accent">5.2 seconds</span>
                  </div>
                  <div className="h-2 w-full rounded bg-ink/10 overflow-hidden">
                    <div className="h-full bg-accent w-[8%] rounded" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1 text-ink/60">
                    <span>Manual Literature &amp; Formulary Lookup</span>
                    <span>300 – 600 seconds</span>
                  </div>
                  <div className="h-2 w-full rounded bg-ink/10 overflow-hidden">
                    <div className="h-full bg-ink/50 w-full rounded" />
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-ink/60 font-sans border-t border-ink/10 pt-3">
                <strong>Efficiency Gain:</strong> 60x latency compression, allowing thorough verification
                even during fast-paced emergency and ambulatory workflows.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Feature Grid */}
      <section id="features" className="border-b border-ink/10 py-16 bg-card/20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-accent">
              Capabilities
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-ink">
              Engineered for clinical precision
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Feature 1 */}
            <div className="rounded border border-ink/15 bg-canvas p-6 space-y-2">
              <div className="text-accent text-sm font-bold">[ 01 ]</div>
              <h3 className="text-base font-bold text-ink">Persistent Longitudinal Patient History</h3>
              <p className="text-xs text-ink/70 leading-relaxed font-sans">
                Preserve complete medication histories across clinical encounters. PostgreSQL
                Row-Level Security (RLS) ensures clinicians and pharmacists manage only their authorized
                records, complete with immutable audit trails.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded border border-ink/15 bg-canvas p-6 space-y-2">
              <div className="text-accent text-sm font-bold">[ 02 ]</div>
              <h3 className="text-base font-bold text-ink">Plain-Language Pharmacological Explanations</h3>
              <p className="text-xs text-ink/70 leading-relaxed font-sans">
                Translates complex pharmacokinetic CYP450 enzyme induction/inhibition and pharmacodynamic
                additive risks into clear, evidence-backed rationales that clinicians can digest in
                seconds.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded border border-ink/15 bg-canvas p-6 space-y-2">
              <div className="text-accent text-sm font-bold">[ 03 ]</div>
              <h3 className="text-base font-bold text-ink">Stratified Severity-Ranked Alerts</h3>
              <p className="text-xs text-ink/70 leading-relaxed font-sans">
                Alerts are categorized into strict tiers: Contraindicated, Major, Moderate, and Minor.
                High-consequence hazards receive immediate priority, eliminating alert fatigue.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded border border-ink/15 bg-canvas p-6 space-y-2">
              <div className="text-accent text-sm font-bold">[ 04 ]</div>
              <h3 className="text-base font-bold text-ink">Research-Grade Grounding &amp; Zero Hallucination</h3>
              <p className="text-xs text-ink/70 leading-relaxed font-sans">
                Pharmacology rules take precedence over generative predictions. Grounded against RxNorm
                concept identifiers and OpenFDA datasets so output stays verifiable and reproducible.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Disclaimer Band */}
      <section id="about" className="border-b border-ink/15 bg-card/60 py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded border border-warn/40 bg-warn/10 px-2.5 py-1 text-xs font-semibold text-warn mb-3">
            <span>⚠️ CLINICAL ADVISORY &amp; RESEARCH DISCLAIMER</span>
          </div>
          <p className="text-xs text-ink/70 leading-relaxed font-sans max-w-2xl mx-auto">
            Clindex is an academic research prototype and clinical software engineering demonstration. It is
            <strong> not a certified medical device</strong> under FDA 21 CFR Part 820 or EU CE-MDR. It is
            designed exclusively for educational and decision-support research. Never use Clindex as a
            sole authority for clinical patient care.
          </p>
        </div>
      </section>

      {/* 7. Minimal Footer */}
      <footer className="py-8 bg-canvas">
        <div className="mx-auto flex flex-col sm:flex-row max-w-5xl items-center justify-between gap-4 px-4 sm:px-6 text-xs text-ink/60">
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-widest text-ink">CLINDEX</span>
            <span>·</span>
            <span>Clinical Decision Support System</span>
          </div>

          <div className="text-ink/80 font-medium">Built by Joanathan Packia Singh</div>

          <div>
            <a
              href="https://github.com/JoanathanPS/Clindex"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded border border-ink/20 px-3 py-1 text-ink/80 hover:border-ink hover:text-ink hover:bg-card transition-all"
            >
              GitHub Repository →
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}