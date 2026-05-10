# Meridian Health System · Comprehensive Seed Data Specification

**A composite Sacramento-headquartered integrated health system designed to populate the AbarVa platform with Fortune-500-scale healthcare depth, including integrated payer operations, value-based care exposure, and Pacific-state regional character.**

Meridian Health System is a composite. It is sized and structured like a regional integrated health system with provider and payer operations, comparable in scale to systems such as Sutter Health, Providence, or Kaiser Permanente Northern California. The financials, named executives, initiatives, and specific details in this document are composite representations built from real healthcare transformation patterns. Meridian must always be described as "a composite organization built from real-world data" — never as a real health system.

This specification completes the healthcare vertical in the three-composite demo library, alongside Apex Retail Group (retail) and First Capital Financial (financial services). Together, these three composites span the verticals where AbarVa's beachhead opportunity is strongest.

**Source of truth.** This document is the doc-layer reflection of the production tenant fixtures in `meridian-data/`. Where the two diverge, `meridian-data/` wins by founder directive (2026-05-10g reconciliation). Specifically:

- `meridian-data/01_enterprise_profile/enterprise_profile.md` — tenant scale, financials, strategic priorities
- `meridian-data/02_org_structure/executive_bench.json` — executive roster
- `meridian-data/02_org_structure/it_leadership.json` — IT leadership and AI Governance Council composition
- `meridian-data/06_program_inventory/active_programs.json` — in-flight transformation programs
- `meridian-data/03_it_landscape/`, `meridian-data/04_it_financials/`, `meridian-data/11_vendor_contracts/` — technology, financials, vendor stack

Reads alongside:
- `docs/specs/_meta/seed-data/apex-retail-group-comprehensive-seed.md` — the retail companion composite
- `docs/specs/_meta/seed-data/first-capital-financial-comprehensive-seed.md` — the financial-services companion composite
- `docs/specs/_meta/seed-data/meridian-intelligence-layer-overlay.md` — KPIs, patterns, telemetry sources

---

## Part 1 · Company Profile

### 1.1 · Identity and positioning

Meridian Health System is a non-profit 501(c)(3) integrated delivery network with for-profit subsidiaries, headquartered in Sacramento, California, serving patients and health plan members across California, Nevada, Oregon, and Hawaii. Founded in 1968 with the current holding-company structure formed in 2011, Meridian is one of the larger integrated systems on the US West Coast, distinguished by three structural characteristics:

- **Integrated provider and payer operations.** Meridian operates Meridian Health Plans alongside its provider network. The plan subsidiary covers approximately 1.4M lives across Medicare Advantage, Medicaid managed care, and commercial products under state insurance and CMS oversight.

- **Value-based care exposure.** Approximately $5.0B (~30%) of consolidated system revenue is risk-based or value-based, making Meridian materially exposed to risk performance even though its book is not as concentrated in VBC as systems like Kaiser. This level of exposure is a strategic priority area, not a marketing line.

- **Pacific-state regional footprint with Hawaii expansion.** Meridian acquired Pacific Queens Medical Center in Honolulu and Kona Coast Hospital on Hawaii Island during the 2022-2023 expansion cycle. Pacific Queens migrated to Epic in 2024; Kona Coast remains on Cerner Millennium after capital allocation pressure and local clinical leadership resistance paused the second-wave migration. Hawaii integration completion is named as a strategic priority but funding is deferred to FY2027.

### 1.2 · Scale and operational snapshot

As of FY2025 (fiscal year ending June 30, 2025):

- **Total revenue:** $16.8B
- **Provider operations revenue:** $11.8B
- **Health plan premium revenue:** $5.0B
- **Risk-based / value-based revenue:** ~$5.0B (~30% of total system revenue)
- **Operating margin:** 2.4% (compressed 80bp YoY from labor and MA rate pressure)
- **Capital plan:** $1.1B (Epic optimization, facilities, cybersecurity, selective AI)
- **IT operating + capital budget:** $384M (~2.3% of revenue)
- **Hospitals:** 30 across California, Nevada, Oregon, Hawaii
- **Ambulatory footprint:** 280 clinics, urgent care centers, ambulatory surgery centers, and specialty sites
- **Annual ambulatory visits:** 14.0M
- **Staffed beds:** 5,800
- **Employed physicians:** 7,400
- **Total employees:** 58,000
- **Health plan covered lives:** 1.4M (Medicare Advantage, Medicaid managed care, commercial)
- **Fiscal year:** July 1 – June 30
- **Current dataset date:** April 2026

