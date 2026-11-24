# ClinDex — Strategy & Execution Plan

> Status: living document · Last updated: 2026-11-24 · Branch: `claude/busy-rubin-h4mc78`
> Scope: India first, designed to go global through country adapters.

---

## 0. TL;DR

ClinDex becomes **one app for the whole medicine journey**: understand a medicine, check it is safe *for this patient*, find where to get it cheapest and fastest *at this pincode*, see a doctor when needed, and carry a **tamper-proof prescription** that cannot be forged or reused.

- **Wedge (no doctor adoption needed):** photo of any prescription → safety check + cheapest basket across major sellers, in ~10 seconds.
- **Moat (long term):** signed e-prescriptions + a dispense ledger + real stock data + patient-aware safety engine. Every piece exists somewhere in isolation; **nobody combines them**.
- **Money:** start with affiliate commissions from sellers (never a markup on patients), grow into pharmacy SaaS, doctor/clinic commissions, and demand/adherence data for distributors, insurers and employers.
- **Rule #1:** ranking never depends on commission. In health, trust is the product.

---

## 1. Problems we solve

| # | Problem | Root cause | ClinDex answer |
|---|---|---|---|
| 1 | Paper waste | Prescription exists only on paper | Digital signed Rx (printable QR as fallback) |
| 2 | Forged stamps / signatures | Rubber stamps are trivially copied | Cryptographic signature bound to a verified doctor identity |
| 3 | Reuse & doctor-shopping → addiction | Pharmacy A can't see Pharmacy B | Shared dispense ledger + cross-prescriber controlled-drug risk score |
| 4 | Illegible handwriting → wrong drug | Look-alike / sound-alike names | Structured data + patient-aware interaction engine (existing) |
| 5 | "Where do I get this, at what price?" | Every seller is a silo; stock unknown | Prescription-aware basket optimizer with pincode, delivery fee, ETA, stock confidence |
| 6 | "What does this medicine do?" | Leaflets unreadable; generic chatbots unsafe | Cited, patient-aware AI medicine assistant that refuses when unsure |
| 7 | "Do I even need a doctor for this?" | No safe triage | Red-flag screening → guided self-care (OTC) or route to a doctor |

---

## 2. Product: one app, five doors

```
┌──────────────────────────────────────────────────────────────────┐
│ ASK    AI medicine assistant — cited, multilingual, refuses when │
│        unsure, screens red flags                                 │
│ CHECK  Patient-aware safety engine (eGFR, hepatic, age,          │
│        pregnancy, conditions, interactions) — EXISTS TODAY       │
│ FIND   Basket optimizer — price + delivery + ETA + pincode +     │
│        stock confidence + same-salt/generic substitutes          │
│ CARE   Doctor appointment / teleconsult (partner marketplace)    │
│ Rx     Signed e-prescription + per-item dispense ledger          │
└──────────────────────────────────────────────────────────────────┘
         MedDex wallet (Pokédex-style): every medicine the patient
         has ever been prescribed, as cards, with live balances.
```

Personas & consoles:

| Persona | Console | Main jobs |
|---|---|---|
| Patient / caregiver | Mobile web (PWA) + WhatsApp bot | Scan Rx, ask, find, buy, refill, family wallet |
| Doctor | Prescriber console | Write & sign Rx, see adherence (unfilled items) |
| Pharmacist | Pharmacy console + offline scanner | Verify Rx, dispense, H1 register, stock sync, reservations |
| Regulator / insurer (later) | Analytics | Anomalies, adherence, shortages |

Design language: keep the existing **Pokédex device style** (red shell, green LCD screen, JetBrains Mono). It becomes a design system package, not a CSS file.

---

## 3. Core innovations

### 3.1 Prescription as money (anti-forgery, anti-reuse)
A prescription has the same weakness as digital cash: it can be **spent twice**. So we use the same tools.

```
Doctor (passkey on phone, identity checked against medical registry)
  │ signs Rx with Ed25519
  ▼
Signed Rx token ──► QR (compact, verifiable offline — like EU COVID pass / SMART Health Cards)
  ▼
Pharmacist scans ──► verify signature (offline OK)
                 ──► ledger: what's left per item?
                 ──► record dispense event (append-only, hash-chained)
  ▼
Pharmacy B scans same Rx ──► ❌ "Fully dispensed elsewhere"
```

