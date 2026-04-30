# Codex Prompt Set — Meridian Health Synthetic Tenant Dataset

> **Purpose.** This document is the prompt set for generating the full Meridian Health synthetic tenant dataset at the same depth as Apex Retail. Meridian is the second of three flagship synthetic tenants (Apex Retail = specialty retail; Meridian Health = integrated delivery network with health plan; First Capital = financial services).
>
> **Audience.** Codex agent producing the dataset. Anand for review and approval at quality gates.
>
> **Reference dataset.** Apex Retail full-depth dataset at `apex-data/` (30 files across 14 folders). Codex MUST read the Apex equivalents before generating each Meridian file to maintain structural consistency.
>
> **Output target.** `meridian-data/` with parallel folder structure to `apex-data/`, ~30-35 files, ~350-450KB total content.

---

## How to use this document

1. Codex reads Section 1 (master persona) before any generation.
2. For each family, codex reads the corresponding Apex file(s) to internalize structure.
3. Codex generates the Meridian file using the family-specific prompt in Section 2.
4. After all 14 families are generated, codex runs the cross-family consistency check (Section 3).
5. Quality gate review (Section 4) before declaring complete.

Each family prompt is self-contained and runs in sequence. Generation order matters because later families reference earlier families — produce in numerical order (01 through 14).

---

## SECTION 1 — Master Persona Prompt

You are generating synthetic tenant data for Meridian Health System, a flagship reference tenant for the AbarVa platform. The data must read like a real $16.8B integrated delivery network's data room — not a sanitized brochure version.

### Meridian Health System — full personality

**Scale and structure:**
- $16.8B annual revenue (FY2025); FY runs July-June
- Not-for-profit 501(c)(3) integrated delivery network with for-profit subsidiaries
- 30 hospitals across 4 states (California-anchored, plus Nevada, Oregon, Hawaii)
- 5,800 staffed beds
- 58,000 employees: 7,400 employed physicians, 14,500 nurses, balance support and admin
- 14M annual ambulatory visits
- 280 ambulatory clinics, urgent care centers, ambulatory surgery centers
- Headquartered Sacramento, California
- Major hub markets: Sacramento, Bay Area, Central Valley, Southern Oregon, Las Vegas, Honolulu

**Health plan business (Meridian Health Plans):**
- Provider-sponsored health plan structure
- 1.4M covered lives
- Lines: Medicare Advantage (~720K members, largest), Medicaid managed care (~380K), Commercial group/individual (~300K)
- ~30% of system revenue is risk-based / value-based (~$5B annually)
- This is the strategic differentiator — provider-payer integration with all the political and operational tension that implies

**EHR posture:**
- Epic across the system (~9 years on Epic, post-stabilization, mid-optimization)
- Multiple historical Epic instances from acquisitions; consolidating to single instance, ~80% complete
- Cerner remnants in 2 acquired Hawaii hospitals; consolidation paused after capital allocation pressure

**Health plan tech stack:**
- HealthEdge HealthRules Payer (claims, core admin)
- DST Health Solutions (commercial admin, sunset planned)
- Innovaccer (population health, risk stratification)
- Custom data platform combining Epic Cosmos data with claims (internal name: Atlas)
- ZeOmega Jiva (utilization management, care management)

**Recent context (FY2026 in progress, current "today" for the dataset = April 2026):**

- **New CDIO October 2025**: Dr. Anita Krishnamurthy joined from Optum Care after the previous CIO exited following DENIALS-2024 failure
- **Operating margin compressed 80bp in FY2025**: labor costs (nursing wage inflation, traveler dependence post-COVID), Medicare Advantage rate compression
- **Board AI risk policy** issued Q3 2025: every clinical AI use case requires Clinical AI Governance Committee approval with documented FDA/state regulatory attestation
- **Q4 FY2025 denial rate spike**: institutional pressure to deliver on RCM modernization
- **Major MA contract renewal coming** in 2027: quality measures performance critical
- **Hawaii integration paused**: one Hawaii hospital remains on Cerner; consolidation deferred to FY2027 budget cycle

**Strategic priorities (FY2026):**
1. Operating margin recovery — labor cost reduction, denial recovery, throughput improvement
2. Health plan growth — Medicare Advantage member retention and acquisition
3. Value-based care performance — quality measures, total cost of care
4. AI governance and capability formalization — board mandated
5. Hawaii market integration completion (deferred)

**Strong areas:**
- Clinical operations depth (Epic well-utilized, mature analytics)
- Population health management (Innovaccer + Cosmos + claims integration is real and competitive)
- Care management for risk-based populations
- Quality reporting infrastructure (HEDIS, MA STARs)

**Weak areas:**
- Revenue cycle modernization (denials, prior auth, patient financial experience all friction points)
- Cross-affiliate data integration (acquisitions left fragmentation; Hawaii Cerner remnant most visible)
- Provider-payer data sharing inside the system (HIPAA same-entity exception applies but practical/political constraints make data flow harder than expected)
- Workforce management (nursing labor planning, traveler optimization)
- Patient-facing digital experience (lagging consumer-grade brands)

### The 5 realism techniques (apply throughout)

These are non-negotiable. Synthetic data that's uniformly clean reads as fake.

**1. Imperfection (~12% missing-or-stale budget across the dataset)**
- Some system inventory entries have missing owner fields
- Some KPI definitions have `instrumentation_status: "claimed but not measured"` — this is real and important
- Some evidence ledger items have `confidence: 0.55-0.70` and explicit caveats
- Some org structure entries show `tenure: <6 months` for recent hires; some roles marked `vacant / acting` (especially after the 2025 leadership turnover)
- Some compliance posture sections are flagged "review overdue"

**2. Contradictions (designed in, not happenstance)**
- The CFO's stated cost-takeout target conflicts with the CMIO's clinical AI investment thesis
- The board's AI risk policy mandates governance discipline; some active programs are out of compliance with the policy
- Plan-side stated network adequacy KPI conflicts with provider-side capacity constraints in two markets
- The DENIALS-2024 failure left scar tissue that conflicts with the strategic need to invest in RCM AI again
- Hawaii integration paused while strategic priority lists "Hawaii market integration completion"

**3. History (the past shapes the present)**
- DENIALS-2024 failure ($8M sunk, previous CIO exited) is the foundational scar — every RCM proposal carries it
- EPIC-CONSOL-HAWAII-2024 partial failure (one hospital migrated, second paused) drives current capital allocation tension
- PATIENT-DIGITAL-2023 quiet failure (app shipped, adoption never crossed 18%) shapes current patient-experience caution
- Three of the current 4 active programs trace lineage to past initiatives

**4. Specificity (caveats, units, biases explicit)**
- HCAHPS scores include the 30% response rate and skew toward extreme experiences
- ALOS measured includes observation status conversion adjustment
- MAPE-equivalent for census forecasting includes seasonal adjustment caveats
- Denial rate has gross-vs-net distinction explicitly named
- MA STAR ratings cite the specific measure year and CMS data source

**5. Asymmetric depth (rich where Meridian is strong; sparse where weak)**
- Clinical operations data: full depth, mature, multiple cross-references
- Population health data: full depth (this is competitive strength)
- Revenue cycle data: visibly thinner with explicit gaps flagged
- Cross-affiliate integration: explicit fragmentation visible in system inventory
- Provider-payer data sharing: explicit constraints in operating telemetry
- Workforce management: thinner than provider clinical operations

### Key named individuals (use consistently across all files)

These executives appear in multiple files. Codex must use these names consistently. Generate additional supporting cast as needed but anchor on this core list.

**System leadership:**
- **Dr. Anita Krishnamurthy** — Chief Digital and Information Officer (CDIO), 6 months in role, came from Optum Care
- **David Park** — Chief Financial Officer, 4 years in role, came from Sutter
- **Dr. Marcus Reid** — Chief Physician Executive (CPE), 7 years in role, internist, AMC background
- **Dr. Jennifer Wexler** — Chief Medical Information Officer (CMIO), 5 years in role, hospitalist
- **Sarah O'Brien** — Chief Operating Officer, 3 years in role
- **Rebecca Hollings** — General Counsel, 9 years in role, healthcare regulatory background
- **Dr. James Okonjo** — Chief Quality Officer, 6 years in role, internal medicine
- **Patricia Okafor** — VP Revenue Cycle (rotated into role 2025 post-DENIALS-2024)
- **Margaret Liu** — Chief Human Resources Officer, 4 years in role
- **Karen Mercer** — Chief Compliance Officer, 11 years in role
- **Dr. Robert Chen** — Chief Nursing Officer, 5 years in role

