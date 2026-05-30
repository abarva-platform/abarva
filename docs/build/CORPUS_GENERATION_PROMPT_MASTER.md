# Master Corpus Generation Prompt
# Best-in-Class Industry Pattern Corpora — All AbarVa Verticals

> **Intended audience:** Codex agent, Claude Opus, or any high-capacity model tasked with generating
> industry pattern seed scripts.  Feed this document as the system prompt or top-level context.
>
> **Goal:** Bring Healthcare Provider, Airline, Medtech, and Banking corpora to the same depth and
> quality as the production Apex Retail corpus (40 patterns, F200–F239, benchmarked 25/25 retrieval
> smoke / expert gauntlet 4/5).  Also generate 50 cross-industry patterns that bridge all verticals.
>
> **Output:** One TypeScript seed script file per vertical, following the exact format specified in
> §6. Each script is ready to run via `npx tsx src/scripts/seed/<file>.ts`.

---

## 1. Universal Quality Bar — What "Best-in-Class" Means

Every pattern generated must pass ALL five criteria before being included.  These are not suggestions;
they are gates.

### 1.1 Failure specificity
The description must name the **specific mechanism** by which the pattern fails — not that it "often
struggles" but exactly why: which precondition is missing, which integration break causes the failure,
which governance gap allows the error to propagate.

❌ REJECT: "AI projects fail because of poor data quality."
✅ ACCEPT: "Demand forecasting AI fails to reduce stockouts when store-level POS data is loaded
  without a lag-corrected refresh cadence — the model trains on phantom inventory created by
  same-day write-backs before physical counts close."

### 1.2 Failure rate grounding
`failureRatePct` must be a specific integer (not a range, not a placeholder), grounded in one of:
- A named industry benchmark (Gartner Magic Quadrant, McKinsey Global Survey, KLAS Research, etc.)
- A sector-specific analyst finding (IDC Health Insights, Forrester Wave, Coalition Inc., etc.)
- A class of documented project outcomes (FDA warning letters, OCC enforcement actions, FAA
  findings, NCUA enforcement, etc.)
- Reasonable expert synthesis from multiple public sources (annotate the basis in a comment)

Failure rates by domain should reflect realistic sector variance:
- Healthcare regulatory patterns: 55–85% (high due to regulatory complexity and staff change
  resistance)
- Airline operational patterns: 45–75% (mature IT estates with high change friction)
- Medtech FDA/quality patterns: 60–90% (regulatory failure rates are structurally high)
- Banking compliance patterns: 50–80% (consent order and model risk failures are well-documented)
- Back-office/tech patterns across all sectors: 40–70% (vendor lock-in, tech debt compound
  predictably)

### 1.3 Practitioner language
Use the exact vocabulary a domain CXO, VP of IT, or senior program manager would use — not
consulting-speak or generic AI narrative.
- Healthcare: RCM, CDI, prior auth, FHIR R4, Epic, Cerner, Oracle Health, ACO, VBC, SDOH, 340B,
  MCO, CMS CoP, TJC, HITRUST, HIPAA safeguards, HL7 v2, MU2/3, TEFCA
- Airline: PSS (passenger service system), NDC, OMS (order management system), CRS, GDS, ACARS,
  EFB, MRO, CAMO, AMO, AMS (airline maintenance system), IATA, FAA Part 121/145, ETOPS, iTrak
- Medtech: FDA 510(k)/PMA/DeNovo, EU MDR, IVDR, GxP, SBOM (cybersecurity), SaMD, DHF, FMEA,
  CAPA, UDI, post-market surveillance, QMS, IEC 62304, ISO 14971, SR 11-7 (model risk)
- Banking: SR 11-7, SR 11-8, MRM, model inventory, consent order, BSA/AML, KYC, CRA, CECL,
  DFAST, CCAR, BCBS 239, OCC Bulletin 2013-29, TPRM, FedNow, RTP, Reg E, Reg CC, CFPB

### 1.4 Cross-reference density
Each pattern must have 4–6 keywords that maximise retrieval overlap with other patterns and with
worldview chunks.  At least one keyword should be a recognised industry standard, tool, regulation,
or framework name (e.g., "FHIR R4", "SR 11-7", "PSS migration", "SAP S/4HANA").

### 1.5 Office category accuracy
`officeCategory` must be assigned precisely:
- `front_office`: direct patient/customer/passenger-facing capabilities (experience, sales,
  service, loyalty, access, scheduling, check-in)
- `middle_office`: decision support, risk, compliance, analytics, clinical/operational workflows,
  revenue cycle, treasury, underwriting, load planning
- `back_office`: IT infrastructure, ERP, finance systems, HR/workforce, supply chain, procurement,
  vendor management, security

### 1.6 AI insertion density and module usefulness

Every remaining domain file must include at least **8 explicit AI-insertion failure patterns**.
These are not generic "AI governance" patterns and not legacy IT failures with the word AI added.
They describe how a specific 2025–2026 AI tool category changes a real workflow, control, contract,
or regulatory risk.