### 3.2 Per-item partial dispensing
The signed Rx is **immutable** (what the doctor authorized). The **ledger** tracks balance per line item.

- Pharmacy A has only 1 of 3 drugs → dispenses item 1. Pharmacy B sees items 2–3 remaining.
- Partial quantities: 20 of 60 dispensed → 40 remaining.
- Generic substitution allowed unless doctor sets `no_substitution`; actual dispensed drug recorded; interaction check re-runs on the substitute.
- Concurrency: atomic DB function locks the item row; balance can never go negative.
- Offline: normal drugs may dispense offline and sync later (conflicts flagged); **controlled drugs must be online**.
- Privacy: Pharmacy B sees "dispensed elsewhere", not where/when. Full history: patient + prescriber only.
- Expiry window per item (shorter for controlled drugs).

### 3.3 Basket optimizer (FIND)
Search the **whole prescription**, not one drug. Output ranked plans:

```
Rx A7F3 · pincode 600042
 Plan A  Online seller 1 (1 order)   ₹412 + ₹30 delivery · today 6pm   ⚠ 1 item substituted
 Plan B  Local pharmacy X (pickup 1.2 km) ₹368 · all 3 in stock · reserve 2h
 Plan C  Split: seller 2 (2 items) + Jan Aushadhi (1)   ₹290 · 2 stops
```

Objective = landed cost (price + delivery fee) + time + number of stops + stock confidence, with user-selectable priority ("cheapest", "fastest", "one stop").

### 3.4 Stock trust ladder
Every availability result carries a confidence label ("confirmed 8 min ago" vs "likely").

1. Seller API / ONDC / pharmacy ERP feed (best)
2. Inferred from our own dispense ledger
3. Pharmacy one-tap "have / don't"
4. Patient confirmation after pickup
5. Public-page fetching (last resort, terms-of-service-checked)

### 3.5 Guided self-care (ASK → FIND)
For simple complaints (e.g., fever): red-flag screening first (infant, pregnancy, >3 days, liver/kidney disease, other meds, etc.) → if red flag, route to CARE; if low risk, explain common OTC options with **patient-adjusted safety** (our eGFR/hepatic logic) → FIND. The assistant **informs, screens and routes; it never prescribes**.

### 3.6 Other differentiators
| Idea | Why it matters |
|---|---|
| **Paper Bridge** | Scan legacy paper Rx → structured, flagged (ambiguous handwriting, LASA names, prescriber reg-number check). Value without doctors switching. |
| **Digital Schedule H1 register** | Indian pharmacies must keep one; auto-generate it → immediate compliance value → pharmacy SaaS. |
| **Controlled-substance risk score** | Cumulative morphine milligram equivalents (MME) + benzodiazepine load across prescribers → soft stop with reason codes + taper suggestions. |
| **Privacy-preserving doctor-shopping detection** | Salted patient hashes; detect patterns without storing identity in plaintext. |
| **Unfilled-item alerts** | Doctor/patient alerted if an item stays unfilled N days (primary non-adherence). |
| **Unmet-demand radar** | Searches that found nothing = hyperlocal demand signal for pharmacies/distributors. |
| **Overcharge detector** | Quoted price vs NPPA ceiling price → flag. |
| **Chronic refill planner** | Predict refill dates, check stock early, warn on shortages. |
| **Reserve & hold** | Patient reserves at a local pharmacy for 2h; no wasted trips. |
| **Tamper-evident audit chain** | Each log row includes previous row's hash. |
| **Shareable Pokédex cards** | "3 meds · 0 conflicts · saved ₹140" — organic growth. |
| **WhatsApp / voice, regional languages** | Reach beyond app installers. |

---

## 4. Market research (Nov 2026)