**Plan leadership (Meridian Health Plans):**
- **Thomas Hartwell** — President, Meridian Health Plans, 6 years in role
- **Dr. Lakshmi Venkatesan** — Chief Medical Officer, Meridian Health Plans, 4 years in role
- **Andrew Fitzgerald** — VP Network Management, 8 years in role
- **Dr. Priya Sharma** — VP Care Management & Population Health, 5 years in role
- **Christopher Vega** — VP Risk Adjustment & STAR Quality, 3 years in role

**IT leadership (under CDIO):**
- **Dr. Kavita Patel** — Associate CMIO, AI (program lead on ambient documentation)
- **Marcus Chen** — Senior Director, Technology (RCM modernization tech lead)
- **Linda Howard** — VP Enterprise Architecture, 7 years in role
- **Wei Zhang** — VP Infrastructure & Cloud
- **Daniel Reyes** — VP Information Security (CISO), 5 years in role
- **Jordan McKenzie** — VP Data and Analytics, 6 months in role (recent hire by Krishnamurthy)
- **VACANT** — VP Application Services (search in flight; previous holder retired Dec 2025)
- **Jessica Toth** — VP Digital Patient Experience, 2 years in role
- **Brian Sullivan** — Director, EPMO (program management office)

**Other named cast:**
- **David Henderson** — Director, RCM Innovation (prior auth program lead)
- **Dr. Aiden Walsh** — outgoing CIO who exited Q1 2025 (referenced in change-failure record)

### The 4 active programs (use consistently)

These are the four programs the dataset must support across all relevant families. Names are stable; reference these IDs everywhere they appear.

**meridian-ambient-2026** — Ambient Clinical Documentation Rollout
- Phase: P3 Design
- Sponsor: Dr. Jennifer Wexler (CMIO) + Dr. Marcus Reid (CPE) co-sponsor
- Program lead: Dr. Kavita Patel (Associate CMIO, AI)
- Budget: $14.2M over 18 months
- Target: 32 minutes per clinician per day saved across pilot cohort; 70%+ adoption by month 9
- Vendors in BAFO: Abridge, Suki, DAX Copilot
- Pilot cohort: 800 clinicians across primary care, IM, cardiology, orthopedics in 6 hospitals
- Started: October 2025

**meridian-prior-auth-2026** — Prior Authorization Automation
- Phase: P4 Build
- Sponsor: Patricia Okafor (VP RCM); Dr. Wexler co-sponsor for clinical accuracy
- Program lead: David Henderson (Director RCM Innovation)
- Budget: $9.8M over 24 months, currently in month 14
- Target: 60% auto-approval rate (current: 8%); 30% reduction in clinician burden; 15% reduction in downstream denials
- Vendor: Cohere Health (re-engaged after DENIALS-2024 — politically sensitive)
- Started: February 2025
- Currently struggling with two large commercial payer integrations

**meridian-ai-governance-2026** — Clinical AI Governance Uplift
- Phase: P2 Synthesis
- Sponsor: Dr. Wexler (CMIO) + Rebecca Hollings (GC) joint sponsorship
- Program lead: Dr. Anita Krishnamurthy (CDIO) directly
- Budget: $4.6M over 12 months
- Target: 100% of clinical AI use cases (inventory: 23) have documented FDA/state regulatory attestation; AI Governance Committee operating with full charter; model registry live
- Mandated by board's Q3 2025 AI risk policy — non-negotiable timeline
- Started: January 2026

**meridian-rcm-modernization-2026** — RCM Modernization
- Phase: P1 Discovery
- Sponsor: David Park (CFO)
- Program lead: Patricia Okafor (VP RCM); Marcus Chen (Senior Director Technology) as tech lead
- Budget: $22M over 36 months (largest of the four)
- Target: 18% reduction in days in AR (current: 52, target: 43); 25% reduction in denial rate; patient self-service collection rate from 12% to 35%
- Vendor selection in flight: Innovaccer, Olive (recently restructured — risk flag), Notable
- Started: March 2026
- Carrying organizational weight of being the "must succeed" program after DENIALS-2024

### The past failures (use consistently)

These three failures are referenced across multiple files. Anchor on these specifics.

**DENIALS-2024**
- AI-powered denials management and prevention
- Approved 2023, $14M budget; paused 2024 at $8M sunk
- Vendor: Cohere Health (pilot showed 80% denial-prevention on cherry-picked cohort; production showed 22%)
- Failure modes: PAT-AI-008 (Pilot-to-Production Gap); PAT-AI-005 (Lack of business commitment to operating-model change in central business office)
- Personnel impact: Previous CIO (Dr. Aiden Walsh) exited Q1 2025; VP Revenue Cycle role rotated to Patricia Okafor; Cohere relationship initially severed, re-engaged 2025 for prior-auth program

**EPIC-CONSOL-HAWAII-2024**
- Consolidate two acquired Hawaii hospitals from Cerner to Epic
- Approved 2023; one hospital migrated successfully 2024; second paused indefinitely 2025
- Failure modes: PAT-AI-010 (Unrealistic expectations); capital priority shift; clinical leadership resistance at second hospital
- Status: Cerner remnant continues; consolidation deferred to FY2027 budget cycle

**PATIENT-DIGITAL-2023**
- Patient-facing digital front door (mobile app, scheduling, bill pay, telehealth integration)
- Shipped 2023; adoption never crossed 18% of eligible patients; sunset 2025
- Failure mode: PAT-AI-005 (Lack of business commitment to operating-model change) — call center incentive structure didn't change, steered patients away from self-service
- Status: Sunset; relevant lessons cited in any future patient digital initiatives

### Provider-side / plan-side dimensional tagging

Every dataset family with cross-cutting records (systems, KPIs, vendors, executives, programs, evidence) must tag each record with one of:
- `provider` — provider operations only
- `plan` — health plan operations only
- `shared` — applies to both (the integration-relevant records)

This is structural, not cosmetic. The integration challenge between provider and plan is Meridian's defining feature; the tagging makes it visible in the data.

---

## SECTION 2 — Family-by-Family Prompts

For each family, read the Apex equivalent, then generate the Meridian version using the prompt below.

---

### Family 01 — Enterprise Profile

**Reference Apex file:** `apex-data/01_enterprise_profile/enterprise_profile.md`

**Output:** `meridian-data/01_enterprise_profile/enterprise_profile.md`

**Prompt:**

Generate the enterprise profile document for Meridian Health System using the full personality from Section 1. Match the structural sections of the Apex file but with healthcare-IDN-specific content and plan-business depth. Required sections:

1. **At-a-glance** — name, revenue, employees, hospitals, beds, geographic footprint, ownership type, fiscal year, HQ, founded
2. **Legal entity structure** — parent 501(c)(3), key subsidiaries (Meridian Health Plans LLC, Meridian Medical Foundation for the employed physician group, Meridian Properties for real estate), recent M&A activity (Hawaii hospital acquisitions 2022-2023 named with city/island)
3. **Industry classification** — NAICS codes for hospital, ambulatory care, health plan, pharmacy
4. **FY2025 financial snapshot** — revenue mix (provider operations $11.8B, plan premiums $5.0B), operating margin (compressed 80bp YoY), key trend commentary
5. **Strategic priorities (FY2026)** — the 5 priorities listed verbatim with brief rationale per
6. **Active transformation portfolio (high level)** — reference the 4 active programs by ID without detail (detail lives in family 06)
7. **Regulatory posture** — HIPAA Privacy Rule and Security Rule (45 CFR Parts 160, 162, 164), HITECH, FDA Software-as-a-Medical-Device guidance for clinical AI, Joint Commission accreditation, state-by-state licensing across 4 states, CMS Conditions of Participation, plan-side: CMS MA program oversight (42 CFR Part 422), state DOI in 4 states, HEDIS reporting, MA STAR ratings program, ACA marketplace certification
8. **Data classification policy** — Public / Internal / Confidential / Restricted with healthcare-specific examples (PHI = Restricted; provider-payer cross-entity data = Confidential with internal-share restrictions)
9. **Risk appetite statement** — conservative on patient safety and clinical AI; moderate on operational AI; aggressive on population health analytics
10. **ESG posture** — community benefit reporting, charity care commitment, environmental sustainability commitments, workforce diversity goals
11. **Recent context (current state Apr 2026)** — narrative covering recent CDIO appointment, FY2025 margin compression, board AI risk policy, denial rate spike, Hawaii integration pause, FY2026 priorities