Each AI-insertion pattern must name:
- the specific AI capability type, such as ambient AI, CAC AI, prior auth AI, radiology worklist
  AI, sepsis prediction AI, revenue-management personalization AI, predictive maintenance AI,
  AML graph AI, or AI code assistant; and
- the exact governance, procurement, integration, or regulatory hook that makes the pattern
  actionable in AbarVa Moves or Source, such as HIPAA BAA, FDA SaMD, SR 11-7, DOT 399.88,
  payer API SLA, model drift telemetry, vendor adoption telemetry, deployment-site validation,
  physician attestation, or FDA clearance scope.

Module mapping:
- **Intelligence** uses patterns for high-confidence domain reasoning and evidence-gap surfacing.
- **Moves** uses patterns to shape the AI initiative: unsafe-to-fund conditions, approval gates,
  adoption plan, value model, risk register, dependency map, and pre-mortem.
- **Source** uses patterns for vendor diligence: RFI/RFP questions, contract clauses, BAA/subprocessor
  review, model-risk clauses, regulatory scope, adoption telemetry, exit rights, and BAFO counters.

For demo tenants, mark 2025–2026 AI decision patterns `demoRelevant: true`. Ambient scribing,
prior auth AI, CAC AI, radiology AI, RM personalization AI, predictive maintenance AI, AI SDLC,
AML graph AI, and SaMD AI governance are live buying decisions, not abstract future-state themes.

---

## 2. Schema Definitions

### 2.1 Pattern seed interface (all verticals use this shape)

```typescript
type OfficeCategory = 'front_office' | 'middle_office' | 'back_office';

interface PatternSeed {
  code: string;          // Vertical-prefixed, e.g., "H100", "A100", "M100", "B100", "X100"
  name: string;          // Title-case noun phrase describing the failure mode (5–9 words ideal)
  officeCategory: OfficeCategory;
  failureRatePct: number; // Integer 40–90; see §1.2 grounding requirement
  description: string;   // 2–3 sentences. Sentence 1: the failure condition. Sentence 2: the
                         // specific mechanism. Sentence 3 (optional): downstream consequence.
  keywords: string[];    // 4–6 terms; at least one must be a standard/tool/regulation name
}
```

### 2.2 Knowledge source interface (one seed file per vertical)

```typescript
type KnowledgeContentType =
  | 'regulation' | 'framework' | 'benchmark' | 'research_report'
  | 'vendor_doc' | 'vendor_posture' | 'news_article' | 'case_study' | 'enforcement_action';

type KnowledgeLicenseClass =
  | 'public_domain' | 'attribution' | 'registration' | 'fair_use_excerpt' | 'licensed';

interface KnowledgeSource {
  sourceKey: string;       // snake_case: vertical_publisher_topic_year
  title: string;
  publisher: string;
  publisherUrl: string;
  sourceUrl: string;
  contentType: KnowledgeContentType;
  licenseClass: KnowledgeLicenseClass;
  publishedAt: string;     // ISO date string: "2025-01-01"
  topicTags: string[];     // 3–6 snake_case tags
  summary: string;         // 2–3 sentences. End with: "For [client], this supports..."
  relatedPatterns: string[]; // 2–4 pattern codes from the same seed file
}
```

### 2.3 Code ranges by vertical

| Vertical                   | Prefix | Range        | Target count | File name                              |
|----------------------------|--------|--------------|--------------|----------------------------------------|
| Healthcare Provider        | H      | H100–H299    | 200          | `seed-healthcare-provider-patterns.ts` |
| Airline                    | A      | A100–A299    | 200          | `seed-airline-patterns.ts`             |
| Medtech                    | M      | M100–M249    | 150          | `seed-medtech-patterns.ts`             |
| Banking / FinServ          | B      | B100–B299    | 200          | `seed-banking-patterns.ts`             |
| Cross-industry             | X      | X100–X149    | 50           | `seed-cross-industry-patterns.ts`      |

---

## 3. Healthcare Provider Corpus (H100–H299)
### Target: 200 patterns · Meridian Health

Cover each of the 22 dimensions below with a MINIMUM of 8 patterns per dimension (front, middle, and
back office distribution should reflect how that dimension actually sits in a health system).

### 3.1 Required dimensions and pattern density

