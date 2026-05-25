# Packet 19 — Meridian Health Synthetic Substrate Pack v1

**Status:** Draft 2026-05-25. To hand to Codex once approved.
**Modeled on:** `docs/build/codex-handoff-pilot-prep/05-APEX-SUBSTRATE-AUGMENTATION.md` and the v1 scaffold at `datasets/apex-retail-synthetic-v1/`.
**Why this packet exists:** the 2026-05-25 Meridian full-module stress test
(`audit-artifacts/full-module-stress-meridian-2026-05-25-0747/`) showed every
structured Sentinel turn confessing "0 P18 app records visible", "org_topology
unavailable", "ai_tool_footprint pending", "$0 visible run-cost basis". The
classifier and reasoning loop are not broken — the **substrate is empty for
Meridian**. Apex has a 13-folder, 120-app, 14-team, 45-vendor data pack;
Meridian has nothing comparable. This packet authors that pack to the same
depth and shape, healthcare-vertical-grounded.

---

## Tenant identity (must hold across every row)

| Field | Value |
|---|---|
| Tenant key | `meridian` |
| Display name | Meridian Health System |
| Legal | 501(c)(3) Integrated Delivery Network |
| HQ | Sacramento, CA |
| Founded | 1968 |
| Annual net patient revenue | $4.8B FY25 |
| Sites | 7 acute-care hospitals, 41 ambulatory clinics, 3 surgery centers |
| Beds | 1,420 staffed (1,640 licensed) |
| Employees | 18,400 (3,200 employed physicians) |
| Members at risk (value-based) | 285,000 lives (Medicare ACO + commercial) |
| Annual IT operating budget | $215M (~4.5% of net patient revenue) |
| CDIO | Dr. Anita Krishnamurthy (joined Oct 2025) |
| CMIO | Dr. Marcus Patel |
| CFO | Janelle Okonkwo |
| CISO | Sven Larsson |
| EHR | Epic (Foundation 2024.R1, hosted on-prem in Sacramento DC) |
| ERP | Workday Financials + SCM (cloud, live 2023) |
| Revenue cycle | Epic Resolute + Optum 360 contracted services |
| Claims/clearinghouse | Change Healthcare (post-2024-incident contingency in place) |
| Imaging | Sectra PACS + Visage 7 enterprise viewer |
| Pop health | Epic Healthy Planet + Innovaccer overlay |
| Cardiology | GE MUSE + Epic Cupid |
| Labs | Beaker (Epic-native) + Sunquest legacy in two sites |
| Genomics | Tempus + 23andMe research contract (limited cohort) |
| Pharmacy | Willow Inpatient + Outpatient |
| Patient access | MyChart + Luma Health digital front door |

**Forbidden facts** (must never appear): SAP ECC, AS-400, Punchh, Wipro AMS,
Apex Retail, "480 stores", "96K employees", "SAP S/4HANA". These belong to
Apex Retail and must not bleed.

---

## Folder structure (mirrors `datasets/apex-retail-synthetic-v1/`)