### 1.3 · Legal entity structure

Meridian Health System is the parent not-for-profit corporation. The system includes a network of hospital operating entities, **Meridian Medical Foundation** for employed physicians and ambulatory clinics, **Meridian Health Plans LLC** for plan operations, and **Meridian Properties LLC** for owned real estate and medical-office assets.

### 1.4 · Industry classification

| Area | NAICS / regulatory frame |
|---|---|
| General medical and surgical hospitals | NAICS 622110 |
| Ambulatory health care services | NAICS 621498 / 621111 |
| Health and medical insurance carriers | NAICS 524114 |
| Pharmacy and outpatient dispensing | NAICS 446110 / 621399 |
| Medicare Advantage plan operations | CMS Medicare Advantage Program, 42 CFR Part 422 |
| HIPAA covered entity operations | 45 CFR Parts 160, 162, and 164 |

### 1.5 · Geographic footprint

Meridian operates in four states across the Pacific corridor, with concentration in California:

- **California** — headquarters state, largest hospital and ambulatory footprint, dominant Medicare Advantage book
- **Nevada** — meaningful inpatient and ambulatory footprint, growing Medicare Advantage presence
- **Oregon** — selective hospital and ambulatory footprint
- **Hawaii** — Pacific Queens Medical Center (Honolulu, Epic-migrated 2024) and Kona Coast Hospital (Hawaii Island, still on Cerner)

Strategic emphasis since FY2024 has been on operational consolidation rather than additional acute-care footprint, reflecting both the cost advantages of lower-acuity settings and the value-based care imperative to keep patients healthy rather than hospitalized.

### 1.6 · Recent corporate trajectory

Significant events over the past 24 months:

- **2022-2023 · Hawaii expansion.** Acquired Pacific Queens Medical Center (Honolulu) and Kona Coast Hospital (Hawaii Island).

- **2024 · Pacific Queens Epic migration.** Pacific Queens migrated to Epic. Kona Coast remains on Cerner Millennium after capital and clinical leadership resistance paused the second-wave migration.

- **2024 · DENIALS-2024.** A revenue-cycle technology project failed publicly, accumulating $8M in sunk cost. The project's failure created the trust deficit that the FY2026 RCM Modernization program now has to overcome and is the primary reason the CFO's office is applying a sharper attribution lens to every transformation program.

- **Q3 FY2025 · Board-issued AI risk policy.** The board issued an AI risk policy requiring clinical AI governance attestation. This is the upstream forcing function for the Clinical AI Governance Uplift program in FY2026.

- **Q4 FY2025 · Denial-rate spike.** Denial rates spiked, compounding the DENIALS-2024 narrative and making revenue cycle modernization politically unavoidable.

- **FY2025 · Operating margin compression.** Operating margin compressed by 80bp due to nursing wage inflation, traveler dependence, and Medicare Advantage rate pressure.

- **October 2025 · CDIO transition.** Dr. Anita Krishnamurthy joined as Chief Digital and Information Officer from Optum Care, replacing the post-DENIALS-2024 leadership gap left by Dr. Aiden Walsh. Her board mandate is to formalize clinical AI governance, modernize revenue cycle technology, and stabilize the application portfolio.

- **December 2025 · VP Application Services vacancy.** The VP Application Services role went vacant after retirement and remains open as of April 2026. The vacancy creates application ownership ambiguity across Epic, plan systems, and integration programs.

- **Q1 2026 · AI Governance Council operational charter.** The board-mandated AI Governance Council ratified its operational charter on 2026-01-18 with Dr. Jennifer Wexler (CMIO) as chair. Council currently has 23 use cases under review; 4 attested; 19 in progress; 3 shadow-AI scribe pilots recently surfaced.