| # | Dimension | Min patterns | Primary office layer |
|---|-----------|-------------|----------------------|
| 01 | Patient Access & Scheduling | 10 | front |
| 02 | Revenue Cycle Management (RCM) | 12 | middle |
| 03 | Clinical Documentation Integrity (CDI) | 8 | middle |
| 04 | Prior Authorization & Utilization Management | 8 | middle |
| 05 | Quality, Safety & Accreditation | 9 | middle |
| 06 | Population Health & Value-Based Care | 10 | middle |
| 07 | Emergency Department Flow & Throughput | 8 | front/middle |
| 08 | Nursing Workforce & Staffing | 9 | back/middle |
| 09 | Interoperability & FHIR/HL7 | 10 | back/middle |
| 10 | Cybersecurity & HIPAA Safeguards | 9 | back |
| 11 | EHR Optimization (Epic/Cerner/Oracle Health) | 10 | middle/back |
| 12 | Cloud & Infrastructure Modernization | 8 | back |
| 13 | AI/ML Governance & FDA SaMD | 8 | middle/back |
| 14 | Health Equity & SDOH | 7 | front/middle |
| 15 | Care Coordination & Transitions of Care | 8 | front/middle |
| 16 | Healthcare Supply Chain & Purchased Services | 8 | back |
| 17 | Pharmacy Operations & 340B | 8 | back/middle |
| 18 | Behavioral Health Integration | 7 | front/middle |
| 19 | Patient Experience & Engagement | 8 | front |
| 20 | Analytics & Data Platform | 8 | back/middle |
| 21 | Post-Acute & Home Health | 7 | front/middle |
| 22 | Finance, Contracting & Managed Care | 9 | back |

### 3.2 Healthcare-specific failure archetypes to include

These named failure archetypes MUST appear as named patterns (not just implied):

1. **Prior auth denial spiral** — payer scorecard changes cause blanket denials when health system's
   CDI doesn't pre-authenticate against new criteria set
2. **EHR upgrade revenue bleed** — Epic/Cerner upgrade projects cause a 15–25% coding productivity
   drop in the 90-day post-go-live window when ICD coding workflows are not rehearsed in parallel
3. **FHIR facade with HL7 v2 debt** — FHIR R4 APIs expose patient data endpoints but the underlying
   ADT feed is still HL7 v2.3 with no field-level mapping governance, creating phantom patient records
4. **Nursing float pool algorithm bias** — staffing algorithm assigns floats by credential match
   without acuity weighting, creating nurse-to-patient ratios that exceed CMS CoP thresholds during
   surge
5. **340B program dilution** — covered entity fails to maintain split-billing discipline after EHR
   migration; contract pharmacy accumulation triggers OPA audit risk
6. **VBC data lag failure** — ACO quality reporting is built on claims data with 60–90 day lag;
   attribution models assign readmissions to the wrong care period, inflating cost per member
7. **AI diagnostic aide without clinical governance** — FDA-cleared SaMD deployed without a
   physician override workflow, creating liability exposure when the algorithm output conflicts with
   clinical judgment
8. **Population health vendor lock-in** — PHM platform holds risk stratification logic as
   proprietary models; health system cannot audit attribution, run parallel models, or exit contract
   without losing 18 months of cohort history

### 3.3 Meridian Health–specific lens

Where a pattern applies directly to the Meridian Health demo tenant (CDO/CDIO persona, Meridian
Health as a regional health system with 5 hospitals, 120 employed physicians, Epic EHR, value-based
contracts with 3 MCOs), note this with a `demo_relevant: true` field in the seed data object.

---

## 4. Airline Corpus (A100–A299)
### Target: 200 patterns · SkyHarbor Air / airline industry

Cover each dimension with the stated minimum. SkyHarbor Air is modelled as a mid-size US carrier
(100–200 aircraft, legacy PSS, regional jet fleet, union labour agreements, FFP loyalty programme).

### 4.1 Required dimensions

| # | Dimension | Min patterns | Primary layer |
|---|-----------|-------------|---------------|
| 01 | Passenger Service System (PSS) & Retailing | 12 | front/middle |
| 02 | NDC & Offer/Order Management | 10 | front/middle |
| 03 | Revenue Management & Pricing | 10 | middle |
| 04 | Loyalty / Frequent Flyer Programme (FFP) | 9 | front/middle |
| 05 | Airport Operations & Ground Handling | 9 | front/back |
| 06 | Flight Operations & Crew Management | 10 | middle |
| 07 | Maintenance, Repair & Overhaul (MRO) | 10 | back/middle |
| 08 | Network Planning & Schedule Management | 8 | middle |
| 09 | Cargo & Charter Operations | 7 | front/middle |
| 10 | Customer Experience & Contact Centre | 9 | front |
| 11 | Safety Management System (SMS) & Compliance | 9 | middle |
| 12 | Fuel Management & Sustainability | 8 | back/middle |
| 13 | IT Modernization & PSS Migration | 10 | back |
| 14 | Data & Analytics Platform | 8 | back/middle |
| 15 | Cybersecurity & ACARS/Avionics Security | 9 | back |
| 16 | Disruption Management & IROPS | 8 | middle |
| 17 | GDS / Distribution Channel Management | 8 | middle/front |
| 18 | Workforce & Labour Relations | 8 | back |
| 19 | AI/ML Governance in Airline Operations | 8 | middle/back |
| 20 | Sustainability & SAF Compliance | 7 | back |

### 4.2 Airline-specific failure archetypes to include (mandatory)

1. **PSS migration mid-flight** — carrier runs live PSS migration during peak season; booking
   engine GDS connectivity drops for 48–72 hours, destroying 3–4% of quarterly revenue
2. **NDC adoption without agency tool readiness** — airline enables NDC offers and bundles but
   80% of bookings still flow through GDS-connected agencies that cannot render ancillaries, causing
   double-billing and rebooking friction
