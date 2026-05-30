# Genome Pattern Corpus — Codex Handoff

**Created:** 2026-05-30  
**Status:** ACTIVE — hand-off from autonomous Claude loop to Codex  
**Purpose:** Complete the Airline + Healthcare genome pattern seed scripts; then generate Medtech, Banking, and Cross-industry corpora from scratch  
**Scale target:** ~24,000 patterns total (5,000–10,000 per major vertical)

---

## What this is

The `genome_patterns` table is the foundation of AbarVa's Intelligence surface. Every pattern is a
named, scored failure mode that the AI retrieval layer surfaces when a CXO asks "what should I
worry about?" in their domain. This task is pure content generation: write TypeScript seed scripts
that upsert patterns into the Azure Postgres private data plane, following the exact format of the reference files below.

---

## Master prompt

Full quality spec, schema, dimensions, mandatory failure archetypes, and output boilerplate:

```
docs/build/CORPUS_GENERATION_PROMPT_MASTER.md
```

Read §1 (quality bar), §2 (schema), §4 (Airline), §3 (Healthcare), §5 (Medtech), §6 (Banking),
§7 (Cross-industry), §8 (output format), §9 (quality gate checklist) in full before generating
any file. Every file must pass the §9 checklist.

---

## Reference files (study these first)

Two strong exemplars already exist as untracked files in the main repo:

| File | Patterns | Code range | Lines |
|------|----------|------------|-------|
| `src/scripts/seed/seed-airline-dom02-pss-booking.ts` | 50 | A600–A899 | 434 |
| `src/scripts/seed/seed-healthcare-dom17-finance-contracting.ts` | 100 | H5100–H5399 | 967 |

Copy the boilerplate (imports, interface, upsertRows, main function) verbatim from either file.
The only things that change per file are: the pattern array name, the `vertical` string, the
`source_key` string, the code range comment, and of course the patterns themselves.

Key values:
- Airline `vertical`: `'airline'`  
- Airline `source_key`: `'skyharbor-air'`  
- Healthcare `vertical`: `'healthcare_provider'`  
- Healthcare `source_key`: `'meridian-health'`  
- Medtech `vertical`: `'medtech'`  
- Medtech `source_key`: `'northstar-clinical'`  
- Banking `vertical`: `'banking'`  
- Banking `source_key`: `'first-capital'`  
- Cross-industry `vertical`: `'cross_industry'`  
- Cross-industry `source_key`: `'cross-industry'`  

---

## Scale — the full target

Every domain covers **300 code slots** (e.g. A300–A599). Fill **all 300** with patterns.
Because a single 300-pattern file exceeds the 32 000 output-token cap, split each domain into
**5 files of 60 patterns each** (parts 1–5), each file covering 60 consecutive codes:

```
seed-airline-dom01-revenue-mgmt-part1.ts   A300–A359   (60 patterns)
seed-airline-dom01-revenue-mgmt-part2.ts   A360–A419   (60 patterns)
seed-airline-dom01-revenue-mgmt-part3.ts   A420–A479   (60 patterns)
seed-airline-dom01-revenue-mgmt-part4.ts   A480–A539   (60 patterns)
seed-airline-dom01-revenue-mgmt-part5.ts   A540–A599   (60 patterns)
```

Apply this 5-part split to **every domain** in every vertical. Do not stop at 60 per domain.

**Target pattern counts by vertical:**

| Vertical | Domains | Patterns |
|---|---|---|
| Airline | 28 total (7 partial + 21 missing) | ~8,400 |
| Healthcare | 24 total (7 partial + 17 missing) | ~7,200 |
| Medtech | 17 domains | ~2,550 (150/domain) |
| Banking | 20 domains | ~6,000 |
| Cross-industry | 1 batch | ~150 |
| **Total** | | **~24,300** |

The 14 existing files average ~75 patterns — they are **not** yet at 300. Once the missing files
are generated, backfill the existing domains with part2–part5 files to reach 300 each.

## ⚠️ CRITICAL: Per-file output size constraint

**Maximum 60 patterns per file.** Previous runs hit the 32 000 output-token cap when generating
100–300 patterns in a single pass. 60 patterns ≈ 550 lines ≈ safely inside the limit.
One domain = 5 files (part1–part5). Write them sequentially, running each before starting
the next.

---

## Status: what exists (partial — backfill required)

These 14 files are written (untracked in main repo). They contain ~50–100 patterns each — well
short of the 300-per-domain target. **After generating all missing domains, backfill these with
-part2 through -part5 files to bring each to 300.**