- **April 2026 · Active state.** This is the tension that defines Meridian's current data room: the organization has mature clinical data, an unusually strategic plan business, and enough scar tissue from DENIALS-2024 to make every new AI claim earn its right to proceed.

---

## Part 2 · Executive Leadership

The Meridian executive committee comprises 21 named leaders (per `meridian-data/02_org_structure/executive_bench.json`) reporting through CEO Dr. Elaine Morales, plus the Board Chair.

### 2.1 · Executive roster

| Person | Title | Reports to | Scope |
|---|---|---|---|
| **Harold Kim** | Board Chair | Board | system |
| **Dr. Elaine Morales** | President & Chief Executive Officer | Board | system |
| **Dr. Anita Krishnamurthy** | Chief Digital and Information Officer (CDIO) | CEO | system |
| **David Park** | Chief Financial Officer (CFO) | CEO | system |
| **Dr. Marcus Reid** | Chief Physician Executive (CPE) | CEO | provider |
| **Sarah O'Brien** | Chief Operating Officer (COO) | CEO | provider |
| **Rebecca Hollings** | General Counsel | CEO | system |
| **Margaret Liu** | Chief Human Resources Officer (CHRO) | CEO | system |
| **Thomas Hartwell** | President, Meridian Health Plans | CEO | plan |
| **Angela Brooks** | Chief Procurement Officer | CFO | system |
| **Dr. Jennifer Wexler** | Chief Medical Information Officer (CMIO) | CPE | provider |
| **Dr. James Okonjo** | Chief Quality Officer | CPE | shared |
| **Dr. Robert Chen** | Chief Nursing Officer | COO | provider |
| **Patricia Okafor** | VP Revenue Cycle | CFO | provider |
| **Karen Mercer** | Chief Compliance Officer | General Counsel | system |
| **Maya Iyer** | Chief Product Officer, Digital Health | CDIO | shared |
| **Dr. Lakshmi Venkatesan** | Chief Medical Officer, Meridian Health Plans | President MHP | plan |
| **Andrew Fitzgerald** | VP Network Management | President MHP | plan |
| **Dr. Priya Sharma** | VP Care Management & Population Health | Plan CMO | shared |
| **Christopher Vega** | VP Risk Adjustment & STAR Quality | President MHP | plan |
| **VACANT** | VP Application Services | CDIO | shared |

### 2.2 · AI Governance Council

Charter ratified 2026-01-18 following Q3 FY2025 board AI risk policy.

- **Chair:** Dr. Jennifer Wexler (CMIO)
- **Members:** Dr. Anita Krishnamurthy (CDIO), Rebecca Hollings (General Counsel), Karen Mercer (Chief Compliance Officer), Dr. Lakshmi Venkatesan (Plan CMO), Dr. Marcus Reid (CPE), Daniel Reyes, plus a rotating physician representative
- **Cadence:** Monthly, with ad hoc review for high-risk clinical AI
- **Authority:** Every clinical AI use case must have inventory, risk classification, FDA/state regulatory attestation, model-owner assignment, and monitoring plan
- **Current state:** 23 use cases under review; 4 attested; 19 in progress; 3 shadow scribe pilots recently surfaced

---

## Part 3 · Strategic Priorities · FY2026

Meridian operates under five FY2026 strategic priorities (per `meridian-data/01_enterprise_profile/enterprise_profile.md`).

### 3.1 · Operating margin recovery

After 80bp margin compression in FY2025, FY2026 priority work spans labor cost reduction, denial recovery, throughput improvement, and service-line margin discipline. CFO David Park is the de facto integrating sponsor across these workstreams.

### 3.2 · Health plan growth

Medicare Advantage retention and acquisition, with close attention to quality bonus performance and network adequacy. Owner: Thomas Hartwell (President MHP) with Dr. Lakshmi Venkatesan (Plan CMO) and Christopher Vega (VP Risk Adjustment & STAR Quality).

