<p align="center">
  <img src="./web/public/clindex-device-hero-mono.png" alt="ClinDex Logo" width="380" />
</p>

# ClinDex

> AI-assisted prescription validation and clinical decision support system.  
> **Live App**: [https://clindex.joanathan.in](https://clindex.joanathan.in)

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres_%2B_RLS-emerald?style=flat-square&logo=supabase)](https://supabase.com/)
[![Groq](https://img.shields.io/badge/Groq-LPU_Inference-orange?style=flat-square)](https://groq.com/)

---

### Overview

ClinDex covers the whole medicine journey — **understand it, check it, find it, verify it**.

| Door | Route | What it does |
|---|---|---|
| **Find** | `/find` | Price the whole prescription across 246k Indian products: same salt + strength + form, cheapest brand, Jan Aushadhi, per-unit price, seller links, pincode delivery planner |
| **Check** | `/find` | Patient-aware interaction and kidney / pregnancy / age / allergy checks, plus opioid load (MME/day) |
| **Ask** | `/ask` | Official label excerpts with sources, grounded Q&A, and red-flag triage before any self-care |
| **Rx** | `/rx` | Ed25519-signed QR prescriptions; per-item dispense ledger that blocks forgery and double-dispensing across pharmacies; hash-chained audit; auto Schedule H1 register |
| **Care** | `/care` | Emergency routing and free government teleconsultation (eSanjeevani) |
| Clinician app | `/patients` | Adaptive AI interview + grounded assessment (sign-in) |

---

### Performance

| Metric | Result | Benchmark |
|---|---|---|
| **Safety Recall** | **100%** | 0 missed contraindications across test cohorts |
| **Harmonic F1** | **0.909** | Minimal alert fatigue |
| **Accuracy** | **85.7%** | Grounded multi-class classification |
| **Latency** | **~5.2s** | Groq LPU inference vs. 5–10 min manual review |

---

### Quickstart

```bash
git clone https://github.com/JoanathanPS/Clindex.git
cd Clindex
npm install        # installs every workspace from the repo root
npm run catalog    # downloads open data and builds web/public/catalog (once)
npm run dev        # Next.js app (web/)
npm test           # all unit + Postgres ledger tests
```

| Path | What lives there |
|---|---|
| `web/` | Next.js app (patient, prescriber, eval routes) |
| `packages/clinical` | Safety engine, evaluation metrics, MME opioid load, self-care triage |
| `packages/find` | Salt normalisation, catalogue client, basket and multi-seller optimiser |
| `packages/rx-core` | Signed prescriptions, dispense ledger, hash-chained audit |
| `packages/ui` | Pokédex design system (device shell, LCD screen, styles) |
| `scripts/` | Catalogue and seed builders |
| `supabase/` | Migrations (incl. `0004_rx_ledger.sql`, tested on PGlite) and Edge Functions |
| `docs/strat.md` | Strategy, business model and phased roadmap |

---

### Author's Note

> "I built Clindex because catching dangerous drug interactions shouldn't mean drowning in alert fatigue or deciphering dense formularies at 1am. Every interaction is grounded in clinical datasets with transparent biological mechanisms and actionable alternatives — built to solve a real clinical problem, not just demo an AI prompt."
>
> **Joanathan Packia Singh** · [Read my résumé →](https://joanathan.in/)

---

<sub>Medicine data: [Indian Medicine Dataset](https://github.com/junioralive/Indian-Medicine-Dataset) (MIT) and [DawaSaver](https://github.com/SRJ-ai/dawasaver) Jan Aushadhi seed (MIT). MRP snapshots — verify on the pack.</sub>

<sub>⚠️ **Disclaimer**: Research and educational prototype only. Not a certified medical device. Decision support only.</sub>