### Airline — first file exists, parts 2–5 needed
| Domain | Existing file | Approx patterns | Parts still needed |
|--------|--------------|-----------------|-------------------|
| dom02 PSS & Booking | `seed-airline-dom02-pss-booking.ts` | ~50 | part2–part5 (A660–A899) |
| dom03 Crew Mgmt | `seed-airline-dom03-crew-mgmt.ts` | ~50 | part2–part5 (A960–A1199) |
| dom04 MRO | `seed-airline-dom04-mro-engineering.ts` | ~50 | part2–part5 (A1260–A1499) |
| dom05 CX Recovery | `seed-airline-dom05-cx-service-recovery.ts` | ~50 | part2–part5 (A1560–A1799) |
| dom10 Loyalty | `seed-airline-dom10-loyalty-distribution.ts` | ~50 | part2–part5 (A3060–A3299) |
| dom15 Sustainability | `seed-airline-dom15-sustainability.ts` | ~50 | part2–part5 (A4560–A4799) |
| dom16 Cybersecurity | `seed-airline-dom16-cybersecurity.ts` | ~50 | part2–part5 (A4860–A5099) |

### Healthcare — first file exists, parts 2–5 needed
| Domain | Existing file | Approx patterns | Parts still needed |
|--------|--------------|-----------------|-------------------|
| dom02 RCM Denials | `seed-healthcare-dom02-rcm-denials.ts` | ~100 | part2–part5 (H700–H899) |
| dom05 Pop Health | `seed-healthcare-dom05-pop-health-vbc.ts` | ~50 | part2–part5 (H1560–H1799) |
| dom08 Clinical AI | `seed-healthcare-dom08-clinical-ai.ts` | ~50 | part2–part5 (H2460–H2699) |
| dom12 ED Throughput | `seed-healthcare-dom12-ed-throughput.ts` | ~50 | part2–part5 (H3660–H3899) |
| dom13 Supply Chain | `seed-healthcare-dom13-supply-chain.ts` | ~50 | part2–part5 (H3960–H4199) |
| dom17 Finance Contracting | `seed-healthcare-dom17-finance-contracting.ts` | ~50 | part2–part5 (H5160–H5399) |
| dom30 Patient Finance | `seed-healthcare-dom30-patient-finance.ts` | ~50 | part2–part5 (H9060–H9299) |

---

## Status: what is missing

### Priority 1 — Airline gaps (21 domains × 5 parts = 105 files, ~6,300 patterns)

Each domain = 5 files (part1–part5), 60 patterns each, covering all 300 code slots.
Naming: `seed-airline-domNN-<slug>-part1.ts` through `-part5.ts`.

| Domain | Code range | Domain name | Layer |
|--------|-----------|-------------|-------|
| dom01 | A300–A599 | Revenue Management & Pricing | middle |
| dom06 | A1800–A2099 | NDC, Offer/Order Management & Modern Retailing | front/middle |
| dom07 | A2100–A2399 | Airport Operations & Ground Handling | front/back |
| dom08 | A2400–A2699 | IT Modernisation & Data Platform | back |
| dom09 | A2700–A2999 | Safety Management System & Regulatory Compliance | middle |
| dom13 | A3900–A4199 | Cargo & Charter Operations | front/middle |
| dom14 | A4200–A4499 | Workforce & Labour Relations | back |
| dom17 | A5100–A5399 | Digital Transformation & AI/ML Governance | middle/back |
| dom18 | A5400–A5699 | Codeshare, Alliance & Interlining | middle |
| dom19 | A5700–A5999 | Ancillary Revenue & Merchandising | front/middle |
| dom20 | A6000–A6299 | Revenue Integrity & Fraud Prevention | middle |
| dom21 | A6300–A6599 | Corporate Travel & B2B Sales | front/middle |
| dom22 | A6600–A6899 | Biometrics & Digital Identity | front/back |
| dom23 | A6900–A7199 | Baggage Operations & Tracking | front/back |
| dom25 | A7500–A7799 | Cabin Crew & Inflight Service Management | middle |
| dom26 | A7800–A8099 | Lounge & Premium Passenger Experience | front |
| dom28 | A8400–A8699 | Revenue Accounting & IATA Settlement | back |
| dom29 | A8700–A8999 | Schedule Publication & Slot Management | middle |
| dom31 | A9300–A9599 | Procurement & Vendor Management | back |
| dom32 | A9600–A9899 | Treasury, FX & Financial Risk | back |
| dom50 | A15000–A15299 | Next-Gen Airport & Seamless Travel Technology | front/back |