### 3.3 · Value-based care performance

Quality measures, total cost of care, gap closure, and population health execution. Owner: Dr. Priya Sharma (VP Care Management & Population Health) with Plan CMO and CPE coordination.

### 3.4 · AI governance and capability formalization

Board-mandated formalization following the Q3 FY2025 AI risk policy. Three named workstreams below in Part 5. Owners: Dr. Jennifer Wexler (CMIO, Council chair), Dr. Anita Krishnamurthy (CDIO), Rebecca Hollings (General Counsel), Karen Mercer (Chief Compliance).

### 3.5 · Hawaii market integration completion

Still listed as a strategic priority but **current funding is deferred to FY2027**. The Kona Coast / Cerner residual is the main outstanding integration item.

---

## Part 4 · Executive Profiles · VIP Depth

Profiles below are demo-relevant subset. Full operational profiles for all 21 executives live in `meridian-data/02_org_structure/executive_bench.json`. The agent-facing profile system (in `src/scripts/seed/executive-profiles-data.ts`) currently carries the Thomas Hartwell composite as the seeded VIP profile; additional profiles get added as engagements warrant.

### 4.1 · Dr. Elaine Morales · President & CEO

- **Tenure:** 2 years in role; 9 years at Meridian
- **Reports to:** Board (Harold Kim, Chair)
- **Direct reports:** 8
- **Stated FY2026 priorities:** margin recovery, clinical quality and safety, provider-plan integration, AI governance where relevant
- **Decision pattern:** Bridge-builder across provider and plan boundaries; can escalate to Executive Committee for enterprise tradeoffs
- **VIP-enriched reasoning notes for agents:** Lead with clinical and operational evidence. Provider-plan integration framing lands well. The post-DENIALS-2024 trust deficit means new transformation claims need attribution discipline before scope.

### 4.2 · Dr. Anita Krishnamurthy · CDIO

- **Tenure:** 0.5 years in role (joined October 2025)
- **Prior:** Optum Care
- **Reports to:** CEO
- **Direct reports:** 8 (including Maya Iyer · CPO Digital Health and the VACANT VP Application Services)
- **Stated FY2026 priorities:** AI governance formalization, RCM modernization, Epic optimization, application portfolio stabilization, cybersecurity posture
- **Decision pattern:** Bridge-builder; pragmatic on cloud AI evaluation while keeping research workloads local-first until PHI/IRB controls are enforceable
- **VIP-enriched reasoning notes for agents:** Likely an AbarVa champion given her recency, board mandate, and the alignment between AbarVa's positioning and her AI governance agenda. Sophisticated buyer.

### 4.3 · David Park · CFO

- **Tenure:** 4 years in role; 4 years at Meridian
- **Reports to:** CEO
- **Direct reports:** 8 (including Patricia Okafor · VP Revenue Cycle and Angela Brooks · CPO)
- **Stated FY2026 priorities:** margin recovery, capital allocation discipline, RCM modernization sponsorship, plan-provider economics alignment
- **Coalition:** Cost and capital discipline coalition. Sponsor of `meridian-rcm-modernization-2026` (P1 Discovery)
- **Known pain points:** DENIALS-2024 sunk cost narrative; Q4 FY2025 denial spike; Medicare Advantage rate pressure on plan economics; capital allocation tension between Hawaii integration, AI investment, and clinical capital

### 4.4 · Dr. Marcus Reid · Chief Physician Executive

- **Tenure:** 7 years in role; 11 years at Meridian
- **Reports to:** CEO
- **Direct reports:** 8 (including Dr. Jennifer Wexler · CMIO and Dr. James Okonjo · CQO)
- **Stated FY2026 priorities:** clinical quality and safety, physician workforce, AI governance clinical voice, value-based care execution
- **Coalition:** Clinical autonomy and safety coalition

### 4.5 · Dr. Jennifer Wexler · CMIO