```
datasets/meridian-health-synthetic-v1/
├── 01-portfolio/
│   ├── application-portfolio.csv           # 140 application rows
│   ├── integration-topology.json           # 380 directed edges
│   ├── initiatives-active.csv              # 28 active initiatives
│   └── initiatives-closed.csv              # 14 closed initiatives
├── 02-financial/
│   ├── run-cost-by-application.csv         # 140 rows, FY25 actual + FY26 budget
│   ├── renewal-calendar.csv                # 45 vendor renewals next 18 months
│   ├── initiative-commitments.csv          # 28 active × 4 quarters
│   ├── capex-opex-summary.csv              # 6 categories × 3 years
│   ├── workbook-summary.json
│   └── workbooks/                          # 2 xlsx (annual budget, renewal pipeline)
├── 03-org/
│   ├── teams.csv                           # 16 IT teams
│   ├── roles.csv                           # ~1,650 role inventory
│   ├── leadership-bench.csv                # 38 director+ roles
│   └── spans-of-control.csv
├── 04-vendors/
│   ├── vendor-contracts.csv                # 50 application/SaaS contracts
│   ├── infrastructure-contracts.csv        # 14 infra/managed-service contracts
│   ├── vendor-scorecards.csv
│   └── contract-pdfs/                      # 32 synthetic PDFs
├── 05-dora/
│   └── dora-baseline.csv                   # 6 weeks × 14 teams = 84 obs
├── 06-devex/
│   └── devex-survey-fy25.csv               # 4 quarters × 12 cohorts
├── 07-ai-tools/
│   ├── ai-tool-footprint.csv               # 18 tools (Copilot, Glean, Notion AI,
│   │                                       #  Abridge, Nuance DAX Copilot, Suki,
│   │                                       #  Augmedix, Hippocratic, Epic Cosmos,
│   │                                       #  Epic Art, Innovaccer copilots, etc.)
│   └── ai-usage-telemetry.csv              # 6 months utilization
├── 08-sponsor-signal/
│   └── sponsor-pulse.jsonl                 # 35 sponsor-pulse observations
├── 09-charters/
│   └── charter-pdfs/                       # 12 Wave-0 initiative charters
├── 10-incidents-changes/
│   ├── incidents.csv                       # 90-day incident sample
│   └── changes.csv                         # 90-day change sample
├── 11-regulatory/
│   ├── hipaa-controls.csv                  # 54 controls × maturity
│   ├── hitrust-mapping.csv
│   ├── cms-interoperability-checklist.csv  # CMS-9115-F & CMS-0057
│   ├── joint-commission-it-touchpoints.csv
│   └── information-blocking-attestations.csv
├── 12-benchmarks/
│   ├── kaufman-hall-it-spend-quartiles.csv
│   ├── klas-arch-research-medians.csv
│   └── chime-most-wired-attestation.csv
├── 13-context/
│   ├── enterprise-context-source-files.csv # 48 Discovery Kit source rows
│   └── client-data-corpus.jsonl            # 320 retrieval chunks
├── 99-verification/
│   ├── expected-sentinel-answers.json      # 14-question expected target
│   └── expected-row-counts.json
├── CHANGELOG.md
├── README.md
└── manifest.yaml
```

---

## Application portfolio composition (`01-portfolio/application-portfolio.csv`)

140 rows. Same CSV header as Apex's `application-portfolio.csv`. Vertical
distribution targets:

| Domain | Count | Examples |
|---|---|---|
| Clinical core | 22 | Epic Hyperspace, Hyperdrive, Bedrock, Cosmos, MyChart, Beaker, Willow, Cupid, Stork, ASAP, OpTime, Anesthesia, Radiant, Cogito |
| Imaging & diagnostics | 12 | Sectra PACS, Visage 7, GE MUSE, Philips IntelliSpace, Cassling DR, Tempus, Roche cobas IT |
| Revenue cycle & access | 14 | Resolute PB/HB, Optum 360, Waystar (denials), Phreesia, Luma, Experian Health, Change Healthcare clearinghouse |
| Population & value-based | 8 | Healthy Planet, Innovaccer, Arcadia (legacy), Stellar Health, Signify, NaviHealth integration |
| ERP / corporate | 18 | Workday Financials, HCM, SCM; ServiceNow ITSM/HRSD; Concur; DocuSign; Coupa (post-2024 pilot); Microsoft 365 E5; Power BI |
| HR/clinician workforce | 10 | Workday HCM, Kronos UKG (legacy migration in flight), QGenda physician scheduling, Symplr credentialing, HealthStream LMS |
| Patient experience & engagement | 8 | MyChart, Luma Health, Twilio Notify, Press Ganey, Get Well Network, RelateCare |
| Research & clinical trials | 6 | OnCore CTMS, REDCap, EPIC Research, Cohort builder, IRB Manager |
| Infrastructure / platform | 18 | Citrix Cloud, VMware vSphere, Pure Storage, Cisco UCS, Azure (Foundation+AI Search), Confluent, Kafka MSK, Cribl, Splunk, CrowdStrike, Zscaler, Okta |
| Legacy / sunset candidates | 14 | Sunquest LIS (2 sites), Allscripts Sunrise (post-merger holdover at Mercy site), McKesson Paragon (decommission-in-progress), Lawson HCM (replaced by Workday FY24 — residuals), homegrown Access DB inventory |
| Specialty / niche | 10 | Sectra Education, MModal Fluency Direct, Nuance Powerscribe radiology, Visicu eICU, Spok smartphone alerts |

**Required columns** (match Apex CSV header order):
`app_id, name, vendor, category, business_owner, it_owner, deployment, lifecycle_stage, criticality, run_cost_fy25_usd, primary_dataclass, integration_count, last_modernization_review, ai_eligibility_score, notes`