**SkyHarbor context:** mid-size US carrier (100–200 aircraft), legacy Sabre PSS migrating to
Amadeus Altéa, regional jet fleet, union labour agreements, FFP loyalty programme. Tag patterns
directly relevant to this migration with `demoRelevant: true`.

Mandatory Airline failure archetypes (from §4.2 of master prompt) — distribute across the files:
1. PSS migration mid-flight revenue gap (for dom01 or dom06)
2. NDC adoption without agency tool readiness (dom06)
3. Revenue management model stale on COVID-era data (dom01)
4. Crew scheduling algorithm without union rule engine (dom03 — already exists; avoid duplicate)
5. MRO data silos causing AOG events (dom04 — already exists; avoid duplicate)
6. Loyalty redemption inflation after dynamic awards (dom10 — already exists; avoid duplicate)
7. SMS corrective action open-loop failure (dom09)
8. Contact centre AI without PNR write authority (dom05 — already exists; avoid duplicate)

---

### Priority 2 — Healthcare gaps (17 domains × 5 parts = 85 files, ~5,100 patterns)

Each domain = 5 files (part1–part5), 60 patterns each.
Naming: `seed-healthcare-domNN-<slug>-part1.ts` through `-part5.ts`.

| Domain | Code range | Domain name | Layer |
|--------|-----------|-------------|-------|
| dom01 | H300–H599 | RCM Coding, Charge Capture & Documentation | middle |
| dom03 | H900–H1199 | Epic EHR Optimization & Clinical Governance | middle/back |
| dom11 | H3300–H3599 | Patient Access & Digital Front Door | front |
| dom15 | H4500–H4799 | Perioperative Services & OR Management | middle |
| dom16 | H4800–H5099 | Cloud Migration & IT Governance | back |
| dom18 | H5400–H5699 | Telehealth & Virtual Care | front/middle |
| dom19 | H5700–H5999 | Behavioral Health & Mental Health Integration | front/middle |
| dom20 | H6000–H6299 | Clinical Documentation Improvement (CDI) | middle |
| dom21 | H6300–H6599 | Quality Measures, Patient Safety & Accreditation | middle |
| dom22 | H6600–H6899 | Care Management & Transitions of Care | front/middle |
| dom23 | H6900–H7199 | Oncology Service Line & Precision Medicine | middle |
| dom24 | H7200–H7499 | Cardiac Services & Cath Lab Operations | middle |
| dom25 | H7500–H7799 | Radiology, Imaging & AI Diagnostics | middle/back |
| dom26 | H7800–H8099 | Laboratory, Pathology & Genomics | middle/back |
| dom27 | H8100–H8399 | Compliance, Regulatory Affairs & Internal Audit | back/middle |
| dom28 | H8400–H8699 | Social Determinants of Health & Health Equity | front/middle |
| dom29 | H8700–H8999 | Nursing Workforce, Staffing & Float Management | middle/back |

**Meridian Health context:** regional health system (5 hospitals, 120 employed physicians, Epic
EHR, value-based contracts with 3 MCOs: Aetna, UnitedHealth, BCBS). Tag Meridian-relevant
patterns `demoRelevant: true`.

Mandatory Healthcare failure archetypes (from §3.2 of master prompt) — distribute naturally:
1. Prior auth denial spiral → dom01 or dom03
2. EHR upgrade revenue bleed → dom03
3. FHIR facade with HL7 v2 debt → dom03 or dom16
4. Nursing float pool algorithm bias → dom29
5. 340B program dilution → (dom17 has some; add more in dom01)
6. VBC data lag failure → (dom05 has some; add more in dom21 or dom22)
7. AI diagnostic aide without clinical governance → dom25
8. Population health vendor lock-in → dom21 or dom22

---

### Priority 3 — Medtech (new vertical, not started)

Target: **2,550 patterns across 17 domains × 150 codes each**. Reference: §5 of master prompt.
Each Medtech domain covers 150 code slots (3 files × 50 patterns).