- **Indian e-pharmacies** (Tata 1mg, PharmEasy, Netmeds, Apollo 24|7, TrueMeds) differ by SKU price and pincode coverage; published comparisons are mostly blogs/vendor reports and conflict. **No independent pincode-level price/stock audit found** → opening.
- **ONDC** already has pharmacy participants (MedPay, eVitalRx ERP). India has **no e-pharmacy-specific enacted regulation** (LSHTM, 2026).
- **Jan Aushadhi** generics officially 50–80% below branded; ~17k Kendras, target 25k by Mar 2027. **NPPA** ceiling prices for ~935 scheduled formulations. Govt Sugam app compares generic vs branded but not stock/delivery/substitution.
- **UK/EU:** Pharmacy2U stock checker (own stock only); calls for a unified real-time availability app; EU tracking struggles with stock accuracy. No crowdsourced shortage app found.
- **US:** GoodRx revenue = pharmacy-linked fees, subscriptions, ads, employer/payer partnerships.
- **Affiliate programs** exist for 1mg, PharmEasy, Netmeds, Apollo. Reported payouts (aggregator sites, unverified): 1mg ~₹180/sale; PharmEasy ₹120–₹210 or 5–10%.
- **Telemedicine (India):** registered doctors may prescribe after teleconsult except Schedule X / NDPS drugs; AI may assist but the final prescription must come from the doctor (secondary summary — verify against guideline text). Telemedicine providers may need pharma-law licences.

---

## 5. Prior art on GitHub (study, don't copy blindly — licences unchecked)

| Area | Repos | Takeaway |
|---|---|---|
| India price & alternatives | shahidthisside/MedCompare, veeresh3692/MedSetu, SRJ-ai/dawasaver, nahuel007ng/MediScan, Fushiguro6286/medifind | Per-unit pricing; same-salt groups; NPPA + Jan Aushadhi; MedSetu is closest to our stack (Next.js + TS + Supabase, MIT). MedCompare README restricts reuse. |
| Interactions | SPerekrestova/pillchecker-api, OluwatobaOyagbemi/pharvel, Mdjamilh/rx-interaction-checker | **NLM's free interaction API discontinued Jan 2024** → use DDInter / FDA label text. Audit our sources. |
| AI medicine Q&A | soumyamanna-07/Drugdoc-AI-RAG-Chat-Bot, Ahmeduser123/rag-assistant-app, amrutha-tester/healthcare_rag_eval_suite | Cite section/page; refuse on thin context; safety eval suite. |
| Signed Rx / QR | angusmillar/SmartHealthCard, SabarishR08/digital-qr-prescription | Use asymmetric signatures (not HMAC shared secret). |
| ABDM | suryanandan1/ABDM-Main, PSMRI/AMRIT-Docs | Sandbox integration needs NHA facility registration. |
| Pharmacy stock | openmrs/openmrs-esm-stock-management, Bahmni | Batch + expiry + reorder model. |

**Pattern:** every piece exists separately. Our pitch is the integration.

---

## 6. Business model

### 6.1 Principles
1. Take a cut **from sellers**, never a markup on patients.
2. **Don't hold drug stock** (we are a comparison/verification layer, not a pharmacy) — lighter regulatory load (verify with counsel).
3. Ranking is commission-blind; affiliate relationships disclosed.

### 6.2 Revenue streams
| Stream | Payer | Phase | Notes |
|---|---|---|---|
| Affiliate commission | Online pharmacies | 1 | Live day one; small per order |
| Reserve & hold / lead fee | Local pharmacies | 4 | Per confirmed fill |
| Pharmacy SaaS (H1 register, Paper Bridge, stock sync, Rx verify) | Pharmacies (monthly) | 4 | Recurring, sticky |
| Appointment commission / clinic SaaS | Doctors, clinics | 5 | Practo-style |
| Demand & adherence analytics (aggregated, consented) | Distributors, pharma, insurers, employers | 5 | Likely the largest stream |
| Premium family plan | Users | 3+ | Caregiver view, reminders, multiple wallets |

### 6.3 Illustrative sizing (assumptions, not forecasts)
100,000 MAU × 5% ordering/month × ₹150 commission ≈ **₹7.5 lakh/month (~$9k)**. Affiliate is a starter; meaningful scale comes from B2B streams once trust and volume exist.

---

## 7. Go-to-market