Lifecycle distribution: ~40 invest, ~62 maintain, ~24 contain, ~14 retire.
Criticality: ~26 critical, ~58 high, ~42 medium, ~14 low.
AI eligibility score: stratified 0.1–0.9; clinical-documentation,
revenue-integrity, and pop-health categories skew higher.
Run cost: total must roll up to $172M of the $215M IT operating budget
(remainder is people + non-app infra). Distribute log-normal-ish: 8 apps
above $5M (Epic on-prem stack, Workday, Microsoft 365, Sectra, Citrix,
Innovaccer, Splunk, CrowdStrike), long tail under $200K.

---

## Integration topology (`integration-topology.json`)

380 directed edges. Required shapes:

- Epic Hyperspace as a hub with 90+ outbound edges (orders → Beaker, charges
  → Resolute, results → MyChart, ADT → 14 downstream, HL7 v2 + FHIR R4 mix)
- Workday Financials → 32 downstream cost/AP integrations
- ServiceNow → 26 ITSM/HRSD touchpoints
- Sectra PACS → Visage 7, GE MUSE, Tempus, Roche cobas
- 12 legacy point-to-point integrations flagged `risk: high` (Sunquest, Lawson
  residuals, McKesson Paragon, Allscripts Sunrise)
- 18 edges across HIE / state immunization registry / CalREDIE / California
  Department of Public Health
- 4 payer connections (Anthem, Blue Shield CA, Aetna, Centene CalAIM)

Each edge: `edge_id, source_app, target_app, protocol (HL7v2|FHIR|REST|SFTP|MLLP|JDBC|SOAP|Kafka), direction, message_type, dataclass, latency_p95_ms, error_rate_30d, owner_team, notes`.

---

## Initiatives (`initiatives-active.csv`)

28 active initiatives. Required headline initiatives (these MUST be present
because the Sentinel verification set in `99-verification/` references them):

| ID | Name | Posture | Stage | Sponsor |
|---|---|---|---|---|
| MR-01 | Ambient clinical documentation (DAX Copilot + Abridge pilot expansion) | Aligned | Scale | CMIO |
| MR-02 | Epic Cosmos + Healthy Planet AI for high-risk panel surfacing | Healthy | Pilot | CMO |
| MR-03 | Revenue integrity AI (charge capture + denials prediction) | Watch | Pilot | CFO |
| MR-04 | ED throughput optimization (Visicu eICU + queue-prediction) | Aligned | Plan | COO |
| MR-05 | Patient digital front door rewrite (MyChart + Luma) | Healthy | Scale | CDIO |
| MR-06 | M365 Copilot Enterprise rollout (non-clinical) | Aligned | Pilot | CDIO |
| MR-07 | Sunquest LIS decommission (Beaker consolidation) | Watch | Run | CIO ops |
| MR-08 | Workforce AI scheduling (QGenda + nurse predictive staffing) | Healthy | Pilot | CHRO |
| MR-09 | Pop health value-based AI (Innovaccer + ACO MSSP) | Watch | Scale | VP VBC |
| MR-10 | Imaging AI triage (chest x-ray + stroke CTA, vendor TBD) | Plan | Plan | Chief Radiologist |
| MR-11 | HIPAA-grade GenAI workload platform selection | Plan | Plan | CISO |
| MR-12 | CMS Interoperability + Prior Auth (CMS-0057) compliance | Aligned | Build | CDIO |
| MR-13 | Legacy AP decommission (Lawson HCM residuals) | Watch | Run | CFO |
| MR-14 | Patient communications consolidation (Notify + RelateCare) | Plan | Plan | Chief Experience |

Plus 14 more "second-tier" initiatives (research, supply chain, security,
data governance, etc.) — sufficient breadth that intent classifier sees real
variety.

Closed initiatives (`initiatives-closed.csv`) — 14 rows, mix of healthy
landings and 3 explicit failures (e.g. Arcadia legacy pop-health sunset,
Lawson migration overrun, IBM Watson Health clinical-decision-support pilot
killed 2023).

---

## Vendor & contracts (`04-vendors/`)