Use realistic financial scale throughout ($16.8B feels real, not round). Reference real regulations by citation. Tone: senior-practitioner narrative, not marketing.

Length target: 180-220 lines.

---

### Family 02 — Org Structure

**Reference Apex files:**
- `apex-data/02_org_structure/executive_bench.json`
- `apex-data/02_org_structure/it_leadership.json`
- `apex-data/02_org_structure/political_map.md`
- `apex-data/02_org_structure/change_failure_record.md`

**Output:** Four files in `meridian-data/02_org_structure/`

**Prompt 02.1 — executive_bench.json:**

Generate the executive bench JSON for Meridian using the named individuals in Section 1. Schema mirrors Apex's executive_bench.json:

```json
{
  "tenant_key": "meridian-health",
  "last_updated": "2026-04-25",
  "data_classification": "Internal",
  "schema_version": "1.0",
  "executives": [ ... ]
}
```

For each executive include: id (`person:meridian:firstname-lastname`), full name, title, role_scope (`provider` | `plan` | `system`), reports_to (id of supervisor or "Board" for CEO equivalent), tenure_in_role_years, tenure_at_company_years, prior_roles (list of last 2-3 with company and role), background_summary (2-3 sentences senior-practitioner voice), stated_priorities_fy2026 (3-4 bullets), known_political_positions (1-2 sentences on coalition tendencies and disagreements with peers), direct_reports_count, escalation_authority_summary.

Include all named individuals from Section 1 (system leadership 11, plan leadership 5). Add a CEO and Board Chair. Total: ~18-20 named executives.

Apply imperfection: 1-2 entries with shortened tenure (recent hires); 1-2 with explicit coalition tensions named; the VP Application Services position marked vacant with search status.

Length target: 220-280 lines of JSON.

**Prompt 02.2 — it_leadership.json:**

Generate the IT leadership JSON. Schema mirrors Apex:

```json
{
  "tenant_key": "meridian-health",
  "last_updated": "2026-04-25",
  "data_classification": "Internal",
  "ai_governance_council": { ... },
  "it_leaders": [ ... ]
}
```

Include all named IT leaders from Section 1, plus 4-5 additional Directors as needed (Director Clinical Applications, Director Plan Systems, Director Cybersecurity Operations, Director Cloud Operations, Director Data Engineering).

Each entry: id, full name, title, reports_to, tenure_in_role_years, domain_ownership (specific list — e.g., "Epic ambulatory, Epic inpatient, MyChart" for Director Clinical Applications), prior_roles, stated_priorities_fy2026, vacancy_status (most "Filled"; one VP Application Services "Vacant — search in flight").

The AI Governance Council section: charter date (Q3 2025 board mandate), chair (CMIO Wexler), members (CDIO, GC, CCO, CMO of plan, CPE, CISO, plus rotating physician representation), meeting cadence (monthly), authority scope (every clinical AI use case), current status (charter ratified Jan 2026, 23 use cases under review, 4 attested, 19 in progress).

Apply imperfection: VP Application Services vacancy; Jordan McKenzie's recent-hire tenure (6 months); ai_governance_council showing 19 of 23 use cases not yet attested (the work-in-flight reality).

Length target: 180-220 lines of JSON.

**Prompt 02.3 — political_map.md:**

Generate the political map narrative. Markdown. Mirrors Apex political_map.md structure but Meridian-specific.

Required sections:
1. **Executive coalition map** — narrative covering: CEO + Board posture; CFO Park's cost-takeout coalition with COO; CMIO Wexler + CPE Reid clinical-AI alliance; new CDIO Krishnamurthy navigating between cost-takeout and clinical-AI camps as recent arrival; GC Hollings and CCO Mercer aligned on AI governance after board mandate
2. **Plan-vs-provider tension** — explicit narrative on the structural tension: provider growth vs plan growth capital allocation; data sharing constraints between provider and plan operations even within same legal entity (HIPAA same-entity exception applies but practical/political barriers); risk-bearing arrangements create incentive misalignment between plan medical management and provider operations; named individuals on each side (Hartwell on plan side advocating for plan expansion; Reid on provider side guarding clinical autonomy)
3. **Active program champion/blocker map** — for each of the 4 active programs: champions, neutrals, skeptics/blockers, with named individuals
4. **Recent leadership changes** — Krishnamurthy as CDIO (Oct 2025) replacing Walsh; Patricia Okafor's lateral move into VP RCM (Q1 2025); VP Application Services vacancy; recent CFO direct report changes
5. **Open executive searches** — VP Application Services, plus 1-2 senior nursing roles flagged
6. **Recent context shaping politics** — DENIALS-2024 scar tissue affecting RCM modernization; Hawaii integration pause creating capital-allocation tension; board AI risk policy creating governance discipline

Voice: senior-practitioner, frank, names actual coalitions and tensions. Imperfection: include 1-2 sentences flagging where the political picture is uncertain or under-evidenced.

Length target: 130-180 lines.

**Prompt 02.4 — change_failure_record.md:**

Generate the change-failure record covering the three named past failures (DENIALS-2024, EPIC-CONSOL-HAWAII-2024, PATIENT-DIGITAL-2023) plus 1-2 additional smaller failures for texture.

