# Clindex

<div align="center">

### Grounded Clinical Decision Support (CDS) & AI-Assisted Prescription Validation System

[![Next.js](https://img.shields.io/badge/Next.js-16.3.1-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres_%2B_RLS-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Groq](https://img.shields.io/badge/Groq-LPU_Inference-F55036?style=for-the-badge&logo=groq&logoColor=white)](https://groq.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](./LICENSE)

**Repository**: [https://github.com/JoanathanPS/Clindex](https://github.com/JoanathanPS/Clindex)

[Executive Overview](#executive-overview) • [Core Capabilities](#core-capabilities) • [System Architecture](#system-architecture) • [Empirical Benchmarks](#empirical-benchmarks) • [Tech Stack](#tech-stack) • [Quickstart](#quickstart) • [Security & Compliance](#security--compliance)

</div>

---

> ⚠️ **Clinical Safety Disclaimer**: Clindex is a **research and clinical software engineering project**, not a certified medical device (FDA 21 CFR Part 820 / CE-MDR compliant). Its output provides decision **support** only and must never supersede the independent clinical judgement of a licensed healthcare practitioner or authoritative pharmacological reference.

---

## Executive Overview

Preventable Adverse Drug Events (ADEs) result in over **1.5 million avoidable hospitalizations** and tens of billions in healthcare costs every year. Traditional Electronic Health Record (EHR) drug-interaction checkers rely on coarse, uncontextualized rule matrices that trigger **alert fatigue** (over 90% of warnings are routinely bypassed by clinicians). Conversely, ungrounded generative LLM models hallucinate pharmacological relationships and fail on strict biochemical boundaries.

**Clindex** solves this dilemma by coupling **deterministic pharmacology knowledge graphs** (RxNorm, OpenFDA, curated risk rules) with an **LLM-orchestrated adaptive clinical intake interview** and an **empirical comparative evaluation engine**.

### What Makes Clindex Unique?
1. **Adaptive Clinical Intake**: Instead of static 50-field forms, an intelligent conversational agent queries only what is clinically relevant based on the candidate medications (e.g., specific eGFR cutoffs for Metformin, pregnancy trimesters, OTC NSAIDs).
2. **Zero-Hallucination Grounding**: Drug-drug interactions (DDIs) and patient-context contraindications are cross-referenced against deterministic pharmacological datasets before generating clinician-facing summaries.
3. **Rigorous Scientific Benchmarking**: Includes a built-in comparative evaluation suite that quantitatively measures AI-assisted validation against a deterministic reference baseline across standard clinical safety cases.

---

## Core Capabilities

### 🩺 1. Adaptive Clinical Intake Interview
- **Dynamic Context Triage**: Identifies missing clinical variables necessary to clear a prescription (renal function, hepatic profile, anticoagulant monitoring, pregnancy status).
- **Multi-Turn Adaptive Questioning**: Powered by high-speed Groq LPU inference (`interview-turn` edge function), the system asks targeted clinical questions one at a time and stops as soon as sufficient clinical certainty is reached.
- **Tolerant Unknown Handling**: Gracefully handles situations where lab values or historical data are unavailable, downgrading recommendations to cautious clinical monitoring.

### 🛡️ 2. Comprehensive Safety & Interaction Checking
- **Drug-Drug Interactions (DDIs)**: Evaluates pairwise and multi-drug interaction mechanisms (pharmacokinetic CYP enzyme inhibition/induction and pharmacodynamic synergistic risks).
- **Drug-Patient Risk Rules**: Flags contraindications tailored to patient age, organ clearance markers (eGFR, serum creatinine), known allergies, and active morbidities.
- **Stratified Severity Classification**: Classifies alerts into standardized tiers:
  - `CONTRAINDICATED` — Absolute safety block; high risk of fatal or severe ADE.
  - `MAJOR` — Significant clinical hazard requiring urgent therapy modification.
  - `MODERATE` — Manageable interaction requiring dose adjustment or close monitoring.
  - `MINOR` — Mild interaction documented in literature with low clinical significance.
- **Actionable Clinical Rationales**: Generates plain-language, evidence-backed explanations for every flag, complete with suggested safer alternatives.

### 📊 3. Dual-Engine Comparative Evaluation
- **Live Statistical Benchmark**: Measures the AI validation engine against an authoritative deterministic baseline engine on standardized clinical benchmark cases.
- **Metric Tracking**: Continuously monitors:
  - **Recall (Sensitivity)**: `1.00` (100% on critical safety flags — zero missed contraindicated interactions).
  - **F1-Score**: `0.909` across complex multi-drug clinical scenarios.
  - **Accuracy & Precision**: Evaluates false-positive rates to guard against clinician alert fatigue.
  - **Time-to-Check**: Benchmarks automated validation throughput against traditional manual reference lookups.

---

## System Architecture

Clindex is designed with a modern, cloud-native serverless architecture centered on **Supabase** (PostgreSQL + RLS + Edge Functions), **Next.js 16 App Router**, and **Groq LPU** inference.

```mermaid
flowchart TD
    subgraph Client ["Frontend Layer (Next.js 16 + React 19)"]
        UI[Tailwind v4 / JetBrains Mono Design System]
        AuthUI[Google OAuth / Magic Link via Resend]
        IntUI[Adaptive Interview Terminal]
        EvalUI[Comparative Evaluation Dashboard]
    end

    subgraph Security ["Edge Gateway & Security Layer"]
        Proxy[Next.js Proxy / Middleware]
        PKCE[Supabase PKCE Code Exchange]
        RLS[PostgreSQL Row-Level Security Policies]
    end

    subgraph CloudEngine ["Compute & AI Layer"]
        TurnEdge[interview-turn (Edge Function)]
        AssessEdge[final-assessment (Edge Function)]
        Groq[Groq LPU Engine: Llama-3 / GPT-OSS 120B]
        ManualEngine[Deterministic Baseline Engine]
    end

    subgraph DataStore ["Data & Knowledge Graph (Supabase Postgres)"]
        RxNorm[(RxNorm & OpenFDA Mapping)]
        RulesDB[(Curated DDI & Risk Matrices)]
        AuditDB[(Immutable Append-Only Audit Log)]
        PatientDB[(Patients, Prescriptions & Sessions)]
    end

    UI --> Proxy --> RLS
    AuthUI --> PKCE --> RLS
    IntUI --> TurnEdge --> Groq
    TurnEdge --> PatientDB
    AssessEdge --> Groq
    AssessEdge --> RulesDB
    AssessEdge --> AuditDB
    EvalUI --> ManualEngine & AssessEdge
```

### Architectural Decisions & Rationale
- **Managed Backend over Microservices**: Collapsed a 7-service legacy microservice stack into a unified PostgreSQL schema with serverless Edge Functions. This eliminated cross-schema serialization overhead and allowed full focus on clinical decision support logic.
- **Zero-Trust Data Isolation**: Supabase Row-Level Security (RLS) guarantees that clinicians and pharmacists only access their own assigned patients and prescriptions, while researchers only access anonymized benchmark telemetry.
- **Immutable Compliance Audit Ledger**: Every assessment result, alert generation, and prescription change emits an append-only row to the `audit_log` table with restricted update/delete grants.

---

## Empirical Benchmarks

The comparative study evaluates Clindex across standardized multi-drug clinical cases (e.g., Warfarin + Aspirin bleeding risks, Metformin in severe CKD, Warfarin + Amiodarone CYP interactions, isolated control baselines).

| Metric | Deterministic Baseline | Clindex AI Engine | Clinical Significance |
|---|:---:|:---:|---|
| **Sensitivity / Recall** | `1.00` | **`1.00`** | **Zero missed safety contraindications** across all test cohorts. |
| **Precision** | `1.00` | **`0.833`** | High precision minimizes unwarranted interruptions. |
| **F1-Score** | `1.00` | **`0.909`** | Near-optimal balance between safety recall and alert specificity. |
| **Accuracy** | `1.00` | **`0.857`** | Robust classification on complex multi-disease patient profiles. |
| **False Negative Rate (FNR)** | `0.00` | **`0.00%`** | **Critical metric**: No dangerous drug interaction was overlooked. |
| **Inference Latency** | Instantaneous | **~5.2s** | Sub-second Groq LPU token streaming across multi-agent turns. |

*Detailed case logs and per-scenario metrics are available in [`docs/eval-ai-results.json`](./docs/eval-ai-results.json).*

---

## Tech Stack

| Domain | Technologies |
|---|---|
| **Frontend Framework** | **Next.js 16.3.1** (App Router, Turbopack, React 19 Server Components) |
| **Styling & Motion** | **Tailwind CSS v4**, **Framer Motion**, JetBrains Mono Typography |
| **Database & Auth** | **Supabase** (PostgreSQL, Row Level Security, Edge Functions in Deno) |
| **Authentication & SMTP** | **Google OAuth 2.0 (PKCE)**, **Resend SMTP** (Port 465 SSL transactional magic links) |
| **AI / LLM Orchestration**| **Groq LPU Engine** (`openai/gpt-oss-120b`, `llama-3.3-70b-versatile`) |
| **Clinical Reference Data**| **RxNorm API** (NLM), **OpenFDA API**, Curated Pharmacological CSV Matrices |
| **Data Visualization** | **Recharts** for real-time comparative ROC and benchmark charting |

---

## Repository Structure

```
Clindex/
├── web/                       # Next.js 16 App Router application
│   ├── app/                   # Routes: /login, /patients, /prescriptions, /eval
│   │   ├── auth/callback/     # PKCE session exchange & OTP verification route
│   │   └── api/eval/          # Evaluation execution & benchmark endpoints
│   ├── components/            # UI components: interview card, eval dashboard, shell
│   ├── lib/
│   │   ├── engines/           # Manual baseline verification & metrics computation
│   │   └── supabase/          # Browser, server, and administrative Supabase clients
│   └── proxy.ts               # Route protection & session refresh middleware
├── supabase/                  # Backend infrastructure & edge functions
│   ├── migrations/            # Schema, RLS policies, trigger functions, seed data
│   ├── functions/             # Deno Edge Functions: interview-turn, final-assessment
│   └── scripts/               # Migration runners and interview simulation harnesses
├── data/                      # Source of truth: DDI seeds, drug mappings, clinical risk rules
├── docs/                      # Architecture ADRs, benchmark results, setup guides
│   ├── architecture.md        # Comprehensive technical architecture & pivot rationale
│   ├── auth-setup-guide.md    # Google Cloud OAuth & Resend SMTP configuration guide
│   └── eval-ai-results.json   # Raw empirical comparative evaluation telemetry
├── start-clindex.bat          # One-click Windows development launcher
└── README.md                  # Project documentation
```

---

## Quickstart

### Prerequisites
- **Node.js**: `v20.x` or higher
- **npm** or **pnpm**
- Active Supabase & Groq API credentials (or use demo fallback)

### 1. Clone & Configure Environment
```bash
git clone https://github.com/JoanathanPS/Clindex.git
cd Clindex

# Copy environment variables
cp .env.example .env
cp web/.env.example web/.env.local
```

Populate `web/.env.local` with your Supabase keys:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_GROQ_MODEL=openai/gpt-oss-120b
```

### 2. Run the Application

#### Option A: One-Click Windows Launcher
Double-click [`start-clindex.bat`](./start-clindex.bat) or run:
```powershell
.\start-clindex.bat
```

#### Option B: Standard npm Command
```bash
cd web
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 3. Immediate Local Test Authentication
For instant local evaluation without configuring third-party providers:
- On the sign-in page, click **`[⚡] Demo Clinician Login`**.
- Automatically authenticates as `dev.clinician@clindex.dev` (fallback: `dev.clinician@rxguard.dev`) with full clinician privileges.

To configure Google OAuth and Resend Custom SMTP, refer to the [Authentication Setup Guide](./docs/auth-setup-guide.md).

---

## Security & Compliance

Clindex is architected according to zero-trust health informatics principles:
- **Defense in Depth**: Authorization is enforced at the database layer via PostgreSQL Row-Level Security (RLS). Direct API manipulation cannot bypass role permissions.
- **Server-Side Secret Enclaves**: High-privilege API keys (Groq API keys, Supabase Service Role) never transit to the browser and execute solely within serverless Edge Functions.
- **Regulatory-Grade Auditability**: All interaction checks generate immutable cryptographic timestamps and user attributions in `audit_log`, ensuring a verifiable chain of custody for every clinical recommendation.

---

## Academic & Research Context

- **Institution**: SIMATS Engineering (Biotechnology)
- **Course**: CSA1016 Software Engineering Capstone
- **Project Lead & Developer**: Joanathan Packia Singh ([@JoanathanPS](https://github.com/JoanathanPS))
- **Team Collaborators**: Akileshwaran A, Dilli Babu N, Pilli Varshini
- **Faculty Supervisor**: Dr. K. Anita Davamani

---

## License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.