3. **Revenue management model stale on COVID-era data** — RM system retrained on 2019–2023 data
   without a COVID exclusion window; leisure/VFR demand mix is systematically under-estimated,
   causing unsold premium seats in leisure markets
4. **Crew scheduling algorithm without union rule engine** — automated crew pairing ignores rest
   rule interpretations specific to pilot contract supplements; grievances filed; 8–12% of pairings
   require manual reconstruction each cycle
5. **MRO data silos causing AOG events** — component history lives in three legacy maintenance
   systems with no unified part-number master; AOG events occur when a serviceable spare is not
   located because its canonical ID differs across systems
6. **Loyalty redemption inflation after dynamic awards** — FFP switches to dynamic award pricing
   without a floor governor; promotional redemption events create point-liability spikes that exceed
   breakage model assumptions by 2–3×
7. **SMS corrective action loop failure** — safety finding generates a CAPA in the SMS system but
   no owner is assigned for the corrective action; finding ages past 90 days; FAA ASAP audit flags
   systematic open-loop CAPA pattern
8. **Contact centre AI without PNR write authority** — airline deploys conversational AI for
   rebooking but agent cannot execute waiver codes or seat upgrades; customers escalate at 3× the
   rate predicted in the vendor pilot

### 4.3 SkyHarbor-specific lens

SkyHarbor is a legacy PSS carrier (Sabre-based) with an announced modernisation to Amadeus
Altéa. Patterns relevant to PSS migration, GDS distribution, and the Sabre-to-Amadeus transition
should reference this context where applicable. Tag relevant patterns with `demo_relevant: true`.

---

## 5. Medtech Corpus (M100–M249)
### Target: 150 patterns · Northstar Clinical Technologies

Northstar is modelled as a mid-size medical device company (imaging, diagnostics, SaMD portfolio)
with a mix of FDA-cleared and PMA-approved products, EU MDR registrations, and a legacy SAP ERP.

### 5.1 Required dimensions

| # | Dimension | Min patterns | Primary layer |
|---|-----------|-------------|---------------|
| 01 | FDA Regulatory Submission & Clearance | 12 | back/middle |
| 02 | EU MDR / IVDR Compliance | 10 | back/middle |
| 03 | Quality Management System (QMS) | 10 | back |
| 04 | Software as Medical Device (SaMD / IEC 62304) | 10 | back/middle |
| 05 | Medical Device Cybersecurity & SBOM | 9 | back |
| 06 | Post-Market Surveillance (PMS) | 9 | back/middle |
| 07 | Clinical Evidence Generation | 9 | middle |
| 08 | Supply Chain, SBOM & Tariff Risk | 9 | back |
| 09 | Manufacturing & GxP | 9 | back |
| 10 | Reimbursement & ICD/CPT Coding | 8 | middle/front |
| 11 | Sales Force Effectiveness & HCP Engagement | 8 | front |
| 12 | Field Service & Connected Device Operations | 8 | front/back |
| 13 | ERP & SAP Transformation | 9 | back |
| 14 | AI/ML in Medical Devices (FDA AI Action Plan) | 8 | back/middle |
| 15 | International Regulatory (PMDA, ANVISA, CDSCO) | 8 | back |
| 16 | M&A Integration & TSA Exit | 8 | back |
| 17 | Digital Health & Companion App Governance | 7 | front/middle |

### 5.2 Medtech-specific failure archetypes to include (mandatory)

1. **510(k) predicate trap** — device cleared via substantial equivalence to a predicate that
   subsequently received FDA Class III reclassification; entire product line requires PMA-level
   clinical data on 18-month timeline
2. **EU MDR transition backlog** — legacy devices grandfathered under CE-mark but not yet
   recertified under MDR; notified body bandwidth shortage pushes certification window past the
   EoSL date of the current certificate, creating a sales gap in EU
3. **SBOM cyber disclosure gap** — FDA's 2023 cybersecurity guidance requires a machine-readable
   SBOM for all network-connected devices in new submissions; legacy product portfolio has no SBOM
   tooling, blocking 6+ pending 510(k) submissions
4. **PMS data desert** — post-market surveillance feeds only MDR/complaint data; real-world
   performance from hospital EHRs, registries, and service logs is not systematically collected;
   FDA inspector flags PMS plan as deficient for lack of active surveillance
5. **QMS paper-to-digital gap** — QMS digitisation project migrates SOPs but does not convert
   CAPA workflows; auditors find 30–40% of CAPAs have no digital owner or due-date record
6. **SaMD algorithm drift without revalidation** — AI/ML diagnostic aid drifts as training data
   distribution shifts post-clearance; company has no automated performance monitoring, violating
   the predetermined change control plan (PCCP) submitted at clearance
7. **SAP S/4HANA migration serialisation loss** — device serialisation data (UDI, lot number, DI)
   migrated from legacy SAP to S/4 without a field-level equivalence test; post-migration audit
   finds 12–15% of serial records with broken chain of custody, triggering FDA recall risk