1. **Hook:** "Photo your prescription → safety check + cheapest basket in 10 seconds."
2. **First segment:** chronic patients (diabetes, BP) and adult children managing parents' medicines — monthly refills, high anxiety, high spend.
3. **Beachhead:** our own city / campus. Goal: 100 real users before anything else.
4. **Pharmacists as distribution:** free tools (stock sync, H1 register) for 20–30 local shops; they recommend the app.
5. **Programmatic SEO:** "<medicine> price & alternatives in <city>" pages.
6. **WhatsApp bot:** send a photo, get an answer — no install.
7. **Shareable Pokédex cards** for organic growth.
8. **Visible trust:** citations, public evaluation results, "how we rank" page, affiliate disclosure.

**North-star metric:** prescriptions successfully filled through ClinDex per week.
**Supporting:** Rx scanned, click-through-to-buy %, repeat-refill rate, % assistant answers that escalated to a doctor, safety-flag acceptance rate.

---

## 8. Legal, regulatory & risk register

| Risk | Mitigation |
|---|---|
| Scraping vs sellers' terms of service | Affiliate deep links first → official feeds/APIs → public pages only as last resort; legal review before any fetching |
| Facilitating Rx drug sale without valid Rx | Schedule H/H1 availability only shown against a verified Rx (signed or pharmacist-verified scan) |
| AI giving medical advice | Inform/screen/route only; never prescribe; citations; refusal on thin context; red-flag escalation; safety eval suite in CI |
| OTC rules in India unclear | Counsel to confirm which drugs the self-care flow may name |
| Telemedicine / pharma licensing | Partner with licensed teleconsult providers instead of building CARE in-house first |
| Data protection (DPDP Act 2023) | Consent flows, minimisation, RLS everywhere, salted patient hashes, data residency in India |
| Stock data accuracy | Confidence labels; trust ladder; never present "likely" as "confirmed" |
| Conflict of interest (affiliate) | Commission-blind ranking; public ranking methodology |
| Stale interaction data | Source audit (NLM API discontinued); version and date every dataset |
| Cold start (pharmacies) | One city cluster first; free SaaS tier |

Disclaimer stays: research/educational prototype, not a certified medical device, until regulatory review.

---

## 9. Architecture

### 9.1 Repo structure (target)
```
apps/
  web/              Next.js — patient, prescriber, pharmacist, admin (role-based routes)
  verify/           Offline-first PWA scanner for pharmacies
packages/
  rx-core/          Rx schema, canonical encoding, Ed25519 sign/verify, QR codec (pure TS, ~100% tested)
  clinical/         Interaction + patient-physiology + MME risk engine (moved from web/lib/engines)
  find/             Basket optimizer, seller adapters, price normaliser (per-unit), substitution rules
  (ask)             label lookup + grounded Q&A live in web/; triage lives in packages/clinical
  ui/               Pokédex design system (components, tokens) extracted from globals.css
  adapters/
    in/             India: affiliate sellers, ONDC, NPPA, Jan Aushadhi, ABDM/registry
    us/ uk/ eu/     Later
supabase/
  migrations/       Schema (see 9.3)
  functions/        issue-rx, verify-rx, dispense, paper-bridge, find-basket, ask, + existing
docs/
  strat.md          This file
```
Tooling: npm workspaces (Turborepo later if build times demand it), Vitest, Playwright, ESLint, CI on every push.

### 9.2 Signed Rx token (draft)
```
payload = {
  v: 1, rx_id, issued_at, expires_at,
  prescriber: { id, reg_no, registry: "NMC|state" , key_id },
  patient:    { hash },                  // salted; no plaintext identity in QR
  items: [ { n, drug, rxcui|salt_id, strength, form, qty, sig, no_substitution, controlled } ]
}
token = base45( deflate( cbor(payload) ) ) + "." + ed25519_sign(prescriber_key, payload)
```
Public keys published via a key directory (JWKS-style) so pharmacies verify offline.

### 9.3 Data model additions
| Table | Purpose |
|---|---|
| `prescribers` | Verified doctors (registry reference, status) |
| `signing_keys` | Public keys, key_id, rotation, revocation |
| `rx_tokens` | Issued Rx header (immutable) |
| `rx_items` | Line items: qty_authorized, no_substitution, controlled, expires_at |
| `dispense_events` | Append-only: rx_id, item_no, qty, dispensed_drug, pharmacy_id, ts |
| `pharmacies` | Licence, location, pincode, opening hours |
| `stock_signals` | pharmacy/seller × drug × status × confidence × source × observed_at |
| `price_quotes` | seller × sku × pincode × price × delivery_fee × eta × observed_at |
| `controlled_ledger` | Per patient-hash MME / benzo load windows |
| `unmet_demand` | Searches with no result (aggregated) |
| `audit_chain` | Hash-chained audit log |
| `assistant_sessions` | ASK conversations, citations, escalations (consented) |

