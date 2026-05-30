# Genome Pattern Corpus — Codex Handoff

**Created:** 2026-05-30  
**Status:** ACTIVE — hand-off from autonomous Claude loop to Codex  
**Purpose:** Complete the Airline + Healthcare genome pattern seed scripts; then generate Medtech, Banking, and Cross-industry corpora from scratch  

---

## What this is

The `genome_patterns` table is the foundation of AbarVa's Intelligence surface. Every pattern is a
named, scored failure mode that the AI retrieval layer surfaces when a CXO asks "what should I
worry about?" in their domain. This task is pure content generation: write TypeScript seed scripts
that upsert patterns into Supabase, following the exact format of the reference files below.

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

## ⚠️ CRITICAL: Output size constraint

**Generate a maximum of 60 patterns per file.** Previous runs hit the 32 000 token output cap
when trying to write 100–300 patterns at once. 60 patterns ≈ 550 lines ≈ well inside the limit.

If a domain warrants more than 60 patterns, split it into two files with a `-part2` suffix and
the next 300 code slots.

---

## Status: what exists

These 14 files are already written (untracked in main repo). **Do not regenerate them.**

### Airline — completed
| File | Code range |
|------|-----------|
| `seed-airline-dom02-pss-booking.ts` | A600–A899 |
| `seed-airline-dom03-crew-mgmt.ts` | A900–A1199 |
| `seed-airline-dom04-mro-engineering.ts` | A1200–A1499 |
| `seed-airline-dom05-cx-service-recovery.ts` | A1500–A1799 |
| `seed-airline-dom10-loyalty-distribution.ts` | A3000–A3299 |
| `seed-airline-dom15-sustainability.ts` | A4500–A4799 |
| `seed-airline-dom16-cybersecurity.ts` | A4800–A5099 |

### Healthcare — completed
| File | Code range |
|------|-----------|
| `seed-healthcare-dom02-rcm-denials.ts` | H600–H899 |
| `seed-healthcare-dom05-pop-health-vbc.ts` | H1500–H1799 |
| `seed-healthcare-dom08-clinical-ai.ts` | H2400–H2699 |
| `seed-healthcare-dom12-ed-throughput.ts` | H3600–H3899 |
| `seed-healthcare-dom13-supply-chain.ts` | H3900–H4199 |
| `seed-healthcare-dom17-finance-contracting.ts` | H5100–H5399 |
| `seed-healthcare-dom30-patient-finance.ts` | H9000–H9299 |

---

## Status: what is missing

### Priority 1 — Airline gaps (21 files)

Generate these in order. Each file covers exactly the stated code range; the code numbering is
`(domN × 300)` through `(domN × 300 + 299)`.

| File to create | Code range | Domain name | Layer |
|----------------|-----------|-------------|-------|
| `seed-airline-dom01-revenue-mgmt.ts` | A300–A599 | Revenue Management & Pricing | middle |
| `seed-airline-dom06-ndc-oms.ts` | A1800–A2099 | NDC, Offer/Order Management & Modern Retailing | front/middle |
| `seed-airline-dom07-airport-ops.ts` | A2100–A2399 | Airport Operations & Ground Handling | front/back |
| `seed-airline-dom08-it-modernization.ts` | A2400–A2699 | IT Modernisation & Data Platform | back |
| `seed-airline-dom09-safety-compliance.ts` | A2700–A2999 | Safety Management System & Regulatory Compliance | middle |
| `seed-airline-dom13-cargo.ts` | A3900–A4199 | Cargo & Charter Operations | front/middle |
| `seed-airline-dom14-workforce.ts` | A4200–A4499 | Workforce & Labour Relations | back |
| `seed-airline-dom17-digital-ai.ts` | A5100–A5399 | Digital Transformation & AI/ML Governance | middle/back |
| `seed-airline-dom18-codeshare.ts` | A5400–A5699 | Codeshare, Alliance & Interlining | middle |
| `seed-airline-dom19-ancillary.ts` | A5700–A5999 | Ancillary Revenue & Merchandising | front/middle |
| `seed-airline-dom20-revenue-integrity.ts` | A6000–A6299 | Revenue Integrity & Fraud Prevention | middle |
| `seed-airline-dom21-corporate-travel.ts` | A6300–A6599 | Corporate Travel & B2B Sales | front/middle |
| `seed-airline-dom22-biometrics.ts` | A6600–A6899 | Biometrics & Digital Identity | front/back |
| `seed-airline-dom23-baggage.ts` | A6900–A7199 | Baggage Operations & Tracking | front/back |
| `seed-airline-dom25-cabin-crew.ts` | A7500–A7799 | Cabin Crew & Inflight Service Management | middle |
| `seed-airline-dom26-lounge.ts` | A7800–A8099 | Lounge & Premium Passenger Experience | front |
| `seed-airline-dom28-revenue-accounting.ts` | A8400–A8699 | Revenue Accounting & IATA Settlement | back |
| `seed-airline-dom29-schedule.ts` | A8700–A8999 | Schedule Publication & Slot Management | middle |
| `seed-airline-dom31-procurement.ts` | A9300–A9599 | Procurement & Vendor Management | back |
| `seed-airline-dom32-treasury.ts` | A9600–A9899 | Treasury, FX & Financial Risk | back |
| `seed-airline-dom50-next-gen-airport.ts` | A15000–A15299 | Next-Gen Airport & Seamless Travel Technology | front/back |

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