8. **TSA exit without data room discipline** — divestiture TSA exits on a 12-month schedule;
   shared IT services are terminated before the carved-out entity has standalone ERP, QMS, and
   regulatory submission access; FDA inspectable records become inaccessible for 4–6 months

### 5.3 Northstar-specific lens

Northstar is a Solventum-shaped imaging/diagnostics company with a recent divestiture history,
EU MDR headcount pressure, and a legacy SAP ERP modernisation in flight. Tag applicable patterns
with `demo_relevant: true`.

---

## 6. Banking / Financial Services Corpus (B100–B299)
### Target: 200 patterns · First Capital Bank

First Capital is modelled as a regional US bank ($15–25B assets, OCC-chartered, operating under
a consent order related to model risk management, active digital transformation programme).

### 6.1 Required dimensions

| # | Dimension | Min patterns | Primary layer |
|---|-----------|-------------|---------------|
| 01 | Model Risk Management (SR 11-7 / SR 11-8) | 14 | middle/back |
| 02 | Regulatory Compliance & Consent Orders | 12 | back/middle |
| 03 | BSA/AML & Financial Crime Compliance | 10 | middle |
| 04 | Credit Risk & Underwriting | 10 | middle |
| 05 | Consumer Lending & Digital Origination | 10 | front/middle |
| 06 | Digital Banking & Mobile Experience | 10 | front |
| 07 | Core Banking Modernisation | 10 | back |
| 08 | Payments Modernisation (FedNow / RTP / SWIFT) | 9 | back/middle |
| 09 | Fraud Detection & Prevention | 9 | middle |
| 10 | Customer Onboarding & KYC | 9 | front/middle |
| 11 | Third-Party & Vendor Risk Management (TPRM) | 9 | back |
| 12 | Data Governance & BCBS 239 | 9 | back/middle |
| 13 | Cloud & Infrastructure Modernisation | 8 | back |
| 14 | AI/ML Governance (SR 11-7 extension) | 9 | middle/back |
| 15 | Commercial Banking & Treasury Management | 9 | front/middle |
| 16 | Capital Markets & Trading Systems | 8 | middle/back |
| 17 | Operational Resilience & Business Continuity | 8 | back |
| 18 | ESG, Climate Risk & Reg Reporting | 8 | back/middle |
| 19 | Talent, Culture & Change Management | 8 | back |
| 20 | M&A Integration & Core Conversion | 9 | back |

### 6.2 Banking-specific failure archetypes to include (mandatory)

1. **Model inventory shadow fleet** — bank's official model inventory under SR 11-7 covers 140
   models but internal audit discovers 200+ shadow models in production (Excel, Python notebooks,
   vendor black boxes) never registered or validated; OCC examiner flags systemic MRM breakdown
2. **AML transaction monitoring threshold freeze** — alert thresholds set during system
   implementation have not been recalibrated in 3+ years; STR filing rate falls below peer percentile
   benchmark; FinCEN self-disclosure required before exam
3. **Consent order remediation waterfall** — bank addresses consent order findings in isolation
   without root-cause mapping; 18 months later, follow-on examination finds 6 of 8 original issues
   persist in a different form because underlying data lineage was never addressed
4. **Core conversion data freeze** — core banking migration requires a 72-hour freeze on
   customer account changes; communication failure means 15–20% of customers attempt transactions
   during the freeze, generating NSF fees that trigger Reg E compliance complaints
5. **FedNow iso 20022 field mapping gap** — bank enables FedNow instant payments but ISO 20022
   remittance fields are truncated to legacy NACHA field lengths in the middleware layer; corporate
   treasurers cannot reconcile payments, causing rapid volume decline after pilot
6. **KYC refresh programme stall** — CDD rule requires periodic customer re-review; KYC refresh
   programme is automated for Tier 1 customers but Tier 2/3 reviews queue in a manual workflow
   that is 14 months behind; CFPB examination flags the backlog as a pattern of disparate impact
7. **BCBS 239 risk aggregation gap** — bank reports risk-weighted assets via three separate data
   lineages (credit, market, operational) with no single golden source; DFAST submission requires
   a 6-week reconciliation sprint that cannot be reproduced under examination timeline
8. **Cloud exit clause void** — core systems migrated to cloud IaaS without a contractual right
   to egress data in a portable format; OCC Bulletin 2023-17 guidance on third-party concentration
   risk flags single-cloud dependency as supervisory concern

### 6.3 First Capital–specific lens

First Capital is operating under an MRM consent order and has a digital transformation programme
anchored on the commercial banking segment. Patterns directly relevant to OCC MRM examination
readiness, consent order remediation, and commercial digital origination should be tagged
`demo_relevant: true`.

---

## 7. Cross-Industry Corpus (X100–X149)
### Target: 50 patterns · applies to all five AbarVa verticals

Cross-industry patterns must be **genuinely vertical-agnostic** — they describe failure modes
that manifest in healthcare, airlines, medtech, banking, AND retail.  Each pattern must include
a `verticals` field listing all applicable verticals.

### 7.1 Required cross-industry dimensions (10 patterns each, 5 dimensions)