Remaining balance per item = `qty_authorized − Σ dispense_events.qty`, enforced by a `dispense()` SQL function with row lock.

---

## 10. Execution plan

> Order changed from the first draft: the **consumer wedge (scan → check → find)** comes before signed Rx, because it delivers value without any doctor adopting anything. Estimates assume a small student team and are rough.

### Phase 0 — Foundation (≈2 weeks)
- [x] Convert to monorepo — **npm workspaces**; `web/` kept in place so the Vercel root directory keeps working (move to `apps/web` later, together with a Vercel setting change)
- [x] Extract `packages/ui` (`PokedexDevice` component + `pokedex.css`) — landing page renders identically
- [x] Extract `packages/clinical` from `web/lib/engines`; add Vitest (18 tests)
- [x] Audit clinical data sources — live calls use RxNorm `properties`/`approximateTerm`, RxClass and RxTerms (not the discontinued NLM interaction API); interactions come from our seeded tables + Groq-grounded assessment
- [x] CI: test, typecheck, lint, build on every push (`.github/workflows/ci.yml`)
- [x] Fix pre-existing lint/type errors (incl. null `dosage` from the image parser)
- **Exit:** app unchanged visually; CI green; engine has tests.

### Phase 1 — Wedge: Scan → Check → Find ✅ (built Nov 2026, public at `/find`)
- [x] Medicine catalogue from open data: 246k products, ~15k salt groups (salt + strength + **form incl. SR/MR, dispersible, enteric-coated**), per-unit price, Jan Aushadhi merge — `scripts/build-catalog.mjs`, generated at build time
- [x] `packages/find`: salt normalisation, pack parsing, catalogue client, price plans (as prescribed / cheapest same-salt / Jan Aushadhi first), multi-seller optimiser (cheapest / fastest / one-stop incl. delivery fees)
- [x] Seller deep links (Tata 1mg, PharmEasy, Netmeds, Apollo 24|7) + Jan Aushadhi Kendra locator; commission-blind ranking statement
- [x] Patient-aware check in the browser (seed rules + interactions) with honest "not in reference set" coverage
- [x] Pincode delivery/stock planner — **simulated offers, clearly labelled** until partner feeds exist
- [x] Shareable result
- [ ] Affiliate tags on links (waiting on programme approval)
- [ ] Live seller prices/stock (affiliate feeds / ONDC / ERP)
- [ ] Paper Bridge v0 for the public flow (photo → items); the clinician app already parses images
- **Exit:** 100 real users in one city; median scan→plan < 15s; click-through-to-buy measured.

### Phase 2 — ASK + guided self-care ✅ core (public at `/ask`)
- [x] Medicine card: composition, brand count, per-unit price range, cheapest brands, Jan Aushadhi
- [x] Official label excerpts (openFDA → DailyMed link) fetched in the browser, with source shown
- [x] Grounded Q&A route `/api/ask` — answers only from the shown label, refuses otherwise (enabled when `GROQ_API_KEY` is set)
- [x] Red-flag triage for 5 complaints (fever, headache, cold, acidity, diarrhoea) → emergency / doctor / self-care with patient-specific exclusions; every red flag covered by tests
- [ ] Clinician review of triage content before public launch
- [ ] Regional languages; WhatsApp bot v0
- **Exit:** red-flag recall 100% on test set ✅ (unit-tested); every factual claim cited.