### Priority 2 — Healthcare gaps (17 files)

| File to create | Code range | Domain name | Layer |
|----------------|-----------|-------------|-------|
| `seed-healthcare-dom01-rcm-coding.ts` | H300–H599 | RCM Coding, Charge Capture & Documentation | middle |
| `seed-healthcare-dom03-epic-ehr.ts` | H900–H1199 | Epic EHR Optimization & Clinical Governance | middle/back |
| `seed-healthcare-dom11-patient-access.ts` | H3300–H3599 | Patient Access & Digital Front Door | front |
| `seed-healthcare-dom15-periop.ts` | H4500–H4799 | Perioperative Services & OR Management | middle |
| `seed-healthcare-dom16-cloud.ts` | H4800–H5099 | Cloud Migration & IT Governance | back |
| `seed-healthcare-dom18-telehealth.ts` | H5400–H5699 | Telehealth & Virtual Care | front/middle |
| `seed-healthcare-dom19-behavioral-health.ts` | H5700–H5999 | Behavioral Health & Mental Health Integration | front/middle |
| `seed-healthcare-dom20-cdi.ts` | H6000–H6299 | Clinical Documentation Improvement (CDI) | middle |
| `seed-healthcare-dom21-quality.ts` | H6300–H6599 | Quality Measures, Patient Safety & Accreditation | middle |
| `seed-healthcare-dom22-care-mgmt.ts` | H6600–H6899 | Care Management & Transitions of Care | front/middle |
| `seed-healthcare-dom23-oncology.ts` | H6900–H7199 | Oncology Service Line & Precision Medicine | middle |
| `seed-healthcare-dom24-cardiac.ts` | H7200–H7499 | Cardiac Services & Cath Lab Operations | middle |
| `seed-healthcare-dom25-radiology.ts` | H7500–H7799 | Radiology, Imaging & AI Diagnostics | middle/back |
| `seed-healthcare-dom26-lab.ts` | H7800–H8099 | Laboratory, Pathology & Genomics | middle/back |
| `seed-healthcare-dom27-compliance.ts` | H8100–H8399 | Compliance, Regulatory Affairs & Internal Audit | back/middle |
| `seed-healthcare-dom28-sdoh.ts` | H8400–H8699 | Social Determinants of Health & Health Equity | front/middle |
| `seed-healthcare-dom29-nursing.ts` | H8700–H8999 | Nursing Workforce, Staffing & Float Management | middle/back |

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

Target: 150 patterns. Reference: §5 of master prompt.

| File to create | Code range | Domain name |
|----------------|-----------|-------------|
| `seed-medtech-part1.ts` | M100–M224 | Dimensions 01–09 (see §5.1) — FDA regulatory, EU MDR, QMS, SaMD, cybersecurity, PMS, clinical evidence, supply chain, manufacturing |
| `seed-medtech-part2.ts` | M225–M249 | Dimensions 10–17 (see §5.1) — reimbursement, sales effectiveness, field service, ERP, AI/ML, international regulatory, M&A, digital health |

**Northstar context:** mid-size imaging/diagnostics company, FDA-cleared and PMA products, EU MDR
registrations, legacy SAP ERP modernisation in flight, recent divestiture history.  
`source_key`: `'northstar-clinical'`  
`vertical`: `'medtech'`

---

### Priority 4 — Banking (new vertical, not started)

Target: 200 patterns. Reference: §6 of master prompt.

| File to create | Code range | Domain name |
|----------------|-----------|-------------|
| `seed-banking-part1.ts` | B100–B199 | Dimensions 01–11 (see §6.1) — MRM/SR 11-7, regulatory/consent orders, BSA/AML, credit risk, consumer lending, digital banking, core banking, payments, fraud, KYC, TPRM |
| `seed-banking-part2.ts` | B200–B299 | Dimensions 12–20 (see §6.1) — data governance/BCBS 239, cloud, AI/ML governance, commercial banking, capital markets, operational resilience, ESG, talent, M&A |

**First Capital context:** regional US bank ($15–25B assets), OCC-chartered, operating under an
MRM consent order, active digital transformation programme anchored on commercial banking.  
`source_key`: `'first-capital'`  
`vertical`: `'banking'`

---

### Priority 5 — Cross-industry (new, not started)

Target: 50 patterns. Reference: §7 of master prompt.

| File to create | Code range | Notes |
|----------------|-----------|-------|
| `seed-cross-industry-patterns.ts` | X100–X149 | 5 dimensions × 10 patterns; add `verticals` array to each pattern |

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
feat(corpus): airline genome patterns dom01 revenue management (A300–A599)
feat(corpus): healthcare genome patterns dom01 RCM coding (H300–H599)
feat(corpus): medtech genome patterns part1 (M100–M224)
feat(corpus): banking genome patterns part1 (B100–B199)
feat(corpus): cross-industry genome patterns (X100–X149)
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
are filled. Do not start Banking until Medtech is done. Do not start Cross-industry until Banking
is done. After each file: write → compile-check → run → commit. Do not batch uncommitted work.

Estimated scope: ~38 files × 40 patterns avg = ~1,500 new patterns total across all four remaining
corpora.