| # | Dimension | Pattern codes | Notes |
|---|-----------|--------------|-------|
| 1 | AI/ML Governance at Enterprise Scale | X100–X109 | Cover: shadow models, drift, explainability, bias, procurement of vendor AI |
| 2 | Vendor Consolidation & Third-Party Risk | X110–X119 | Cover: auto-renewal traps, SLA misalignment, concentration risk, exit clause voids |
| 3 | IT Modernisation & Core Platform Migration | X120–X129 | Cover: lift-and-shift fallacy, data migration data loss, parallel run failure, regression to monolith |
| 4 | Workforce & Change Resistance | X130–X139 | Cover: adoption decay, training theatre, super-user burnout, middle management veto |
| 5 | Data Governance & Lineage | X140–X149 | Cover: BCBS-239-style lineage gap, metadata rot, dark data proliferation, consent management at scale |

### 7.2 Cross-industry schema addition

```typescript
interface CrossIndustryPatternSeed extends PatternSeed {
  verticals: Array<'retail' | 'airline' | 'healthcare_provider' | 'medtech' | 'banking'>;
}
```

---

## 8. Output File Format

Each seed file must be self-contained and immediately runnable.  Use the following boilerplate,
substituting `[VERTICAL]`, `[PREFIX]`, `[LOW_CODE]`, `[HIGH_CODE]`, and `[PATTERNS_ARRAY]`.

```typescript
// seed-[vertical]-patterns.ts
// [VERTICAL] genome patterns — AbarVa corpus
// Code range: [PREFIX][LOW_CODE]–[PREFIX][HIGH_CODE]
// Run: npx tsx src/scripts/seed/seed-[vertical]-patterns.ts

import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { SupabaseClient } from '@supabase/supabase-js';
import { deterministicUuid } from './contradiction-engine-lib';
import { createSeedClient, loadSeedEnv, slugify } from './seed-wave-lib';

type OfficeCategory = 'front_office' | 'middle_office' | 'back_office';

interface [Vertical]PatternSeed {
  code: string;
  name: string;
  officeCategory: OfficeCategory;
  failureRatePct: number;
  description: string;
  keywords: string[];
  demoRelevant?: boolean;  // true = directly relevant to the demo tenant
}

const [VERTICAL]_PATTERNS: [Vertical]PatternSeed[] = [
  // ── [Dimension 01 name] ─────────────────────────────────
  {
    code: '[PREFIX][LOW_CODE]',
    name: '[Failure mode name]',
    officeCategory: '[office_category]',
    failureRatePct: [int],
    description: '[Failure condition]. [Specific mechanism]. [Downstream consequence].',
    keywords: ['[term1]', '[term2]', '[standard_or_tool]', '[term4]'],
    demoRelevant: [true|false],
  },
  // ... all patterns
];

function graphEdgesFor(pattern: [Vertical]PatternSeed): Array<Record<string, unknown>> {
  return [
    {
      from_node_type: 'genome_pattern',
      from_node_id: pattern.code,
      edge_type: 'belongs_to',
      to_node_type: 'office_category',
      to_node_id: pattern.officeCategory,
      vertical: '[vertical_key]',
      weight: 1.0,
      evidence: { source: 'seed', demo_seed: true },
      source_key: '[tenant_key]',
    },
    {
      from_node_type: 'genome_pattern',
      from_node_id: pattern.code,
      edge_type: 'applies_to',
      to_node_type: '[vertical_capability]',
      to_node_id: pattern.code.toLowerCase(),
      vertical: '[vertical_key]',
      weight: 0.8,
      evidence: { source: 'seed', demo_seed: true },
      source_key: '[tenant_key]',
    },
  ];
}

async function upsertRows(
  sb: SupabaseClient,
  table: string,
  rows: Array<Record<string, unknown>>,
  onConflict: string,
): Promise<void> {
  const batchSize = 50;
  for (let i = 0; i < rows.length; i += batchSize) {
    const { error } = await sb.from(table).upsert(rows.slice(i, i + batchSize), { onConflict });
    if (error) throw error;
  }
}

async function main() {
  loadSeedEnv();
  const sb = createSeedClient();

  const patternRows = [VERTICAL]_PATTERNS.map((p) => ({
    id: deterministicUuid(`[vertical]-genome-pattern:${p.code}`),
    pattern_type: 'failure_pattern',
    vertical: '[vertical_key]',
    sub_category: p.officeCategory,
    data: {
      code: p.code,
      name: p.name,
      description: p.description,
      office_category: p.officeCategory,
      keywords: p.keywords,
      demo_seed: true,
      demo_relevant: p.demoRelevant ?? false,
    },
    source_count: 6,
    confidence: 84,
    is_active: true,
    code: p.code,
    name: p.name,
    description: p.description,
    summary: p.description,
    failure_rate_pct: p.failureRatePct,
    office_category: p.officeCategory,
    keywords: p.keywords,
  }));

  const graphEdges = [VERTICAL]_PATTERNS.flatMap(graphEdgesFor);

  await upsertRows(sb, 'genome_patterns', patternRows, 'code');
  await upsertRows(
    sb,
    'intelligence_graph_edges',
    graphEdges,
    'from_node_type,from_node_id,edge_type,to_node_type,to_node_id',
  );

  const { count: patternCount } = await sb
    .from('genome_patterns')
    .select('id', { count: 'exact', head: true })
    .eq('vertical', '[vertical_key]')
    .gte('code', '[PREFIX][LOW_CODE]')
    .lte('code', '[PREFIX][HIGH_CODE]');

  console.log(`Seeded [vertical] Genome patterns: ${patternCount ?? 0}`);
}

const isDirect = process.argv[1]
  ? import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
  : false;
if (isDirect) {
  main().catch((err) => { console.error(err); process.exit(1); });
}
```