50 application/SaaS contracts. Healthcare-vertical-grounded vendor mix:
Epic, Workday, Microsoft, Innovaccer, Nuance/Microsoft, Abridge, Suki,
Augmedix, Sectra, Visage, GE Healthcare, Philips, Tempus, Optum, Change
Healthcare, Symplr, QGenda, HealthStream, Press Ganey, Luma, Twilio,
ServiceNow, Splunk, CrowdStrike, Zscaler, Okta, AWS (limited), Azure
(primary), Confluent, Cribl, Pure Storage, Cisco, VMware, Citrix.

14 infrastructure/managed-service contracts (KPMG advisory, Deloitte EHR
optimization, Cognizant infra ops, Pythian database managed services,
Tegria revenue cycle ops, Caradigm population health analytics).

32 synthetic contract PDFs across the highest-value renewals.

**Renewal pressure curve:** 11 renewals in next 6 months (this is the
"renewal stress" pattern Sentinel should surface when asked about budget
risk).

---

## Org topology (`03-org/`)

16 IT teams totaling ~1,650 roles. Vertical-appropriate functions:

- Epic Application teams (Clinical, Revenue Cycle, Ancillaries, ED/OR) — 4 teams, ~340 FTE
- Integration & Interoperability — 1 team, ~85 FTE
- Infrastructure & Platform — 1 team, ~210 FTE (data center ops + cloud)
- Security & Identity — 1 team, ~95 FTE
- Data, Analytics & AI Enablement — 1 team, ~140 FTE
- Digital Front Door / Consumer — 1 team, ~75 FTE
- Population Health Analytics — 1 team, ~60 FTE
- Research Informatics — 1 team, ~40 FTE
- Corporate IT (Workday, ServiceNow, M365) — 1 team, ~115 FTE
- Workforce/HR Tech — 1 team, ~45 FTE
- Imaging Informatics — 1 team, ~55 FTE
- PMO + Governance — 1 team, ~70 FTE
- Service Desk & Field Support — 1 team, ~220 FTE
- Innovation / Emerging Tech (AI center of excellence) — 1 team, ~30 FTE

Leadership bench: 38 director+ roles with name, hire date, span, prior
employer (use anonymized stand-ins).

---

## AI tool footprint (`07-ai-tools/`)

18 tools across clinical and corporate:

| Tool | Vendor | Use case | Status | Users |
|---|---|---|---|---|
| DAX Copilot | Nuance/Microsoft | Ambient documentation | Scale | 1,400 clinicians |
| Abridge | Abridge | Ambient (specialty pilot) | Pilot | 180 clinicians |
| Suki | Suki AI | Ambient (limited) | Pilot | 90 clinicians |
| Epic Art | Epic | In-basket draft replies | Scale | 2,100 clinicians |
| Epic Cosmos | Epic | Cohort / research insights | Pilot | 220 users |
| Innovaccer Copilot | Innovaccer | Care manager workflows | Pilot | 340 care mgrs |
| Microsoft 365 Copilot E5 | Microsoft | Non-clinical productivity | Scale | 4,200 licenses |
| GitHub Copilot Business | Microsoft | Developer productivity | Scale | 420 devs |
| Glean | Glean | Enterprise search (pilot) | Pilot | 600 users |
| Notion AI | Notion | Documentation | Pilot | 180 users |
| Hippocratic AI | Hippocratic | Patient outreach (paused) | Paused | 0 active |
| Augmedix | Augmedix | Ambient (legacy contract) | Wind-down | 40 clinicians |
| ChatGPT Enterprise | OpenAI | Researcher allowance | Pilot | 80 users |
| Azure OpenAI (gpt-4o) | Microsoft | Internal RAG | Build | platform |
| Visage 7 AI overlays | Visage | Imaging AI viewer | Scale | 95 radiologists |
| Aidoc (stroke triage) | Aidoc | Imaging AI | Pilot | 12 radiologists |
| Rad AI | Rad AI | Report impressions | Pilot | 8 radiologists |
| Stryker Mako planning | Stryker | OR planning | Scale | OR team |

Usage telemetry: 6 months of weekly active users + minutes saved + clinician
satisfaction.

---

## Sentinel verification set (`99-verification/expected-sentinel-answers.json`)

14 questions with grounded expected facets. Must include the 5 questions the
2026-05-25 stress test ran (so future runs can grade against ground truth):