- **Tenure:** 5 years in role; 8 years at Meridian
- **Reports to:** CPE (Dr. Marcus Reid)
- **AI Governance Council chair**
- **Sponsor of:** `meridian-ambient-2026` (Ambient Clinical Documentation, P3 Design) and `meridian-ai-governance-2026` (Clinical AI Governance Uplift, P2 Synthesis)
- **Known concern:** Sponsor on two of four programs simultaneously creates bandwidth risk (HIGH)

### 4.6 · Sarah O'Brien · COO

- **Tenure:** 3 years in role; 7 years at Meridian
- **Reports to:** CEO
- **Direct reports:** 8 (including Dr. Robert Chen · CNO)
- **Stated FY2026 priorities:** throughput, cost recovery, ambulatory access, Hawaii integration completion (funding deferred to FY2027)
- **Coalition:** Bridge-builder across provider and plan boundaries

### 4.7 · Thomas Hartwell · President, Meridian Health Plans

- **Tenure:** 6 years in role; 8 years at Meridian
- **Reports to:** CEO
- **Direct reports:** 8 (including Dr. Lakshmi Venkatesan · Plan CMO, Andrew Fitzgerald · VP Network, Christopher Vega · VP Risk Adjustment & STAR Quality)
- **Stated FY2026 priorities:** Medicare Advantage growth and quality, member retention, plan-side risk adjustment, plan-provider economics
- **Known pain points:** MA rate pressure compressed margins 80bp YoY; competitive pressure from national plans entering CA / NV / OR / HI markets; tension between commercial mandate and system VBC stance

### 4.8 · Patricia Okafor · VP Revenue Cycle

- **Tenure:** 1.2 years in role; 6 years at Meridian
- **Reports to:** CFO (David Park)
- **Sponsor of:** `meridian-prior-auth-2026` (Prior Authorization Automation, P4 Build) — engagement with Cohere Health
- **Known pain points:** Carrying the DENIALS-2024 narrative; Q4 FY2025 denial spike forced RCM modernization onto the FY2026 board roadmap

### 4.9 · Rebecca Hollings · General Counsel

- **Tenure:** 9 years in role; 9 years at Meridian
- **Reports to:** CEO
- **Direct reports:** 4 (including Karen Mercer · Chief Compliance Officer)
- **Stated FY2026 priorities:** AI governance legal scaffolding, plan regulatory exposure, contract reviews on the four FY2026 transformation programs
- **AI Governance Council member**

### 4.10 · Maya Iyer · Chief Product Officer, Digital Health

- **Tenure:** 1.5 years in role; 3 years at Meridian
- **Reports to:** CDIO (Dr. Anita Krishnamurthy)
- **Stated FY2026 priorities:** patient access product modernization, care-navigation product portfolio, product operating model, digital product evidence and adoption metrics
- **Coalition:** Product-outcome coalition; bridges CDIO, clinical leadership, health-plan product, and operations when digital programs risk becoming pure technology work

---

## Part 5 · Active Transformation Programs · FY2026

Four named programs in flight (per `meridian-data/06_program_inventory/active_programs.json`).

### 5.1 · `meridian-ambient-2026` · Ambient Clinical Documentation Rollout

- **Phase:** P3 Design
- **Sponsor:** Dr. Jennifer Wexler (CMIO)
- **Scope:** Production rollout of ambient clinical documentation across primary care and selected specialty cohorts. Vendor evaluation: Abridge under active evaluation alongside the incumbent path.
- **Cost note:** Abridge contracted at $3.47M annual; renewal date April 15, 2026 (now past — under renegotiation)
- **Critical signal:** Epic integration concentration is the cross-program risk

### 5.2 · `meridian-prior-auth-2026` · Prior Authorization Automation

- **Phase:** P4 Build
- **Sponsor:** Patricia Okafor (VP Revenue Cycle)
- **Vendor:** Cohere Health engaged
- **Budget:** $9.8M total, $6.1M consumed
- **Scope:** Prior authorization automation across plan and provider operations. Plan-side adoption is the bottleneck; provider-side adoption is ahead.

### 5.3 · `meridian-ai-governance-2026` · Clinical AI Governance Uplift