### Phase 3 — Signed Rx + ledger ✅ core (demo at `/rx`)
- [x] `packages/rx-core`: canonical encoding, Ed25519 sign/verify, key ids, revocation, expiry, salted patient hash, per-item ledger, hash-chained audit (22 tests)
- [x] Prescriber console (demo): key creation/revocation, write, sign, QR
- [x] Pharmacy console (demo): QR camera scan / paste, verify, per-item partial dispensing, substitution, controlled-online rule, forgery test
- [x] `supabase/migrations/0004_rx_ledger.sql`: `dispense_rx_item()` with row lock, balances without pharmacy identity, RLS, DB-side audit chain — **tested on real Postgres (PGlite)**; not yet applied to the live project
- [x] Auto-generated Schedule H1 register (CSV)
- [ ] Apply 0004 to Supabase + edge function to register/verify tokens server-side
- [ ] Prescriber identity verification against the medical-council registry (ABDM HPR)
- [ ] Offline PWA with background sync; MedDex patient wallet; unfilled-item alerts
- **Exit:** demo — doctor signs → Pharmacy A dispenses 1 of 3 → Pharmacy B dispenses rest → re-scan rejected ✅ (verified end-to-end in a browser)

### Phase 4 — Pharmacy network (≈6 weeks, business-led)
- [x] Controlled-substance risk score (MME/day, CDC 2022 factors; opioid + sedative flag) — shown in `/find`
- [ ] Pharmacy console: stock one-tap, reservations
- [ ] Stock trust ladder live (ERP/ONDC feed where possible)
- [ ] Reserve & hold; lead-fee billing
- **Exit:** 20–30 partner pharmacies in one pincode cluster; first paid SaaS customer.

### Phase 5 — Scale (ongoing)
- [ ] CARE: partner teleconsult/appointment marketplace
- [ ] ABDM / registry integration (sandbox → production)
- [ ] Unmet-demand & adherence analytics (aggregated, consented)
- [ ] Country adapters (US/UK/EU) on the same core
- [ ] Regulatory review toward real deployment

---

## 11. Open decisions

1. Which 4–5 sellers to integrate first, and confirm their affiliate terms directly.
2. Launch city / campus for the beachhead.
3. LLM provider for ASK (current stack uses Groq) and the trusted source corpus.
4. Legal counsel: OTC naming in self-care flow, fetching public pages, licensing.
5. Team split: who owns `rx-core`, `find`, `ask`, pharmacy partnerships.

---

## 12. Sources

- Zoutons — TrueMeds vs PharmEasy vs Tata 1mg 2026: https://zoutons.com/news/truemeds-vs-pharmeasy-vs-tata-1mg-comparison-2026
- Actowiz — India e-pharmacy price & availability report: https://www.actowizsolutions.com/india-epharmacy-pharma-price-availability-intelligence-report.php
- ONDC — MedPay joins: https://ondc.org/blog/hyperlocal-pharmacy-aggregator-medpay-joins-ondc-network
- ONDC — eVitalRx integration: https://ondc.org/blog/evitalrx-becomes-first-pharma-erp-system-integrated-into-ondc-network
- LSHTM — e-pharmacy regulation: https://www.lshtm.ac.uk/media/102426
- PIB — Jan Aushadhi pricing: https://pib.gov.in/PressReleasePage.aspx?PRID=2200935
- GKToday — pricing mechanisms (NPPA): https://www.gktoday.in/government-schemes-procurement-and-pricing-mechanisms-for-medicines-in-india/
- Pharmacy2U stock checker: https://www.pharmacy2u.co.uk/about/media-centre/news/pharmacy2u-launch-medicine-stock-checker
- Pharmaceutical Journal — "Argos" model: https://pharmaceutical-journal.com/article/opinion/an-argos-model-could-give-patients-the-access-to-medicines-they-deserve
- EHMA — Visibility of stocks (Nov 2024): https://ehma.org/app/uploads/2024/11/Visibility-of-stocks-Nov-2024.pdf
- Motley Fool — How GoodRx makes money: https://www.fool.com/investing/how-to-invest/stocks/how-does-goodrx-make-money
- IBA — India's telemedicine guidelines: https://www.ibanet.org/article/15234243-B534-45F6-B303-4919CFE9A2DC
- Chambers — Digital Healthcare 2026 India: https://chambers.com/practice-guides/guides/digital-healthcare-2026/india
- Affiliate data: https://shopper.com/partnerships/1mg-com-affiliate-program · https://earnkaro.com/blog/pharmeasy-affiliate-program · https://blog.monetizedeal.com/best-pharmacy-affiliate-programs-in-india
- GitHub repos listed in §5 (github.com/<owner>/<repo>)