| Domain | Code range | Domain name |
|--------|-----------|-------------|
| dom01 | M100–M249 | FDA Regulatory Submission & Clearance |
| dom02 | M250–M399 | EU MDR / IVDR Compliance |
| dom03 | M400–M549 | Quality Management System (QMS) |
| dom04 | M550–M699 | Software as Medical Device (SaMD / IEC 62304) |
| dom05 | M700–M849 | Medical Device Cybersecurity & SBOM |
| dom06 | M850–M999 | Post-Market Surveillance (PMS) |
| dom07 | M1000–M1149 | Clinical Evidence Generation |
| dom08 | M1150–M1299 | Supply Chain, SBOM & Tariff Risk |
| dom09 | M1300–M1449 | Manufacturing & GxP |
| dom10 | M1450–M1599 | Reimbursement & ICD/CPT Coding |
| dom11 | M1600–M1749 | Sales Force Effectiveness & HCP Engagement |
| dom12 | M1750–M1899 | Field Service & Connected Device Operations |
| dom13 | M1900–M2049 | ERP & SAP Transformation |
| dom14 | M2050–M2199 | AI/ML in Medical Devices (FDA AI Action Plan) |
| dom15 | M2200–M2349 | International Regulatory (PMDA, ANVISA, CDSCO) |
| dom16 | M2350–M2499 | M&A Integration & TSA Exit |
| dom17 | M2500–M2649 | Digital Health & Companion App Governance |

**Northstar context:** mid-size imaging/diagnostics company, FDA-cleared and PMA products, EU MDR
registrations, legacy SAP ERP modernisation in flight, recent divestiture history.  
`source_key`: `'northstar-clinical'`  
`vertical`: `'medtech'`

---

### Priority 4 — Banking (new vertical, not started)

Target: **6,000 patterns across 20 domains × 300 codes each**. Reference: §6 of master prompt.
5 files per domain (60 patterns each), same pattern as Airline/Healthcare.

| Domain | Code range | Domain name |
|--------|-----------|-------------|
| dom01 | B100–B399 | Model Risk Management (SR 11-7 / SR 11-8) |
| dom02 | B400–B699 | Regulatory Compliance & Consent Orders |
| dom03 | B700–B999 | BSA/AML & Financial Crime Compliance |
| dom04 | B1000–B1299 | Credit Risk & Underwriting |
| dom05 | B1300–B1599 | Consumer Lending & Digital Origination |
| dom06 | B1600–B1899 | Digital Banking & Mobile Experience |
| dom07 | B1900–B2199 | Core Banking Modernisation |
| dom08 | B2200–B2499 | Payments Modernisation (FedNow / RTP / SWIFT) |
| dom09 | B2500–B2799 | Fraud Detection & Prevention |
| dom10 | B2800–B3099 | Customer Onboarding & KYC |
| dom11 | B3100–B3399 | Third-Party & Vendor Risk Management (TPRM) |
| dom12 | B3400–B3699 | Data Governance & BCBS 239 |
| dom13 | B3700–B3999 | Cloud & Infrastructure Modernisation |
| dom14 | B4000–B4299 | AI/ML Governance (SR 11-7 extension) |
| dom15 | B4300–B4599 | Commercial Banking & Treasury Management |
| dom16 | B4600–B4899 | Capital Markets & Trading Systems |
| dom17 | B4900–B5199 | Operational Resilience & Business Continuity |
| dom18 | B5200–B5499 | ESG, Climate Risk & Regulatory Reporting |
| dom19 | B5500–B5799 | Talent, Culture & Change Management |
| dom20 | B5800–B6099 | M&A Integration & Core Conversion |

**First Capital context:** regional US bank ($15–25B assets), OCC-chartered, operating under an
MRM consent order, active digital transformation programme anchored on commercial banking.  
`source_key`: `'first-capital'`  
`vertical`: `'banking'`

---

### Priority 5 — Cross-industry (new, not started)

Target: **150 patterns** across 5 dimensions. Reference: §7 of master prompt.
3 files × 50 patterns. Each pattern carries a `verticals` array covering all 5 verticals.

| File | Code range | Dimensions |
|------|-----------|------------|
| `seed-cross-industry-part1.ts` | X100–X149 | AI/ML Governance at Scale + Vendor Consolidation Risk |
| `seed-cross-industry-part2.ts` | X150–X199 | IT Modernisation + Workforce & Change Resistance |
| `seed-cross-industry-part3.ts` | X200–X249 | Data Governance & Lineage |

`source_key`: `'cross-industry'`  
`vertical`: `'cross_industry'`

---

## File format — minimal boilerplate

Copy the exact structure from `seed-airline-dom02-pss-booking.ts`. The upsertRows function,
main function, and isDirect guard are identical in every file. The only substitutions:

```typescript
// ── In the pattern rows map: ──────────────────────────────────────────────
vertical: 'airline',          // or 'healthcare_provider', 'medtech', 'banking', 'cross_industry'
source_count: 6,
confidence: 84,

// ── In the graph edges: ───────────────────────────────────────────────────
source_key: 'skyharbor-air',  // or 'meridian-health', 'northstar-clinical', 'first-capital', 'cross-industry'

// ── In the final count query: ─────────────────────────────────────────────
.eq('vertical', 'airline')
.gte('code', 'A300')
.lte('code', 'A599')
```

deterministicUuid namespace: `'[vertical]-genome-pattern:${p.code}'`  
e.g. `'airline-genome-pattern:A301'`, `'healthcare-genome-pattern:H301'`

---

## Where to write files

All files go in:
```
src/scripts/seed/
```

This is the main repo (not a worktree). The existing 14 files are untracked there.

---

## Run command (per file, after writing)

```bash
# Requires .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
npx tsx src/scripts/seed/seed-airline-dom01-revenue-mgmt.ts
```

Run each file after writing it to confirm the upsert succeeds with no errors. The script prints
the count of seeded patterns. If the count is 0 or the script errors, debug before moving on.

---

## Commit convention

Each file (or small batch of 2–3 related files) gets its own commit:

```
feat(corpus): airline genome patterns dom01 revenue management part1
feat(corpus): healthcare genome patterns dom01 RCM coding part1
feat(corpus): medtech genome patterns dom01 regulatory part1
feat(corpus): banking genome patterns dom01 MRM part1
feat(corpus): cross-industry genome patterns part1
```

Do NOT add `Co-Authored-By` lines in seed-data commits — these are content commits, not code.

---

## Quality gates (§9 of master prompt — non-negotiable)

Per file, before committing:
- [ ] ≥ 30 patterns (and ≤ 60 patterns)
- [ ] All required dimensions for that domain covered with ≥ 3 patterns each
- [ ] ≥ 8 patterns are explicit 2025–2026 AI-insertion failure modes, not legacy IT failures with
      "AI" appended. The pattern name should make the AI surface obvious, e.g. "Ambient AI CDI
      Capture Regression", "Prior Auth AI Criteria Drift Lag", "RM AI Override Governance Gap",
      "AML Graph AI False Network Expansion".
- [ ] AI-insertion patterns identify the exact workflow/tool category involved, such as ambient
      AI, CAC AI, prior auth AI, radiology AI, RM personalization AI, predictive maintenance AI,
      AML graph AI, or AI code assistant.
- [ ] AI-insertion patterns identify the governance/procurement/regulatory hook that makes the
      pattern useful for Moves or Source, such as HIPAA BAA, FDA SaMD, SR 11-7, DOT 399.88,
      payer API SLA, model drift telemetry, vendor adoption telemetry, or deployment-site
      validation.
- [ ] `failureRatePct` is an integer, not a range
- [ ] No description shorter than 2 sentences
- [ ] Every `keywords` array has 4–6 entries; at least one is a named standard/tool/regulation
- [ ] AI-insertion pattern keyword arrays include both (a) the specific AI capability type and
      (b) the governance/procurement/regulatory hook.
- [ ] `officeCategory` matches the actual function
- [ ] Demo-tenant-relevant patterns are tagged `demoRelevant: true`
- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] No duplicate `code` values with existing files (check the table above)

Cross-file:
- [ ] Airline codes are unique across all `seed-airline-*.ts` files
- [ ] Healthcare codes are unique across all `seed-healthcare-*.ts` files
- [ ] No description copy-pasted from another pattern (paraphrase, not duplicate)

---

## Practitioner vocabulary cheat sheet

**Airline:** PSS, NDC, OMS, CRS, GDS, ACARS, EFB, MRO, CAMO, AMO, IATA, FAA Part 121/145, ETOPS,
Sabre, Amadeus Altéa, Travelport Galileo, EDIFACT, OTA, PNR, BSP, FFP, SSR, IROPS, DCS

**Healthcare:** RCM, CDI, prior auth, FHIR R4, Epic, Cerner, Oracle Health, ACO, VBC, SDOH, 340B,
MCO, CMS CoP, TJC, HITRUST, HIPAA, HL7 v2, TEFCA, ICD-10, CPT, DRG, payer, HCC, HEDIS, NCQA

**Medtech:** FDA 510(k), PMA, DeNovo, EU MDR, IVDR, GxP, SBOM, SaMD, DHF, FMEA, CAPA, UDI, QMS,
IEC 62304, ISO 14971, SR 11-7, CE mark, notified body, PMDA, CDSCO, ANVISA