- **Phase:** P2 Synthesis
- **Sponsor:** Dr. Jennifer Wexler (CMIO)
- **Scope:** Operationalize the AI Governance Council charter across the 23-use-case inventory; close the governance gap on the 3 surfaced shadow scribe pilots; build the attestation/monitoring infrastructure.
- **Triggered by:** Q3 FY2025 board AI risk policy

### 5.4 · `meridian-rcm-modernization-2026` · RCM Modernization

- **Phase:** P1 Discovery
- **Sponsor:** David Park (CFO)
- **Scope:** Revenue cycle technology and process modernization; carries the DENIALS-2024 trust deficit; politically unavoidable after Q4 FY2025 denial spike
- **Cross-program dependency:** Shares Epic integration concentration with the other three programs

### 5.5 · Epic integration concentration · open critical signal

A single critical cross-program signal is open: all four FY2026 transformation programs depend on the same Epic integration layer (prior-auth rule sets, ambient API access, denial adjudication, RCM revenue codes). The Kona Coast Cerner residual makes this concentration even more pronounced. This is the primary architectural risk the AI Governance Council is tracking.

---

## Part 6 · Active Patterns Observable in Meridian Data

Patterns the agent layer should recognize and reason about. These align with the seven full-schema pattern packs in `meridian-intelligence-layer-overlay.md` Part 3.

### 6.1 · Shadow AI in clinical and revenue cycle operations

**Healthcare-specific variant of the cross-sector Shadow AI Governance pattern.** AI Governance Council surfaced 23 clinical-AI use cases under review; 4 attested; 19 in progress; 3 shadow scribe pilots recently surfaced operating outside central governance. PHI handling, BAA coverage, and clinical decision influence are the primary risks.

### 6.2 · Revenue cycle denial cascade

Q4 FY2025 denial spike + DENIALS-2024 sunk cost narrative. First-pass denial rates, clean claim rates, and POS collections all underperform peer median. RCM Modernization program is the primary intervention.

### 6.3 · Value-based care progression lag

VBC revenue at ~30% of total system revenue. The lag matters because plan economics (under Hartwell) and provider risk-bearing capacity (under Reid + Sharma) diverge in interesting ways for an integrated system.

### 6.4 · Care transitions and readmission gap

Care coordination FTE staffing below peer; readmission rate above target. Cross-program implication for VBC performance and Plan-side MLR.

### 6.5 · Access and capacity mismatch

Days to third next available exceeds peer median in primary care and specialty. ED boarding time elevated. Telehealth utilization underleveraged. Direct read on Hartwell's MA retention and Iyer's patient access product modernization work.

### 6.6 · Physician burnout and engagement erosion

Burnout index elevated; documentation burden identified as primary driver. Ambient documentation rollout is the primary intervention; CMIO Wexler's bandwidth risk (sponsoring two programs) is the upstream constraint.

### 6.7 · MA risk adjustment maturation gap

Plan-side risk adjustment accuracy below benchmark. Owner: Christopher Vega (VP Risk Adjustment & STAR Quality). Compounds plan margin pressure and STAR rating progression.

---

## Part 7 · Vendor and Technology Landscape

Per `meridian-data/03_it_landscape/` and `meridian-data/11_vendor_contracts/`.

### 7.1 · Core clinical systems