---

## 9. Quality Gate Checklist

Run this checklist before declaring any seed file complete.

### Per-file checks
- [ ] At least the target pattern count is reached (see §2.3)
- [ ] All required dimensions are covered with the stated minimum per-dimension count
- [ ] At least 8 patterns are explicit AI-insertion failure modes for the domain.
- [ ] All mandatory failure archetypes from §3.2 / §4.2 / §5.2 / §6.2 appear as named patterns
- [ ] `failureRatePct` values are integers, not ranges (no `65–72`, use `68`)
- [ ] No description is shorter than 2 sentences or longer than 4 sentences
- [ ] Every `keywords` array has 4–6 entries; at least one is a named standard/tool/regulation
- [ ] AI pattern keywords include both the AI capability type and the governance/procurement/regulatory hook.
- [ ] `officeCategory` matches the actual function (not all `back_office` as a default)
- [ ] Demo-tenant-relevant patterns are tagged `demoRelevant: true`
- [ ] TypeScript compiles cleanly (`npx tsc --noEmit`)

### Cross-file checks
- [ ] No two patterns share the same `code`
- [ ] No two patterns share the same `name` (paraphrase, don't duplicate)
- [ ] Cross-industry X-patterns include `verticals` array
- [ ] Retail patterns do not appear in the healthcare/airline/banking/medtech files

---

## 10. Annotated Exemplar — Retail F200 as the Quality Anchor

Use this as your quality reference for what a completed pattern looks like.

```typescript
{
  code: 'F200',
  name: 'Loyalty AI Built On Fragmented Identity',
  officeCategory: 'front_office',
  failureRatePct: 72,
  //                ↑ Grounded in NRF 2025 AI survey: 72% of loyalty personalisation pilots
  //                  stalled due to identity resolution failures (registration required)
  description:
    'Retail loyalty personalisation stalls when loyalty IDs, ecommerce IDs, POS tenders, ' +
    'and mobile app profiles are not resolved into a governed customer identity graph ' +
    'before model launch. ' +
    //  ↑ Sentence 1: failure condition — what precondition is missing
    'The AI recommender trains on the largest available ID (usually ecommerce), ' +
    'so store and app interactions are invisible to the model, ' +
    'halving the effective training signal for omnichannel shoppers. ' +
    //  ↑ Sentence 2: specific mechanism — the WHY
    'Loyalty redemption rates decline 18–25% in the first 90 days post-launch, ' +
    'triggering vendor blame-shifting before the root cause is diagnosed.',
    //  ↑ Sentence 3: downstream consequence — what the exec experiences
  keywords: [
    'loyalty',                  // domain term
    'identity resolution',      // mechanism term
    'customer 360',             // practitioner term
    'personalisation',          // capability term
    // Note: would benefit from 'CDP' as a tool/standard term — good example should include it
  ],
  demoRelevant: true,
}
```

---

## 11. Generation Order and Batch Strategy

To maximise pattern quality, generate in this order — do not generate all 800 patterns in one pass.
Use a dimension-by-dimension loop, writing patterns to the array as you go.

```
PHASE 1: Healthcare Provider (H100–H199) — 100 patterns across first 12 dimensions
PHASE 2: Healthcare Provider (H200–H299) — 100 patterns across remaining 10 dimensions
PHASE 3: Banking (B100–B199) — 100 patterns across first 11 dimensions
PHASE 4: Banking (B200–B299) — 100 patterns across remaining 9 dimensions
PHASE 5: Airline (A100–A199) — 100 patterns across first 10 dimensions
PHASE 6: Airline (A200–A299) — 100 patterns across remaining 10 dimensions
PHASE 7: Medtech (M100–M249) — 150 patterns across all 17 dimensions
PHASE 8: Cross-industry (X100–X149) — 50 patterns across 5 dimensions
```

After each PHASE, run the quality gate checklist in §9 before proceeding.

---

## 12. Knowledge Sources (Minimum Per Vertical)

Each vertical seed must be accompanied by a `seed-[vertical]-knowledge-sources.ts` file with at
least 12 knowledge sources.  Each source must:
- Be a real, publicly accessible publication or standard
- Have a realistic `sourceUrl` (even if behind registration)
- Have 2–4 `relatedPatterns` codes from the same vertical

### Minimum required sources per vertical

**Healthcare Provider (12+):**
- KLAS Research: State of Healthcare AI 2025
- McKinsey: The Next Frontier of Healthcare IT Transformation (2024)
- CMS: Final Rule on Prior Authorization (CMS-0057-F) 2024
- ONC: Trusted Exchange Framework and Common Agreement (TEFCA) 2024
- AHA: Workforce Survey Report 2025
- HIMSS Annual Conference Research: EHR Optimisation and AI Governance 2025
- Gartner: Hype Cycle for Healthcare AI 2025
- AMIA: Clinical AI Governance Framework 2024
- HRSA: 340B Program Oversight 2024
- Deloitte: 2025 Global Health Care Outlook
- Accenture: AI in Healthcare — From Pilot to Scale 2025
- Premier Inc: Supply Chain Analytics Benchmark 2024

**Airline (12+):**
- IATA: Digital Transformation Outlook 2025
- Amadeus: Airline IT Trends Survey 2025
- SITA: Airline IT Trends Survey 2025
- McKinsey: Reinventing the Airline Operating Model (2024)
- FAA: NextGen Modernisation Report 2025
- Oliver Wyman: Airline Economic Analysis 2025/26
- ACI: Airport IT Trends Survey 2025
- BCG: AI in Aviation — From Operational AI to Agentic AI 2025
- CAPA Centre for Aviation: Airline Alliances and Codeshares 2025
- Lufthansa Systems: Airline Retailing Platform Benchmark 2024
- ATPCO: NDC Industry Adoption Report 2025
- AeroDynamic Advisory: MRO Outlook 2025/26

**Medtech (12+):**
- FDA: AI/ML Action Plan Progress Report 2025
- FDA: Cybersecurity in Medical Devices Guidance 2023 (mandatory)
- EU Commission: MDR Implementation Status Report 2024
- Advamed: Medtech Innovation Report 2025
- McKinsey: Medtech Value Creation Through Digitisation 2024
- KPMG: Medical Device Regulatory Affairs Survey 2025
- Deloitte: 2025 Global Life Sciences Outlook
- Gartner: Hype Cycle for Life Sciences Technologies 2025
- RAPS: Regulatory Affairs Professional Society — SaMD Governance 2024
- BCG: Medtech Operating Model Redesign 2024
- EY: Medical Technology Deal Insights 2025
- PwC: Medical Device M&A and TSA Exit Complexity Report 2024

**Banking (12+):**
- OCC: Semiannual Risk Perspective 2025
- Federal Reserve: SR 11-7 Model Risk Management Guidance (baseline, always include)
- FinCEN: National AML Priorities 2024–2026
- McKinsey: The Future of US Banking 2025
- Gartner: Hype Cycle for Banking and Investment Services 2025
- Deloitte: 2025 Banking and Capital Markets Outlook
- BCG: AI in Financial Services — From Experiment to Enterprise 2025
- Accenture: Banking Technology Vision 2025
- The Clearing House: RTP Network Growth Report 2025
- FedNow Service: Adoption Trends Report 2025
- OCC: Third-Party Relationships Final Guidance (OCC 2023-17) (mandatory)
- FDIC: Community Banking Study AI Supplement 2024

---

## 13. Instructions to the Generating Model

You are generating industry failure pattern seed scripts for the AbarVa Intelligence platform.
These patterns drive the "Intelligence" surface that CXOs use to identify AI and transformation
risk in their organisations.  The quality of these patterns is the quality of the product.

**Follow these non-negotiable rules:**

1. **Never invent a failure rate without grounding it.** If you don't have a specific source,
   use the midpoint of the vertical-appropriate range from §1.2 and note "// synthesised from
   range" in a comment.

2. **Write descriptions that a CXO would read at 11pm before a board meeting.** They are not
   AI enthusiasts; they are operators. Every description should make them think "yes, that's
   exactly what happened to us / what I'm worried about."

3. **Spread office categories.** Do not default to `back_office`. A typical mature corpus has
   roughly 35% front, 35% middle, 30% back. Check your distribution before finalising.

4. **Do not repeat pattern names.** If you have already written "X Without Y Governance" for one
   dimension, find a different syntactic form for the next similar failure (verb-first: "Deploying
   X Before Y Is Ready"; outcome-first: "X Pilot Stalls On Y Readiness").

5. **The mandatory archetypes in §3.2, §4.2, §5.2, and §6.2 are not optional.** They represent
   the failure modes that AbarVa's domain experts have validated as the highest-signal, most
   credible patterns for each vertical. If you produce a file that omits any of them, it will
   fail the quality gate.

6. **Generate the full TypeScript file, not pseudocode.** The output must be copy-paste-runnable.
   Do not truncate the patterns array.  Do not use `// ... more patterns here`.

7. **For cross-industry patterns (X-series), the description must reference at least two different
   industries by name** to prove the pattern is genuinely cross-vertical, e.g. "…whether in a
   regional bank's model inventory or a health system's clinical AI programme."

Begin with PHASE 1 (Healthcare Provider H100–H199) unless instructed otherwise.