Per failure, mirror Apex's change_failure_record.md structure:
1. Program name and ID
2. Approved date and budget
3. Status and outcome (paused at $X, shipped but failed adoption, etc.)
4. Vendor(s) involved
5. Failure mode tags (PAT-AI-* references)
6. What was promised
7. What happened (the narrative — 3-5 paragraphs in senior-practitioner voice with specifics)
8. Personnel impact (who's where now)
9. Organizational scar tissue (how this shapes current programs)
10. Lessons learned (3-5 bullets, real, with bite)

The DENIALS-2024 narrative must include: Cohere Health pilot 80% vs production 22%, central business office change management never completed, previous CIO Walsh exit, current re-engagement of Cohere for prior-auth being politically sensitive.

The Hawaii narrative must include: capital priority shift, second hospital's clinical leadership resistance, current Cerner remnant.

The PATIENT-DIGITAL narrative must include: call center incentive structure not changing, adoption ceiling at 18%, sunset reasoning.

Add 1-2 minor failures: e.g., "WORKFORCE-PLAN-2022" (a workforce planning AI program that delivered the dashboard but never integrated with manager workflow; quietly retired) and/or "POPULATION-RISK-2021" (an early population risk stratification model that was technically sound but governance gap meant clinicians couldn't trust the outputs).

Length target: 220-280 lines.

---

### Family 03 — IT System Landscape

**Reference Apex files:**
- `apex-data/03_it_landscape/systems_inventory.csv`
- `apex-data/03_it_landscape/integration_map.json`
- `apex-data/03_it_landscape/shadow_it.csv`

**Output:** Three files in `meridian-data/03_it_landscape/`

**Prompt 03.1 — systems_inventory.csv:**

Generate a systems inventory CSV with the same column schema as Apex's systems_inventory.csv. Headers exactly:

`system_id,system_name,vendor,version,deployment_model,domain,owner_person_id,annual_cost_usd,renewal_date,business_criticality,technical_debt_rating,data_sensitivity,integration_count,description,scope`

Add column `scope` at the end with values `provider` | `plan` | `shared`.

Generate ~95-110 systems covering:

**Provider-side core (50-60 systems):**
- Epic suite: Epic Hyperspace (inpatient EHR), Epic Ambulatory, Epic MyChart, Epic Cogito (analytics), Epic Bridges (interfaces), Epic Beacon (oncology), Epic Stork (women's health), Epic Healthy Planet (population health), Epic Phoenix (transplant), Epic Cosmos (research data network)
- Cerner remnant in Hawaii (one hospital): Cerner Millennium PowerChart, Cerner FirstNet
- Imaging/PACS: GE Centricity PACS, McKesson Radiology Solutions
- Cardiology: Philips IntelliSpace Cardiovascular
- Lab: Sunquest Laboratory Information System
- Pharmacy: Omnicell automated dispensing, Epic Willow inpatient pharmacy
- Clinical communications: Vocera, Epic Secure Chat, PerfectServe
- ERP/Finance: Workday Financial Management, Workday HCM, Lawson legacy (sunset in flight)
- Supply chain: Workday SCM, GHX, Lawson MMS legacy
- Workforce/scheduling: API Healthcare (acquired by symplr), Smart Square
- Patient access: Phreesia, Epic Welcome
- HIE/clinical messaging: Mirth, Rhapsody, Carequality, CommonWell
- Telehealth: Epic-integrated, Doxy.me legacy in some clinics
- Patient experience: Press Ganey, Qualtrics
- Analytics platforms: Epic Caboodle/Cogito, Innovaccer, Tableau, Power BI

**Plan-side core (25-30 systems):**
- Core admin: HealthEdge HealthRules Payer (claims), DST (commercial — sunset), legacy Facets remnants
- Care management: ZeOmega Jiva, Innovaccer Care Management
- Population health: Innovaccer (shared with provider)
- Risk adjustment: Episource HCC tools, internal model platform
- HEDIS reporting: Cotiviti, Inovalon
- Prior authorization: Cohere Health (active), legacy Sapien Care
- Member portal/app: custom on Salesforce Health Cloud
- Network management: Quest Analytics (network adequacy), custom contract management
- STAR / Quality: Inovalon Star Compass
- Provider data management: Symplr provider data, internal MDM

**Shared infrastructure (15-20 systems):**
- Cloud: AWS primary, Azure for specific workloads, Snowflake data warehouse
- Identity: Okta, Active Directory, Imprivata (clinical SSO)
- Security: Microsoft Sentinel SIEM, CrowdStrike EDR, Palo Alto NGFW, Proofpoint email security, SailPoint IGA
- Productivity: Microsoft 365, ServiceNow ITSM, Workday (HR side)
- Integration: Mulesoft, Snaplogic
- Data platform: Snowflake, dbt, Atlas (internal name for the provider+claims integration)

For each row apply imperfections: 8-12 systems with `owner_person_id` blank or "person:meridian:vacant-vp-applications" (the open VP Application Services); 3-5 with renewal_date blank or "TBD"; 4-6 with technical_debt_rating "High" tied to the legacy Lawson, DST, Facets, Cerner systems; explicit `description` field flagging fragmentation issues for cross-affiliate-relevant systems.

Annual costs realistic for healthcare ($120K - $9.5M ranges; Epic costs $8-9.5M for the bundled suite; HealthEdge ~$3.2M; Cohere Health ~$1.4M on the prior-auth contract).

Length target: 100-120 rows of CSV (including header).

**Prompt 03.2 — integration_map.json:**

Generate integration_map.json mirroring Apex schema. Cover ~20-25 of the most strategically important integrations across provider, plan, and shared scope. Each integration:

```json
{
  "integration_id": "int:meridian:001",
  "source_system_id": "system:meridian:epic-hyperspace",
  "target_system_id": "system:meridian:epic-cogito",
  "scope": "provider",
  "direction": "source_to_target",
  "frequency": "near_real_time",
  "mechanism": "Epic Bridges HL7v2 + ETL",
  "data_volume_summary": "~14M ambulatory encounters/year + inpatient",
  "health_status": "Healthy",
  "owner_person_id": "person:meridian:linda-howard",
  "last_validated": "2026-03-15",
  "notes": "Foundational analytics path"
}
```

Include critical integrations:
- Epic ↔ Cogito (analytics)
- Epic ↔ Innovaccer (population health)
- Epic ↔ Atlas (custom data platform — provider clinical data flow)
- HealthEdge ↔ Atlas (claims data flow into shared data platform)
- Atlas ↔ Snowflake (data warehouse)
- Epic ↔ Cohere Health (prior auth — flagged as struggling integration with two payer endpoints)
- Cerner ↔ Epic Bridges (Hawaii hospital — fragile integration, flagged "Attention")
- HealthEdge ↔ Innovaccer (care management coordination)
- Workday Finance ↔ Epic Resolute (revenue cycle)
- Symplr WFM ↔ Epic Stork (nurse scheduling)
- Epic MyChart ↔ Salesforce Health Cloud (member portal — provider-plan crossing point, with explicit data-sharing constraints flagged)

Apply imperfection: 3-4 integrations with `health_status: "Attention"` or `"Critical"`; 2-3 with `last_validated` >120 days; 1 integration explicitly flagged as the recent denial-rate-spike contributor.

Length target: 220-300 lines of JSON.

**Prompt 03.3 — shadow_it.csv:**

Generate shadow_it.csv mirroring Apex schema. Generate 16-20 shadow IT entries for healthcare context.

Examples to include:
- ChatGPT Plus / personal accounts widely used by clinicians and admin (high risk for PHI exposure; AI Council remediation in flight)
- Claude Pro adoption in strategy and finance teams
- Personal Dropbox use (significant concern for PHI)
- Various Zapier accounts in operations
- Loom recording (some include patient-care-relevant content; DPA gap)
- Otter.ai meeting transcription (PHI risk in clinical meetings)
- Notion in product/strategy teams (de facto knowledge base outside of SharePoint)
- Various AI scribe pilots running outside the official ambient program (creates noise for the AI Governance Committee inventory)
- Personal Google Drive use
- Calendly, Grammarly, Perplexity Pro (the standard non-clinical pattern)

Per row include all Apex schema fields: tool_id, tool_name, vendor, department, users_estimated, monthly_cost_usd, procurement_path, known_to_it, risk_classification (extra weight on PHI-risk entries), data_handled, first_detected, status, notes.

Apply imperfection: explicit `notes` calling out PHI-exposure risk for high-risk entries; AI Council tracking status; the unauthorized AI scribe pilots flagged as creating governance complications.

Length target: 18-22 rows of CSV (including header).

---

### Family 04 — IT Financials

**Reference Apex files:**
- `apex-data/04_it_financials/it_spend_breakdown.csv`
- `apex-data/04_it_financials/renewal_calendar.csv`

**Output:** Two files in `meridian-data/04_it_financials/`

**Prompt 04.1 — it_spend_breakdown.csv:**

Generate IT spend breakdown CSV. Total IT budget for FY2026: $384M (~2.3% of revenue, in line with healthcare IT spend ratios for IDNs of this size). Mirror Apex CSV schema.

Categories should cover:
- Run / Change / Transform allocation (target: 65% / 22% / 13% — note healthcare runs higher than retail)
- Vendor concentration: top 25 vendors by spend (Epic ~$24M, AWS ~$11M, Microsoft ~$8M, Workday ~$6M, Innovaccer ~$5.2M, Snowflake ~$4.8M, ServiceNow ~$3.6M, Cerner ~$3.1M residual, HealthEdge ~$3.2M, Cohere Health ~$1.4M, etc.)
- Cloud spend by hyperscaler with commitment structures (AWS EDP $9.5M MACC, Azure $2.8M)
- SaaS spend top 50 tools breakdown
- Consulting/SI: Epic SI partners (Nordic, Impact Advisors), Big-4 advisory engagements, niche specialty firms
- Infrastructure refresh
- Internal headcount allocation (IT FTE ~1,400)
- Plan-side IT carve-out (~$48M of total)
- Provider-side IT (~$336M)
- Shared infrastructure cost allocation methodology

Apply imperfection: 2-3 line items flagged with notes ("estimated; chargeback methodology under review"); license waste callout ($4.2M in known unused licenses identified in 2025 audit); 1-2 cells noting "FY2025 actual; FY2026 projection pending Q3 reforecast."

Length target: 60-80 rows.

**Prompt 04.2 — renewal_calendar.csv:**

Generate renewal calendar CSV. ~40-50 contract renewals over the next 24 months. Mirror Apex schema.

Include strategic renewals:
- Epic suite renewal (every 5 years; major renewal 2027)
- AWS EDP refresh 2026
- Innovaccer renewal Aug 2026 (overlaps with population-health strategy review)
- HealthEdge renewal late 2026
- ServiceNow renewal early 2027
- Workday HCM renewal Q3 2026
- Microsoft EA renewal Q2 2027
- Snowflake commit refresh end 2026
- Cohere Health prior-auth contract: tied to program success milestones
- Provider data management vendor (Symplr) renewal mid 2026
- Quality/STARs vendors: Inovalon and Cotiviti both renew within window
- ZeOmega Jiva renewal 2027
- Multiple smaller SaaS

Per row: contract_id, vendor, system_or_service, renewal_date, current_annual_value, multi_year_value, renewal_status (`upcoming` / `in_negotiation` / `BAFO` / `recently_renewed` / `at_risk`), owner_person_id, scope (provider/plan/shared), strategic_notes.

Apply imperfection: 4-5 marked "at_risk" with rationale; 2-3 marked "in_negotiation" with current state; explicit notes flagging Innovaccer renewal as strategically loaded (CDIO's first major decision); Cohere Health renewal explicitly tied to prior-auth program performance.

Length target: 45-55 rows.

---

### Family 05 — KPI Dictionary

**Reference Apex file:** `apex-data/05_kpi_dictionary/kpi_dictionary.csv`

**Output:** `meridian-data/05_kpi_dictionary/kpi_dictionary.csv`

**Prompt:**

Generate the KPI dictionary CSV. Mirror Apex schema. Add `scope` column at end (provider/plan/shared).

Total: ~85-100 KPIs (intentionally below the ~150 expected baseline for an IDN of this size, demonstrating the gap). Of those:

**Provider clinical operations (40-50 KPIs):**
- Census, ALOS, observation rate, ED throughput, OR utilization
- Readmission rates (30-day, condition-specific)
- HCAHPS (overall, communication, responsiveness, discharge)
- Clinical quality measures (CMS Hospital Compare set)
- Mortality rates (risk-adjusted, condition-specific)
- Hospital-acquired conditions (HAC) rates
- Sepsis bundle compliance
- Surgical site infection rates
- Patient safety indicators
- Specialty productivity (RVUs per physician FTE by specialty)

**Provider revenue cycle (10-15 KPIs):**
- Days in AR, denial rate (gross and net), denial recovery rate, clean claim rate, cost-to-collect, point-of-service collection rate, bad debt as % revenue, charity care (community benefit), AR aging buckets, write-off rates

**Plan-side (20-25 KPIs):**
- Medical Loss Ratio (MLR) by line, member retention by line, member acquisition by line, network adequacy (CMS standards), prior auth approval rate, prior auth turnaround time, denial rate (payer side), HEDIS measure performance (top 15 measures), MA STAR rating components, risk score accuracy, quality bonus payment performance, member satisfaction

**Population health / value-based care (8-12 KPIs):**
- Total cost of care PMPM by population, quality measure performance for risk-bearing contracts, readmission rates for at-risk panels, ED utilization for at-risk panels, primary care attribution, gap closure rates, ACO REACH performance metrics, MA shared savings performance

**Workforce (5-8 KPIs):**
- Nursing turnover, traveler ratio, premium pay percentage, time-to-fill for clinical roles, employee engagement scores, nursing hours per patient day

**Patient experience digital (5-8 KPIs):**
- MyChart activation rate, online scheduling utilization, telehealth volume, patient self-service collection rate, app rating

For each KPI fill all columns: kpi_id, kpi_name, definition, formula, source_system_id, data_owner_person_id, business_owner_person_id, refresh_cadence, current_value, current_period, trend, target_fy2026, confidence (0-1), leading_or_lagging, tier (executive/department/operational), caveats, instrumentation_status (`measured` / `claimed_but_not_measured` / `partially_measured` / `under_revision`), scope.

Apply imperfection rigorously:
- 12-18 KPIs flagged `instrumentation_status: claimed_but_not_measured` (especially around: cross-affiliate consolidated reporting, certain plan-provider integrated metrics, value-based care total cost of care for some populations, certain workforce metrics)
- 8-10 KPIs with `confidence: 0.55-0.70` and explicit caveats about data lineage
- 4-6 KPIs flagged `under_revision` (definitions being updated post-board AI policy)
- HCAHPS includes 30% response rate and extreme-experience bias note
- ALOS includes observation-status conversion adjustment caveat
- Denial rate has gross-vs-net distinction
- Several plan-provider crossover KPIs explicitly flagged as having data-sharing constraints

Length target: 90-105 rows.

---

### Family 06 — Active Program Inventory

**Reference Apex file:** `apex-data/06_program_inventory/active_programs.json`

**Output:** `meridian-data/06_program_inventory/active_programs.json`

**Prompt:**

Generate active_programs.json with the 4 named programs from Section 1. Mirror Apex schema rigorously. Each program object includes:

- id, name, archetype, sponsor, co_sponsor, program_lead, business_owner, technology_lead, current_phase, time_in_phase_days, started_date, business_case_summary, target_metrics (array with metric_name, baseline, target, target_date), budget_approved, budget_consumed, milestones (array with name, planned_date, status), vendors_involved (array), systems_touched (array of system_ids from family 03), kpis_targeted (array of kpi_ids from family 05), risks (array with id, description, severity, owner), recent_decisions (3-4 recent), stakeholder_map (sponsors/champions/skeptics), scope (provider/plan/shared), failure_mode_flags_active (array of PAT-* references), prior_program_lineage (which past failure or program this descends from)

Specific content per program:

**meridian-ambient-2026:**
- Stakeholder map should include Wexler (champion), Reid (champion), CFO Park (cautious — cost takeout pressure), CHRO Liu (neutral), several nursing leaders (skeptic — prior pilot at peer system colors expectations)
- Risks: clinician acceptance, Epic integration depth, attribution method (PAT-AI-008 risk)
- Decision: vendor downselection from longlist of 6 to BAFO of 3 in February 2026
- Linkage to PATIENT-DIGITAL-2023 lessons (operating-model change is prerequisite)

**meridian-prior-auth-2026:**
- Stakeholder map: Okafor (sponsor + champion), Wexler (clinical sponsor — requires accuracy), David Henderson (lead), Cohere relationship explicitly flagged as politically loaded
- Risks: payer integration walls (currently struggling with two large commercial), DENIALS-2024 scar tissue, change management with central business office (the same CBO that derailed DENIALS-2024)
- Recent decisions: integration with Anthem flagged as red, Aetna integration on track, Cigna integration scoping in flight
- Linkage to DENIALS-2024 explicit

**meridian-ai-governance-2026:**
- Stakeholder map: Wexler + Hollings joint sponsors, Krishnamurthy lead, AI Governance Committee chartered Jan 2026, Mercer (CCO) heavily involved, plan-side Venkatesan participating because plan also has clinical AI use cases
- Risks: 23 use cases inventory may grow as shadow AI scribe pilots get surfaced; FDA regulatory landscape shifting (mid-2026 expected guidance updates); state-level AI healthcare regulations vary across 4 states
- Recent decisions: charter ratification, model registry tool selection (in flight), risk classification methodology approved
- Mandated deliverable to board

**meridian-rcm-modernization-2026:**
- Stakeholder map: Park (sponsor), Okafor (lead, also leading prior-auth — cross-program SME load flag for Atlas), Marcus Chen (tech lead), board attention explicit
- Risks: vendor selection (Olive financial restructuring is a known risk), DENIALS-2024 organizational scar tissue, change management with central business office (again), data lineage uncertainty for current denial-rate measurement
- Recent decisions: scoping definition complete, vendor longlist finalized, RFP being drafted
- Linkage to DENIALS-2024 explicit

Length target: 380-450 lines of JSON.

---

### Family 07 — Sourcing Artifacts

**Reference Apex files:** All four files in `apex-data/07_sourcing_artifacts/`

**Output:** Four files in `meridian-data/07_sourcing_artifacts/`

**Prompt 07.1 — ambient_rfp_issued.md:**

Generate the RFP for the ambient documentation program (issued February 2026). Mirror Apex's cdp_rfp_issued.md structure: executive summary, current-state context, scope, requirements (functional, technical, integration, security/HIPAA, performance), evaluation criteria with weightings, vendor instructions, timeline, Q&A process, evaluation committee.

Healthcare-specific requirements: Epic integration depth (read/write to clinical notes, problem list, orders), HIPAA compliance attestation, BAA terms, FDA SaMD posture, accuracy benchmarks (clinical documentation accuracy targets), real-time vs batch latency, clinician workflow integration, multi-specialty support, training infrastructure, change management support.

Vendors invited: Abridge, Suki, DAX Copilot (Microsoft + Nuance), plus 3 longlist vendors.

Length target: 200-250 lines.

**Prompt 07.2 — ambient_vendor_evaluation.csv:**

Generate the vendor evaluation matrix for the ambient program. Mirror Apex CSV. Columns: criterion, weight, abridge_score, suki_score, daxcopilot_score, vendor_4_score, scoring_notes. Three vendors in BAFO (Abridge, Suki, DAX), one knocked out at evaluation stage.

Apply realism: scores should NOT all favor one vendor; legitimate tradeoffs ("Abridge stronger on accuracy benchmarks; DAX stronger on Epic integration depth"); 2-3 criteria where evaluator notes uncertainty.

Length target: 18-25 rows.

**Prompt 07.3 — rcm_bafo_tracker.md:**

Generate the BAFO tracker for the RCM modernization program (currently in P1, vendor selection in flight — so this is *pre-BAFO* longlist evaluation tracker, not BAFO yet — adjust accordingly to reflect current phase). Mirror Apex's ams_bafo_tracker.md but earlier in the lifecycle.

Vendors evaluated: Innovaccer, Olive (financial restructuring risk noted), Notable, plus 2 longlist that won't make BAFO. Track: capability fit, integration with Epic, HIPAA posture, change management track record, financial stability (Olive callout), reference customer feedback.

Length target: 100-140 lines.

**Prompt 07.4 — template_registry.csv:**

Generate the sourcing template registry. Mirror Apex schema. Healthcare-specific templates: Clinical AI vendor RFP, EHR-adjacent SaaS RFP, Population health platform RFP, Care management vendor RFP, Plan core-admin RFP, Medical device AI evaluation, BAA template addendum for AI vendors, model risk vendor questionnaire, FDA SaMD compliance vendor checklist.

Length target: 18-25 rows.

---

### Family 08 — Program Deliverables

**Reference Apex files:** All four files in `apex-data/08_program_deliverables/`

**Output:** Four files in `meridian-data/08_program_deliverables/`

**Prompt 08.1 — ambient_signed_charter.md:**

Generate the signed charter for ambient program (P2 close artifact, signed January 2026 before P3 entry). Mirror Apex's cdp_signed_charter.md structure: executive summary, problem statement, value hypothesis, scope and boundaries, success criteria with structured promise contract (target metric, baseline, target value, target date, attribution method, kill criterion, decomposition, stakeholders), pattern catalog references, evidence references, dissent log, sign-off block.

Sign-off block: Wexler (CMIO sponsor), Reid (CPE co-sponsor), Krishnamurthy (CDIO), Park (CFO — provisional approval with cost-takeout caveat), Hollings (GC), with dates.

Dissent log: include 2-3 explicit dissents recorded — e.g., one nursing leader on workflow integration, one specialty chief on accuracy concerns, one finance partner on attribution method.

Length target: 180-220 lines.

**Prompt 08.2 — prior_auth_p3_design_spec.md:**

Generate the P3 detailed design spec for prior-auth program (since program is in P4 Build, the P3 deliverable would be the design spec that was signed off before P4 entry). Mirror Apex equivalent depth.

Sections: detailed integration architecture (Epic ↔ Cohere ↔ payer endpoints), payer-by-payer integration plan, fallback to manual workflow design, accuracy threshold definitions, change management plan with central business office, training plan, pilot cohort definition (top 3 specialties first), success criteria, kill criterion (accuracy below 92% or workflow disruption above threshold).

Length target: 200-250 lines.

**Prompt 08.3 — ai_governance_p1_discovery_package.md:**

Generate the P1 Discovery package for AI governance program (current phase P2, so P1 close artifact). Mirror Apex CC AI P1 package structure.

Sections: stakeholder map, current-state assessment (existing AI use case inventory of 23 grew from initial 14 as shadow scribes surfaced), regulatory landscape (FDA, state-by-state, Joint Commission), peer benchmark scan, gap analysis, baseline metrics (current attestation completeness — 4 of 23), recommendations for P2 synthesis.

Length target: 200-240 lines.

**Prompt 08.4 — rcm_p0_origination.md:**

Generate the P0 Origination document for RCM modernization (current phase P1 Discovery, so P0 close artifact). Mirror Apex forecast P0 structure.

Sections: program seed (the trigger), business case (with explicit DENIALS-2024 reference and "how this is different"), value hypothesis (cohort × behavior change × mechanism × direction), classification, sponsor confirmation (Park 1:1 notes referenced), Discovery envelope ($22M total, $4.5M for Discovery), evidence family selected, anti-pattern self-assessment.

Length target: 160-200 lines.

---

### Family 09 — Evidence Ledger

**Reference Apex file:** `apex-data/09_evidence_ledger/evidence_ledger.json`

**Output:** `meridian-data/09_evidence_ledger/evidence_ledger.json`

**Prompt:**

Generate the evidence ledger JSON. Mirror Apex schema rigorously. Generate 30-40 evidence items spanning the 4 active programs and the past failures.

For each item: id, claim, source_type (`tenant_data_room` | `public_filing` | `industry_research` | `expert_interview` | `regulatory_doc` | `peer_anonymized`), source_doc, source_section, data_classification (Public/Internal/Confidential/Restricted), confidence (0-1), last_updated, owner_person_id, supports_claims_in (array referencing programs/charters/KPIs/decisions), caveats.

Critical evidence items to include:
- Identity (claim) for ambient: clinician documentation time baseline (45 min/day) sourced from Epic Hyperspace audit log analysis
- Prior-auth current 8% auto-approval rate
- DENIALS-2024 final spend ($8M sunk on $14M approved)
- Q4 FY2025 denial rate spike (specific bps move) cited from Q4 financial close
- HCAHPS Q1 FY2026 trend
- MA STAR rating performance current (e.g., 4.0 stars overall, with breakdown)
- Peer benchmark for ambient documentation savings (cited from KLAS or similar)
- FDA guidance updates expected mid-2026 (from regulatory tracking)
- Innovaccer renewal posture (vendor scorecard reference)
- Cohere Health pilot vs production data (the 80% vs 22% from DENIALS-2024)
- Hawaii Cerner remnant integration cost estimate
- Central business office change-management readiness assessment (a flagged-low-confidence item with explicit caveat)

Apply imperfection: 4-6 items confidence 0.55-0.75 with explicit caveats; 2-3 items flagged stale (last_updated > 120 days for some areas); some Restricted items where claim describes the data but specific values are not in the ledger entry (the item points to but doesn't expose Restricted data).

Length target: 350-450 lines.

---

### Family 10 — Operating Telemetry

**Reference Apex files:** Both files in `apex-data/10_operating_telemetry/`

**Output:** Two files in `meridian-data/10_operating_telemetry/`

**Prompt 10.1 — recent_meeting_notes.md:**

Generate ~5-7 recent meeting notes. Mirror Apex format. Cover:

1. **AI Governance Committee — April 2026 monthly** — Wexler chair, governance program review, model registry tool decision, 3 new AI use cases under review including 1 plan-side, debate on a clinician-led shadow AI scribe pilot
2. **Prior-Auth program status review — April 2026** — Okafor, Henderson, Cohere account team, Anthem integration red status discussion, escalation path
3. **Ambient program BAFO debrief — March 2026** — Wexler, Patel, Reid, vendor team representatives, scoring discussion, Suki vs Abridge tradeoff in detail, finance partner concerns on attribution
4. **RCM modernization sponsor 1:1 — Park ↔ Okafor — April 2026** — Discovery progress, vendor longlist review, Olive financial restructuring discussion, central business office change management concerns
5. **Executive Committee — April 2026** — quarterly review, margin update, Hawaii integration deferral discussion, AI investment slate
6. **Plan ↔ Provider data sharing working group — April 2026** — recurring effort to enable population health analytics across the legal-but-politically-constrained boundary, Hartwell + Reid, GC representation, current state of escalating cases
7. **Optional: Board AI policy 6-month review — March 2026** — board governance committee, formal review of AI risk policy implementation, governance program status

Each meeting note: date, attendees with roles, agenda, decisions, dissents (where present), action items with owners and dates, parking lot.

Voice: senior-practitioner internal-meeting register. Realism: include disagreements explicitly. Some action items should reference earlier meetings' parking lot.

Length target: 250-320 lines.

**Prompt 10.2 — risk_action_decision_log.json:**

Generate risk_action_decision_log.json. Mirror Apex schema. ~30-40 entries split across:

- **risks** (~12-15): cross-program SME overcommitment (Okafor on two programs), payer integration walls on prior-auth, vendor financial stability for Olive, FDA regulatory shifts mid-2026, central business office change management capacity, Hawaii Cerner remnant fragility, MA STAR rating quality measure performance, denial rate trajectory, etc. Each with id, description, severity, owner, status, mitigation, programs_affected
- **actions** (~12-15): with owners, due dates, status (`open` / `in_progress` / `complete` / `overdue`); some explicitly overdue
- **decisions** (~10-12): recent decisions with date, decision, rationale, decided_by, dissent (where present); include decisions cross-referenced from the meeting notes (08-1)

Length target: 280-340 lines of JSON.

---

### Family 11 — Vendor and Contract Data

**Reference Apex files:** Both files in `apex-data/11_vendor_contracts/`

**Output:** Two files in `meridian-data/11_vendor_contracts/`

**Prompt 11.1 — vendor_scorecards.csv:**

Generate vendor scorecards CSV for top 35-40 vendors. Mirror Apex schema. Cover all major vendors named in family 03 systems_inventory and family 04 financials. Apply healthcare-specific scoring criteria.

Per row: vendor_id, vendor_name, scope (provider/plan/shared), category, annual_spend_bucket, performance_score (0-100), risk_score (0-100), financial_health_rating (AAA-D), strategic_alignment_rating (1-5), recent_issues_summary, escalation_path, owner_person_id.

Apply realism: Olive flagged with low financial health rating and explicit recent_issues note (restructuring); Cohere Health with mixed scoring (strong technically post-pilot improvements, scar tissue from DENIALS-2024); Cerner residual flagged with negative strategic alignment; Innovaccer high alignment given current renewal strategic value.

Length target: 38-45 rows.

**Prompt 11.2 — contract_clause_inventory.json:**

Generate contract clause inventory JSON for top 12-15 strategic vendors. Mirror Apex schema. Per vendor, structured clause inventory: MFN, escalators, exit terms, SLAs (clinical-uptime SLAs are stricter for clinical systems), audit rights, IP terms, BAA terms (healthcare-specific), data residency, AI/ML usage rights (newer clauses for vendors using customer data to train).

Cover: Epic, AWS, Microsoft, Workday, Innovaccer, HealthEdge, Cohere Health, Snowflake, ServiceNow, ZeOmega, Inovalon, Cotiviti, Symplr.

Length target: 320-400 lines of JSON.

---

### Family 12 — Compliance

**Reference Apex files:** Both files in `apex-data/12_compliance/`

**Output:** Two files in `meridian-data/12_compliance/`

**Prompt 12.1 — compliance_posture.md:**

Generate compliance posture markdown. Mirror Apex structure but with healthcare frameworks.

Required sections per framework:
1. **HIPAA (Privacy Rule, Security Rule)** — current posture, last comprehensive review, control framework mapping, BAA inventory status, recent breach risk assessments, emerging concerns (AI-specific PHI handling)
2. **HITECH** — meaningful use legacy, MIPS performance
3. **FDA Software-as-a-Medical-Device (SaMD)** — current posture, classified devices in use, AI/ML guidance compliance, pending 2026 guidance preparation
4. **CMS Conditions of Participation** — current posture, recent CMS surveys, certification status
5. **Joint Commission** — accreditation status, recent surveys, action items
6. **State licensing (4 states)** — California Department of Health Care Services, Nevada, Oregon, Hawaii — each with current status and ongoing items
7. **CMS MA program oversight (42 CFR Part 422)** — STAR rating performance, audit history, recent CMS feedback
8. **State DOI (4 states)** — plan-side
9. **HEDIS / NCQA** — measure performance, certification
10. **State AI healthcare regulations** — California (most active), recent and pending requirements
11. **CCPA/CPRA** — patient/member data subject rights handling
12. **PCI-DSS** — patient payment processing, plan premium collection

Per framework: status (Compliant / Partial / Gap), owner, last reviewed, key gaps, remediation in flight.

Apply imperfection: 2-3 frameworks flagged "review overdue"; 4-6 specific control gaps named with severity and remediation status; AI-specific compliance still maturing (the AI governance program is the primary remediation).

Length target: 220-280 lines.

**Prompt 12.2 — audit_findings.json:**

Generate audit findings JSON. Mirror Apex schema. ~12-18 findings spanning the frameworks above.

Include: HIPAA security rule audit findings (a few specific control gaps); CMS MA recent audit (some quality measure documentation gaps); Joint Commission survey findings (a few standard issues); state licensing items; AI-specific findings just starting to surface.

Per finding: id, framework, finding_summary, severity (Low/Medium/High/Critical), identified_date, identified_by, owner_person_id, remediation_plan, remediation_due_date, current_status, evidence_required.

Apply imperfection: 2-3 findings overdue on remediation; 1-2 with low confidence on remediation owner.

Length target: 220-280 lines of JSON.

---

### Family 13 — Industry Context

**Reference Apex file:** `apex-data/13_industry_context/industry_signals_and_benchmarks.json`

**Output:** `meridian-data/13_industry_context/industry_signals_and_benchmarks.json`

**Prompt:**

Generate industry signals and benchmarks JSON. Mirror Apex schema. Healthcare-specific signals and IDN-specific peer benchmarks.

**Signals (~22-28):**
- Recent FDA AI/ML guidance updates (real, citable)
- CMS MA quality bonus payment program changes
- ACA marketplace dynamics 2026
- Epic + AI partnership announcements (real or realistic)
- Major peer health system AI announcements (Sutter, Kaiser, Mass General Brigham, Cleveland Clinic, etc.)
- Vendor M&A in healthcare AI space (real recent activity — Olive's restructuring as one signal)
- State AI healthcare regulation movements (California, New York, others)
- ONC interoperability rule updates
- Information blocking enforcement uptick
- Recent peer breach disclosures
- Nursing labor market shifts
- MA membership trends and acquisition dynamics
- Provider-sponsored health plan landscape moves
- Population health and value-based care contract trends

**Benchmarks:**
- Healthcare IT spend as % of revenue benchmark (~2.3% for IDNs of this size)
- AI maturity benchmark for IDNs (peer comparison)
- Clinical documentation time benchmarks (per specialty)
- Denial rate benchmarks
- MA STAR rating distribution benchmarks
- HCAHPS percentile benchmarks
- Days in AR benchmarks
- Operating margin benchmarks (the 80bp compression vs peers)

Per signal: id, type, source, summary, date, affected_programs (array), severity, time_horizon, citations.

Apply imperfection: a few signals confidence-flagged or noted as "developing"; benchmark sources cited (KLAS, Definitive Healthcare, Moody's, AHA, etc.).

Length target: 220-280 lines of JSON.

---

### Family 14 — Cross-Program Signals

**Reference Apex file:** `apex-data/14_cross_program_signals/cross_program_signals.json`

**Output:** `meridian-data/14_cross_program_signals/cross_program_signals.json`

**Prompt:**

Generate cross-program signals JSON. Mirror Apex schema. Auto-derived signals across the 4 Meridian programs and the broader portfolio.

Required signals (~16-22):

- **Shared SME overcommitment**: Patricia Okafor lead on both prior-auth (P4) and RCM modernization (P1); severity High; recommendation
- **Shared SME overcommitment**: Wexler involved in 3 of 4 active programs; severity Medium
- **Shared system dependency**: Epic touched by all 4 programs; renewal in 2027 affects all
- **Shared system dependency**: Cohere Health is the prior-auth vendor and was the DENIALS-2024 vendor; relationship status affects RCM modernization vendor decision
- **Shared vendor**: Innovaccer touches population health, RCM modernization candidate, plan operations; renewal Aug 2026 affects multiple programs
- **Cross-program dependency**: AI Governance program must be operational before ambient program enters P4 Build (compliance prerequisite)
- **Cross-program dependency**: RCM modernization depends on central business office change management capacity; same CBO is the constraint that derailed DENIALS-2024 and the same CBO is mid-flight on prior-auth change management
- **Cross-program contradiction**: Cost-takeout pressure (CFO) vs clinical AI investment thesis (CMIO) plays out across all 4 programs
- **Cross-program contradiction**: Plan-side data needs for population health vs provider-side data sharing constraints; affects RCM and AI governance
- **Cross-program contradiction**: Hawaii integration deferred but strategic priority list still includes it; affects capital allocation conversations
- **Pattern-grounded risk**: Prior-auth in P4 with Anthem integration red — PAT-AI-008 (Pilot-to-Production Gap) signal
- **Pattern-grounded risk**: Ambient program approaching P4 entry with attribution method weakly defined — PAT-AI-009 (Inability to Measure) signal
- **External signal effect**: Olive restructuring affects RCM modernization vendor selection
- **External signal effect**: Mid-2026 expected FDA guidance affects AI governance program scope
- **Time-bound pressure**: Innovaccer renewal Aug 2026 forces multi-program coordination
- **Time-bound pressure**: Q3 2026 board AI policy 6-month review forces governance program milestone
- **Control signal**: 19 of 23 AI use cases not yet attested per board policy; AI governance program timeline tight
- **Resource allocation conflict**: Capital priorities in Hawaii vs RCM vs ambient

Per signal: id, type (per Apex schema), title, programs (array), severity, raised_by_agent (Atlas), raised_date, status, description (3-5 sentences), recommendation.

Length target: 280-360 lines of JSON.

---

## SECTION 3 — Cross-Family Consistency Check

After all 14 families are generated, run these consistency validation prompts:

**Consistency check 1 — Named individuals.**
List all `person:meridian:*` IDs referenced across all files. Verify every reference resolves to an entry in `02_org_structure/executive_bench.json` or `02_org_structure/it_leadership.json`. Flag any orphan references.

**Consistency check 2 — Programs.**
List all `meridian-*-2026` program references across all files. Verify they match the 4 programs in `06_program_inventory/active_programs.json` (no extras, no missing).

**Consistency check 3 — Systems.**
List all `system:meridian:*` references. Verify every reference resolves to an entry in `03_it_landscape/systems_inventory.csv`.

**Consistency check 4 — Past failures.**
Verify DENIALS-2024, EPIC-CONSOL-HAWAII-2024, PATIENT-DIGITAL-2023 are referenced consistently with the same details (sunk cost, dates, personnel impact) across `02_org_structure/change_failure_record.md`, `06_program_inventory/active_programs.json`, `09_evidence_ledger/evidence_ledger.json`, and meeting notes.

**Consistency check 5 — Financial scale.**
Verify $16.8B revenue, $384M IT budget, individual program budgets ($14.2M ambient, $9.8M prior-auth, $4.6M AI governance, $22M RCM) are consistent everywhere they appear.

**Consistency check 6 — Provider/plan tagging.**
Every record across systems, KPIs, vendors, programs, executives that has a `scope` field is tagged provider/plan/shared appropriately.

---

## SECTION 4 — Quality Gate (senior-practitioner test)

Before declaring the Meridian dataset complete, evaluate against these criteria. Codex flags any failures for human review.

**Healthcare credibility:**
- [ ] EHR systems named specifically (Epic Hyperspace, not "EHR System")
- [ ] Real regulations cited correctly (45 CFR 164.502 not "HIPAA section X")
- [ ] Healthcare-specific KPIs use industry-standard definitions (HCAHPS, ALOS, MA STARs)
- [ ] FDA SaMD framing accurate
- [ ] Joint Commission references accurate

**IDN structural credibility:**
- [ ] Provider-payer dynamics surfaced realistically (not perfect harmony, not dysfunctional theater)
- [ ] Hawaii integration story consistent across files
- [ ] Cross-affiliate fragmentation visible in system landscape
- [ ] Plan business actually has plan-side systems, KPIs, vendors, leadership — not provider operations with a plan logo

**5 realism techniques applied:**
- [ ] Imperfection: ~12% missing/stale fields visible across families
- [ ] Contradictions: at least 4 explicit cross-program or cross-functional contradictions
- [ ] History: DENIALS-2024 + EPIC-CONSOL-HAWAII-2024 + PATIENT-DIGITAL-2023 + their consequences visible
- [ ] Specificity: KPI definitions have caveats, units, biases
- [ ] Asymmetric depth: rich population health, sparse RCM and workforce management

**Cross-family consistency:**
- [ ] Named individuals consistent across all files
- [ ] Programs and their details consistent
- [ ] Past failures consistent
- [ ] Financials consistent

**Senior healthcare practitioner test:**
- [ ] Would a CIO at a real $15B IDN read this and recognize their world?
- [ ] Would a healthcare regulatory attorney recognize the compliance posture as accurate?
- [ ] Would a former MA plan executive recognize the plan operations as plausible?

---

## Output structure

Final deliverable structure:

```
meridian-data/
├── README.md
├── 01_enterprise_profile/
│   └── enterprise_profile.md
├── 02_org_structure/
│   ├── executive_bench.json
│   ├── it_leadership.json
│   ├── political_map.md
│   └── change_failure_record.md
├── 03_it_landscape/
│   ├── systems_inventory.csv
│   ├── integration_map.json
│   └── shadow_it.csv
├── 04_it_financials/
│   ├── it_spend_breakdown.csv
│   └── renewal_calendar.csv
├── 05_kpi_dictionary/
│   └── kpi_dictionary.csv
├── 06_program_inventory/
│   └── active_programs.json
├── 07_sourcing_artifacts/
│   ├── ambient_rfp_issued.md
│   ├── ambient_vendor_evaluation.csv
│   ├── rcm_bafo_tracker.md
│   └── template_registry.csv
├── 08_program_deliverables/
│   ├── ambient_signed_charter.md
│   ├── prior_auth_p3_design_spec.md
│   ├── ai_governance_p1_discovery_package.md
│   └── rcm_p0_origination.md
├── 09_evidence_ledger/
│   └── evidence_ledger.json
├── 10_operating_telemetry/
│   ├── recent_meeting_notes.md
│   └── risk_action_decision_log.json
├── 11_vendor_contracts/
│   ├── vendor_scorecards.csv
│   └── contract_clause_inventory.json
├── 12_compliance/
│   ├── compliance_posture.md
│   └── audit_findings.json
├── 13_industry_context/
│   └── industry_signals_and_benchmarks.json
└── 14_cross_program_signals/
    └── cross_program_signals.json
```

Plus a top-level README.md covering Meridian's personality and the dataset's structure (mirror `apex-data/README.md`).

---

**End of Codex Prompt Set — Meridian Health.**

When generation is complete, run Section 3 (consistency checks) and Section 4 (quality gate). Flag any items failing senior-practitioner test for human review before declaring the Meridian tenant production-ready.