- **EHR — Epic** across the Meridian-legacy footprint and Pacific Queens (migrated 2024)
- **EHR — Cerner Millennium** at Kona Coast Hospital (Hawaii Island; second-wave migration paused)
- **Payer core** — health plan core administration system, integrated with Epic via federated data platform
- **Clinical data platform** — Epic Cogito with supplementary platforms for advanced analytics
- **Patient engagement** — Epic MyChart plus custom extensions (Maya Iyer's product remit)
- **Population health** — internal platform with selected third-party components

### 7.2 · AI and analytics stack

- **Cloud:** Multi-cloud with AWS primary and Azure secondary at the enterprise analytics layer
- **LLM providers (research):** Research does not currently use Anthropic Claude on Bedrock, Azure Foundry, OpenAI, or other external hosted LLMs for active research workflows. The current research runtime is local-first (Palantir Foundry, a Hadoop research lake, and an on-prem NVIDIA/private GPU stack with locally hosted open-weight models). The new CDIO is evaluating governed cloud AI options including GCP-style healthcare research patterns, but PHI, IRB, data-egress, and security controls remain gating issues. See `src/data/meridian/research_ai.ts` for the typed canonical posture.
- **Clinical AI tools:** Ambient documentation (Abridge under active evaluation); imaging AI across modalities (Paige AI under review for pathology); clinical decision support via Epic tools; sepsis prediction; readmission risk
- **Analytics:** Tableau, internal tools, Tableau Cloud migration in progress

### 7.3 · AI vendor engagements (production state)

| Vendor | Use case | Status | Annual spend |
|---|---|---|---|
| Cohere Health | Prior Authorization Automation | Engaged · `meridian-prior-auth-2026` P4 Build | $2.04M |
| Abridge | Ambient Clinical Documentation | Active evaluation (renewal under negotiation) | $3.47M |
| Paige AI | Pathology imaging | Under review | $0.61M |
| Internal NVIDIA + Palantir + Hadoop | Research AI runtime | Local-first; cloud AI under CIO evaluation | embedded in $384M IT budget |

### 7.4 · Shadow AI inventory (April 2026)

23 clinical-AI use cases under AI Governance Council review; 19 not yet attested; 3 surfaced shadow scribe pilots operating outside central governance. This is the inventory that the `meridian-ai-governance-2026` program is operationalizing.

---

## Part 8 · Prior AbarVa Programs at Meridian

No AbarVa-shaped Programs have closed at Meridian to date. The four FY2026 transformation programs (`meridian-ambient-2026`, `meridian-prior-auth-2026`, `meridian-ai-governance-2026`, `meridian-rcm-modernization-2026`) are the active candidates for AbarVa engagement; the agent layer reasons over them as in-flight transformation work owned by named sponsors, not yet as AbarVa-shaped Strategic Moves.

---

## Part 9 · Benchmarks and Peer Data Layer

### 9.1 · Peer set definition

**Pacific-state and integrated-IDN peers (primary):**
- Sutter Health (CA)
- Providence (multi-state Pacific corridor)
- Kaiser Permanente Northern California (integrated payer-provider, larger scale)
- CommonSpirit Health
- Memorial Hermann (extended)

**National integrated payer-provider peers (extended):**
- Geisinger Health System
- Henry Ford Health
- Intermountain Health (extended)

**Health plan benchmarking:**
- Humana (Medicare Advantage benchmark)
- UnitedHealthcare (commercial benchmark)
- Elevance Health

### 9.2 · Benchmark categories

Financial, clinical quality, patient experience, operational, payer, workforce, AI/digital — same shape as the apex / first-capital companion docs.

### 9.3 · Public data sources

CMS Hospital Compare, CMS MA Star Ratings, ACO performance data, AHRQ quality indicators, Leapfrog data, Moody's and S&P rating reports, Health Affairs research, Joint Commission reports, NCQA reports, peer 990s.

### 9.4 · Demo-relevant benchmarks

- **VBC revenue share · national average:** 24%; **Meridian:** ~30%; peer leaders 50–80%
- **Operating margin · non-profit health system average:** 2.8%; **Meridian:** 2.4% (under pressure); peer leaders 4–6%
- **Medicare Advantage Stars · national average:** 3.8; Meridian's MA STAR program is a named FY2026 priority under Hartwell + Vega
- **Physician burnout · national average:** 53%; Meridian elevated, primary driver is documentation burden
- **Ambient documentation adoption · national average:** 8% of physicians; Meridian rollout in P3 Design

---

## Part 10 · Data Room Inventory

### 10.1 · Client-private datasets (`meridian-data/`)

- Full org structure (58,000 employees; richest depth on the 21-person executive committee + AI Governance Council members)
- VIP profiles for all 21 executives
- IT landscape, IT financials, vendor contracts (`meridian-data/03_it_landscape/`, `04_it_financials/`, `11_vendor_contracts/`)
- Active program inventory (`06_program_inventory/active_programs.json`)
- KPI dictionary (`05_kpi_dictionary/`)
- Compliance posture and audit findings (`12_compliance/`)
- Cross-program signals (`14_cross_program_signals/`)
- Operational telemetry (`10_operating_telemetry/`)
- Evidence ledger (`09_evidence_ledger/`)

### 10.2 · Platform-public datasets

- CMS data (continuous)
- Peer system publicly-available data
- Health Affairs, JAMA, NEJM research indexing
- Regulatory updates (CMS, state health departments)
- Industry analyst data (Moody's, S&P, healthcare sector specialists)

### 10.3 · Known gaps

- Granular operating data from Kona Coast Cerner residual
- Patient-reported outcomes data at scale
- Social determinants of health data integration
- Plan-side claim-level adjudication detail (privacy + payer-contract sensitivity)

---

## Part 11 · How This Data Flows to Agents

Same pattern as Apex seed (Part 12 of Apex document). Nexus consumes role-specific context, Sentinel integrates external research, Atlas aggregates cross-system patterns, Steward handles admin.

Meridian-specific adaptations:

- **Clinical vs operational vs payer context** — agents recognize whether a Program touches clinical operations (Reid / Wexler / Chen), operational throughput (O'Brien / Park), payer (Hartwell / Venkatesan / Vega / Fitzgerald), or AI governance (Wexler / Krishnamurthy / Hollings / Mercer), and adjust framing accordingly.
- **Value-based care reasoning** — agents understand fee-for-service vs value-based revenue dynamics (~30% VBC) when shaping recommendations.
- **DENIALS-2024 sensitivity** — every revenue cycle recommendation passes through the post-DENIALS-2024 attribution discipline filter. The CFO's office is the gating sponsor.
- **Research AI canon** — agents must respect `src/data/meridian/research_ai.ts` posture: research is local-first today; cloud AI is under CDIO evaluation, not deployed. Anthropic Claude / OpenAI / Bedrock / Azure Foundry are evaluation paths, not active research runtimes.
- **CMIO bandwidth risk** — Dr. Jennifer Wexler sponsors two of four FY2026 programs; agents flag this as a HIGH bandwidth risk when reasoning about program advance.
- **Epic integration concentration** — open critical signal across all four programs.

---

## Part 12 · Summary

**Meridian vs Apex composite comparison:**

| Dimension | Apex Retail Group | Meridian Health System |
|---|---|---|
| Industry | Retail | Healthcare (integrated provider + payer) |
| Scale | $108B revenue | $16.8B revenue |
| Geography | National (1,976 stores) | Pacific corridor (CA, NV, OR, HI) |
| Business complexity | 8 merchandise categories | 30 hospitals + 280 ambulatory + 4 plan products + research |
| Strategic pressure | Margin + AI adoption + activist investor | Operating margin recovery + DENIALS-2024 trust deficit + AI governance + Hawaii integration |
| Regulatory intensity | Moderate | High (CMS, state DOIs, HIPAA, FDA) |
| Demo narrative anchor | Shadow AI $2.3M signal | Epic integration concentration · Shadow AI scribe pilots · DENIALS-2024 trust deficit |
| Key tensions | Merchandising ↔ Planning ↔ Supply Chain | Provider ↔ Payer · CMIO bandwidth · CDIO new (Krishnamurthy) · CFO discipline (Park) |

Both composites enable rich agent reasoning. Which one anchors the demo depends on prospect industry.

---

**END OF DOCUMENT · MERIDIAN HEALTH SYSTEM COMPREHENSIVE SEED DATA SPECIFICATION**

*Reconciled to production fixtures 2026-05-10 per founder directive (VOICE.STRAT-2026-05-10g). Source of truth: `meridian-data/`. Prior Mountain-West / Vasquez / Oshima / Chen-Winters narrative is retired in full; do not re-introduce it without an explicit reconciliation decision reversing this directive.*