**Banking:** SR 11-7, SR 11-8, MRM, model inventory, consent order, BSA/AML, KYC, CRA, CECL,
DFAST, CCAR, BCBS 239, OCC, TPRM, FedNow, RTP, Reg E, Reg CC, CFPB, OCC 2013-29

---

## AI-insertion pattern lens for Intelligence, Moves, and Source

The corpus is not only a history of why large programs fail. For 2025–2026 demos, it must explain
how AI changes the failure surface inside each vertical workflow. Roughly 25–30% of remaining
patterns should be explicit AI-insertion patterns woven into the domain files where the work happens,
not isolated only in the "AI governance" domains.

Pattern usage by module:
- **Intelligence** uses these patterns to answer "what should I worry about?" with domain-specific
  facts, caveats, confidence, and evidence gaps.
- **Moves** uses these patterns to shape AI initiatives: thesis, scope, unsafe-to-fund conditions,
  adoption plan, governance gates, value model, risk register, and pre-mortem.
- **Source** uses these patterns to evaluate vendors and contracts: RFI/RFP questions, BAAs,
  model-risk clauses, FDA/regulatory scope, payer/API SLAs, adoption telemetry, exit rights,
  indemnity, and BAFO counters.

Every AI-insertion pattern should make two things concrete:
1. **The AI tool category** involved, not just the word AI. Examples: ambient AI scribe, CAC AI,
   prior auth AI, radiology worklist AI, sepsis prediction AI, RM personalization AI, predictive
   maintenance AI, AML graph AI, AI code assistant.
2. **The exact workflow or control point where failure manifests.** Examples: Epic SmartText,
   HCC specificity, physician attestation, HIPAA BAA/subprocessor, payer criteria update SLA,
   FDA 510(k) clearance scope, CAMO maintenance record, SR 11-7 model inventory, DOT unfair
   pricing review, vendor adoption telemetry.

High-value AI examples to weave into missing files:
- Healthcare RCM/CDI: ambient AI CDI capture regression, specialty vocabulary failure, correction
  fatigue, prior auth AI payer criteria drift, CAC HCC version mismatch, physician query fatigue.
- Healthcare radiology/quality: worklist reordering override, incidental finding follow-up gap,
  FDA clearance scope creep, sepsis alert fatigue, deployment-site validation gap.
- Airline revenue/NDC/MRO: RM AI COVID data contamination, dynamic pricing regulatory override,
  personalization proxy-bias risk, NDC AI inventory-gate bypass, predictive maintenance sensor drift,
  CAMO/Part 145 compliance override.
- Banking: SR 11-7 shadow AI fleet, vendor AI model-scope ambiguity, adverse-action explainability
  gap, AML graph AI false network expansion, SAR narrative explainability failure.
- Medtech: SaMD algorithm drift, FDA PCCP monitoring gap, SBOM AI dependency gap, connected-device
  field-service triage AI creating complaint/PMS blind spots.

`demoRelevant: true` trigger rule: any pattern describing an AI failure mode a CDO, CDIO, CIO,
CTO, procurement VP, or business sponsor would be actively deciding on in 2025–2026 should be
marked demo-relevant. These patterns are the live conversation for Moves and Source.

---

## Execution order

Work through the priorities in order. Do not start Medtech until all Airline and Healthcare gaps
are filled (missing domains at 300 patterns each). Do not start Banking until Medtech is done.
Do not start Cross-industry until Banking is done. After each file: write → compile-check →
run → commit. Do not batch uncommitted work.

After all missing domains are generated at 300 patterns each, backfill the 14 existing partial
files (currently ~50–100 patterns each) by generating part2–part5 files to bring each to 300.

**Full scope:**

| Phase | Work | Files | Patterns |
|---|---|---|---|
| 1a | 21 missing Airline domains × 5 parts | 105 files | ~6,300 |
| 1b | 7 existing Airline domains backfill (parts 2–5) | 28 files | ~1,750 |
| 2a | 17 missing Healthcare domains × 5 parts | 85 files | ~5,100 |
| 2b | 7 existing Healthcare domains backfill (parts 2–5) | 28 files | ~1,750 |
| 3 | 17 Medtech domains × 3 parts | 51 files | ~2,550 |
| 4 | 20 Banking domains × 5 parts | 100 files | ~6,000 |
| 5 | 3 Cross-industry files | 3 files | ~150 |
| **Total** | | **~400 files** | **~23,600 patterns** |