1. As CDIO, what AI investments should we prioritize for the next two quarters?
2. How do we de-risk a GenAI workload platform decision under HIPAA?
3. Walk me through our application portfolio.
4. Which initiatives should we kill this quarter?
5. What blocks killing the legacy LIS at the Mercy and Sutter sites?
6. What's the FY26 renewal pressure and which renewals are most exposed?
7. Where is ambient documentation working vs. where is it stuck?
8. How does our revenue-integrity AI bet pencil out against CFO finance pressure?
9. What's our population-health AI maturity vs. peers?
10. Where are we exposed on CMS-0057 prior-auth compliance?
11. Map our integration topology — where is the legacy debt concentrated?
12. What's our AI cost-to-serve and where is it growing fastest?
13. What sibling moves should I bundle with the Sunquest decommission?
14. CDIO 30-60-90 plan synthesis given current substrate.

For each question: `intent`, `must_cite_apps[]`, `must_cite_initiatives[]`,
`forbidden_terms[]` (always includes Apex/SAP/AS-400), `expected_dissent[]`,
`expected_one_click_action`.

---

## Retrieval substrate (`13-context/`)

- `enterprise-context-source-files.csv` — 48 rows. Mix: CIO 30-60-90 memo,
  CMIO ambient-doc playbook, CFO renewal calendar workbook, board-pack
  excerpts, Joint Commission survey readiness, HIMSS Most Wired attestation,
  CalAIM contract.
- `client-data-corpus.jsonl` — 320 retrieval chunks (~600 tokens each).
  Stratify: 90 clinical, 70 revenue, 50 IT strategy, 40 population health,
  30 regulatory, 20 vendor/contract, 20 board/finance.
  Each chunk: `id, source_file_id, tenant_id (must be meridian), title,
  text, dataclass, last_updated, depth_score (8–10)`.

The depth_score >= 8 filter is what `searchCorpus` uses; chunks below 8 do
not surface. The Apex pack had ~280 chunks pre-loaded — Meridian must match
or exceed.

---

## Ingestion & verification

The pack lands in two phases:

**Phase A — static scaffold (parallels PR #2342 for Apex):**
- Author all files under `datasets/meridian-health-synthetic-v1/`
- Add `scripts/verify/meridian-data-pack-scaffold.mjs` (deterministic: row
  counts, JSON parse, manifest checksum, forbidden-term scan)
- Release record `docs/releases/2026-05-25-p19-meridian-data-pack-scaffold.md`
- Verification: `npm run verify:meridian-data-pack`

**Phase B — ingestion into Supabase (parallels later Apex PRs):**
- Loader script `scripts/seed/meridian-substrate.ts` writes 140 apps, 380
  edges, 28 active initiatives, 14 closed, 16 teams, ~1,650 roles, 50
  vendor contracts, 18 AI tools, 320 corpus chunks
- Tenant rows scoped to `clients.tenant_key = 'meridian'`
- All rows tagged `dataclass = 'internal'` or `'confidential'` per HIPAA
- Embeddings: enqueue 320 chunks through the existing corpus embed worker
  (do NOT inline a new provider call — use the AI Egress Control Plane)

**Cross-tenant guard:** the scaffold verifier MUST grep every authored file
for the forbidden terms list and fail the build if any match.

---

## Acceptance criteria

A successful Packet 19 ships when:

1. All 13 folders and 99-verification populated; row counts match manifest.
2. `npm run verify:meridian-data-pack` passes deterministically.
3. Re-running the full-module stress test against Meridian shows:
   - 0 occurrences of "0 P18 app records visible" or "org_topology unavailable"
   - Sentinel structured turns cite at least 5 distinct Meridian apps and 3
     distinct Meridian initiatives across the 14 verification questions
   - Cross-tenant guard: 0 leakage of Apex/SAP/AS-400 terms
4. Intent classifier verification: Q3/Q4/Q5 (post-Fix-#1) do NOT classify as
   `it_productivity` AND the canned-template-repeat detector reports 0
   fingerprint collisions.
5. Run-cost rollup in audit report shows non-zero $ when Sentinel cites
   `run_cost_fy25_usd` from the loaded portfolio.

---

## Out of scope for this packet

- New product surfaces (Watchlist weights, executive-brief page, etc.) —
  those are tracked in Fix #3.
- Live ingestion harness in CI — Phase B ships ingestion code; running it in
  CI on every PR is a later concern.
- Tenant-RLS pen-test rerun — covered by separate task #17.
