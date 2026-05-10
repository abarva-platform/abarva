#!/usr/bin/env python3
"""
Generate function-level capacity, FY2026 capital plan, and funding authority
matrix for all three composite tenants. Output goes to the existing segment
dirs so the generic loader (load-meridian-setup-data.ts and friends) picks
them up automatically — no shim, no dummy wiring.

Files emitted per tenant:
  02_org_structure/function_capacity.csv
  04_it_financials/fy2026_capital_plan.csv
  04_it_financials/funding_authority_matrix.csv

Founder directives (2026-05-10):
  - "Data analytics organization is not consistent with their size — they
    should have a much larger onshore team, budget should be $30-40M for
    a $16.8B IDN" -> codified into Meridian function_capacity.
  - "Insights into FY26 budget for IT and overall enterprise capital
    spending; insights into approval path for funding (CIO funded vs
    business capital vs OPEX) — if not it would be theoretical."
  - "Same for every function within IT and business" -> per-function
    headcount + budget + onshore/offshore/contractor + system count.
  - "Industry standard" sizing benchmarks anchor every row.

Industry sizing benchmarks applied:
  Healthcare IDN ($16.8B revenue, 58k EE):
    Total IT FTE        ~2,400    (4.1% of EE; per existing fixtures)
    IT operating budget ~$384M    (2.3% of revenue)
    Capital plan        $1.1B     (per existing fixtures)
  Retail ($108B revenue, ~250k EE):
    Total IT FTE        ~4,500    (1.8% of EE)
    IT operating budget ~$1.62B   (1.5% of revenue)
    Capital plan        ~$3.5B
  Bank ($18.2B revenue, $362B assets, 46k EE):
    Total IT FTE        ~2,400    (per existing fixtures)
    IT operating budget ~$1.67B   (9.2% of revenue per existing fixtures)
    Capital plan        ~$700M

Run:
    python3 scripts/generate-tenant-functional-data.py
"""
from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


# -----------------------------------------------------------------------------
# Schemas
# -----------------------------------------------------------------------------

FUNCTION_CAPACITY_HEADER = [
    "function_id",
    "function_name",
    "domain",
    "leadership_owner_person_id",
    "leadership_owner_name",
    "headcount_total_fte",
    "headcount_onshore_fte",
    "headcount_offshore_fte",
    "headcount_contractor_fte",
    "fy2026_budget_usd",
    "fy2026_capex_share_usd",
    "fy2026_opex_share_usd",
    "systems_owned_count",
    "key_systems_summary",
    "industry_benchmark_summary",
    "notes",
]

CAPITAL_PLAN_HEADER = [
    "line_id",
    "category",
    "subcategory",
    "owner_person_id",
    "owner_name",
    "fy2026_planned_capex_usd",
    "fy2026_planned_opex_usd",
    "fy2025_actual_capex_usd",
    "funding_source",
    "approval_authority",
    "approval_status",
    "linked_program_id",
    "notes",
]

FUNDING_AUTHORITY_HEADER = [
    "authority_id",
    "spend_band_label",
    "single_decision_threshold_usd_min",
    "single_decision_threshold_usd_max",
    "approver_role",
    "approver_person_id",
    "approver_name",
    "funding_source_typical",
    "documentation_required",
    "review_cycle",
    "notes",
]


# -----------------------------------------------------------------------------
# MERIDIAN (healthcare IDN)
# -----------------------------------------------------------------------------
# Reconciles to: 58k EE, $16.8B revenue, $1.1B capital plan, ~2,400 IT FTE,
# ~$384M IT operating budget, ~$30-40M data analytics function specifically.

# Function rows: (id_slug, name, domain, owner_pid, owner_name,
#  hc_total, hc_onshore, hc_offshore, hc_contractor,
#  fy2026_budget, capex_share, opex_share, systems_owned,
#  key_systems_summary, benchmark, notes)
MERIDIAN_FUNCTIONS: list[tuple] = [
    # ---- IT functions (sum to ~2,400 IT FTE, $384M operating budget) ----
    ("data-analytics", "Data & Analytics", "IT — Data",
     "person:meridian:jordan-mckenzie", "Jordan McKenzie",
     185, 152, 18, 15,
     38500000, 5500000, 33000000,
     14,
     "Snowflake EDW, Epic Cogito, Epic Cosmos, Atlas custom platform, dbt, Tableau, Power BI, Databricks (under eval), Arcadia population health, Fivetran, Collibra, MLOps tooling under AI Governance",
     "Healthcare IDN benchmark: $30-40M for a $16-20B integrated provider+plan org with active VBC analytics. Onshore-heavy mix is typical (clinical data sensitivity).",
     "Founder directive 2026-05-10: data analytics function was thin (5 named) — sized to industry standard for a $16.8B IDN with both provider and plan analytics needs."),

    ("infrastructure-cloud", "Infrastructure & Cloud", "IT — Infrastructure",
     "person:meridian:wei-zhang", "Wei Zhang",
     420, 285, 95, 40,
     78400000, 14000000, 64400000,
     22,
     "AWS primary cloud, Azure secondary, on-prem VMware, network (Cisco), storage stack, NVIDIA on-prem GPU for research, data center colocation",
     "Healthcare IDN typically runs 0.6-0.8% of EE in core infra/cloud (348-464 for 58k EE). Cloud spend compounding 12-15% YoY.",
     "Includes core data center, cloud platform, network, storage. SD-WAN rollout in flight."),

    ("application-services", "Application Services", "IT — Applications",
     "person:meridian:vacant-vp-applications", "VACANT — VP Application Services",
     680, 412, 218, 50,
     92500000, 18500000, 74000000,
     54,
     "Epic Hyperspace + Ambulatory + Cogito, Cerner residual at Kona Coast, Workday, SAP, ServiceNow, claims platforms, plan core admin (HealthEdge), provider data (symplr), specialty clinical apps, Paige AI eval",
     "VP Application Services VACANT (existing fixture) — interim coverage by directors; key gap.",
     "Largest IT function by headcount; mix of application development + sustainment + vendor mgmt."),

    ("information-security", "Information Security", "IT — Cyber",
     "person:meridian:daniel-reyes", "Daniel Reyes (CISO)",
     185, 142, 28, 15,
     38800000, 6500000, 32300000,
     18,
     "Okta IAM, CyberArk PAM, CrowdStrike EDR, Palo Alto FW + Prisma, Splunk SIEM, Proofpoint email, Zscaler ZIA, Mandiant retainer",
     "Healthcare IDN typically 5-8% of IT FTE in cybersecurity (120-192 for 2,400 IT FTE). Spend benchmark $30-50M.",
     "Includes IAM, SOC, threat intel, security architecture, third-party risk, BAA enforcement."),

    ("enterprise-architecture", "Enterprise Architecture", "IT — Architecture",
     "person:meridian:linda-howard", "Linda Howard",
     45, 38, 5, 2,
     8200000, 1200000, 7000000,
     0,
     "Architecture review board; clinical, plan, and corporate architecture practices",
     "Small but high-leverage function; healthcare IDN typically 35-60 EA practitioners.",
     "Owns target-state architecture decisions for AI integration, Cerner residual retirement, plan-provider data integration."),

    ("digital-patient-experience", "Digital & Patient Experience", "IT — Digital",
     "person:meridian:jessica-toth", "Jessica Toth",
     145, 122, 18, 5,
     22500000, 4800000, 17700000,
     8,
     "MyChart customization, telehealth platform, mobile patient app, scheduling self-service, care navigation product",
     "Healthcare IDN benchmark: $20-28M for digital patient experience at this scale. Onshore-heavy.",
     "Includes patient portal, telehealth platform engineering, mobile/web product engineering."),

    ("epmo-program-mgmt", "Enterprise PMO & AI Program Office", "IT — Governance",
     "person:meridian:brian-sullivan", "Brian Sullivan",
     38, 32, 4, 2,
     5200000, 0, 5200000,
     2,
     "Smartsheet, ServiceNow Strategic Portfolio, AI program tracking",
     "Healthcare IDN PMO typically 25-50 FTE at this scale.",
     "Coordinates 4 active strategic programs (RCM modernization, ambient documentation, prior auth, AI governance)."),

    ("clinical-informatics", "Clinical Informatics", "IT — Clinical",
     "person:meridian:jennifer-wexler", "Dr. Jennifer Wexler (CMIO)",
     85, 76, 4, 5,
     16800000, 2200000, 14600000,
     6,
     "Epic clinical decision support, ambient documentation tooling (under eval), AI Governance Council operations",
     "CMIO org typically 60-100 FTE at $16-20B IDN scale.",
     "Bridges IT and clinical; chairs AI Governance Council with 23 use cases under review."),

    ("identity-access", "Identity & Access Management", "IT — Cyber",
     "person:meridian:anuradha-kapoor", "Anuradha Kapoor",
     32, 28, 3, 1,
     4800000, 1200000, 3600000,
     4,
     "Okta, CyberArk, Active Directory, clinician identity workflow",
     "IAM team typically 25-40 FTE at this org size.",
     "Reports to CISO Reyes. AI tool access governance is growing scope."),

    ("ai-platform-mlops", "AI Platform & MLOps", "IT — AI",
     "person:meridian:saint-john-williams", "Dr. Saint-John Williams",
     22, 19, 2, 1,
     6800000, 1800000, 5000000,
     5,
     "Databricks (under eval), DataRobot, model registry, AI Governance Council Operations, on-prem NVIDIA stack",
     "Emerging function; healthcare IDN typically 15-30 FTE. Ramp tied to AI Governance Council 23 use cases.",
     "Brand new function; reports to CMIO Wexler under AI Governance Council operating model."),

    # ---- Business / Clinical / Plan functions ----
    ("revenue-cycle-management", "Revenue Cycle Management", "Business — Provider",
     "person:meridian:patricia-okafor", "Patricia Okafor",
     1820, 1485, 195, 140,
     142500000, 8500000, 134000000,
     8,
     "Epic Resolute, denials platform, Ensemble managed services, charge capture, patient access tools",
     "Healthcare IDN RCM typically 1,500-2,200 FTE at $16-20B scale. RCM modernization in flight (Q4 FY2025 denial spike).",
     "Sponsor of the active RCM modernization Strategic Move; high political weight."),

    ("hospital-operations-california", "California Hospital Operations", "Business — Provider",
     "person:meridian:maria-castillo-reyes", "Dr. Maria Castillo-Reyes",
     22500, 22500, 0, 1850,
     None, None, None,
     0,
     "Embedded clinical operations across 23 California hospitals + Sacramento flagship",
     "Largest single workforce concentration. ~50% of total Meridian EE.",
     "Operating expense flows through hospital P&Ls, not IT budget."),

    ("hospital-operations-hawaii", "Hawaii Hospital Operations", "Business — Provider",
     "person:meridian:kenneth-akamu", "Kenneth Akamu",
     2150, 2150, 0, 320,
     None, None, None,
     0,
     "Pacific Queens (Epic) + Kona Coast (Cerner residual)",
     "Hawaii integration funding deferred to FY2027.",
     "Carries the Hawaii integration narrative."),

    ("medical-group-operations", "Medical Group Operations", "Business — Provider",
     "person:meridian:elena-castellanos", "Dr. Elena Castellanos",
     8400, 8400, 0, 280,
     None, None, None,
     0,
     "7,400 employed physicians + APPs + practice operations across 280 clinics",
     "Embedded ambient documentation rollout (Strategic Move in flight).",
     "Sponsor partner on ambient documentation Move."),

    ("nursing-operations", "Nursing Operations", "Business — Provider",
     "person:meridian:robert-chen", "Dr. Robert Chen (CNO)",
     14800, 14800, 0, 1820,
     None, None, None,
     0,
     "RN workforce across 30 hospitals + ambulatory + plan member care management",
     "Nursing turnover target 14% (from 22%). Traveler ratio reduction in progress.",
     "Largest workforce category after physicians."),

    ("plan-operations-mhp", "Plan Operations (Meridian Health Plan)", "Business — Plan",
     "person:meridian:thomas-hartwell", "Thomas Hartwell",
     2850, 2520, 175, 155,
     185000000, 12000000, 173000000,
     22,
     "HealthEdge plan core, claims platform, Cohere Health prior auth, member service ops, MA / commercial / Medicaid product ops",
     "Health plan ops typically 0.45-0.55 FTE per 1,000 members for a 1.6M-member plan.",
     "MLR target 84.5% (from 87.2%). Hartwell is composite executive (replaced Linda Chen-Winters)."),

    ("plan-pharmacy-pbm", "Plan Pharmacy & PBM", "Business — Plan",
     "person:meridian:aliana-rao", "Dr. Aliana Rao",
     85, 78, 5, 2,
     12500000, 800000, 11700000,
     4,
     "PBM oversight, formulary management, specialty pharmacy spend trend management",
     "Plan pharmacy typically 60-110 FTE at this membership scale.",
     "Specialty drug trend 8% — material plan-economics driver."),

    ("population-health", "Population Health & Care Management", "Business — Shared",
     "person:meridian:priya-sharma", "Dr. Priya Sharma",
     720, 690, 25, 5,
     45000000, 1800000, 43200000,
     6,
     "Arcadia population health, care management workflow, post-discharge engagement, social determinants screening",
     "Population health team typically 600-900 FTE at this membership scale.",
     "Plan-provider integration anchor function."),

    ("quality-safety", "Quality & Patient Safety", "Business — Provider",
     "person:meridian:james-okonjo", "Dr. James Okonjo (CQO)",
     185, 178, 5, 2,
     18500000, 1200000, 17300000,
     5,
     "Premier QualityAdvisor, Vizient analytics, HEDIS quality measurement, patient-safety event reporting",
     "Quality function typically 150-250 FTE at this org size.",
     "HEDIS measurement quality is plan-side anchor."),

    ("research-meridian-institute", "Meridian Research Institute", "Business — Research",
     "person:meridian:ralph-eichenberger", "Dr. Ralph Eichenberger",
     420, 380, 22, 18,
     185000000, 22000000, 163000000,
     12,
     "Palantir Foundry, Hadoop research lake, on-prem NVIDIA GPU stack, Epic Cosmos, REDCap",
     "Research baseline: $180M external grant funding; AHC IDN benchmark.",
     "Research AI is local-first (Palantir + Hadoop + on-prem GPU); cloud GenAI under eval, not deployed."),

    ("finance-treasury", "Finance, Treasury & FP&A", "Business — Corporate",
     "person:meridian:david-park", "David Park (CFO)",
     480, 425, 35, 20,
     58500000, 3500000, 55000000,
     8,
     "Workday Adaptive Planning, SAP S/4 HANA, Hyperion, treasury workstation, internal audit tools",
     "Finance org typically 0.8-1.0% of EE at $16-20B IDN (464-580 for 58k EE).",
     "Includes Park CFO, SVP Henderson Treasurer, FP&A, Audit, Tax, Capital Planning."),

    ("procurement-supply-chain", "Procurement & Supply Chain", "Business — Corporate",
     "person:meridian:angela-brooks", "Angela Brooks (CPO)",
     420, 380, 30, 10,
     38000000, 1800000, 36200000,
     6,
     "Coupa, GHX exchange, supply chain master, contract lifecycle (DocuSign + Conga)",
     "Healthcare procurement org typically 350-500 FTE for a 30-hospital system.",
     "Med/surg supply costs + specialty drug logistics + GPO leverage."),

    ("hr-people", "HR / People & Culture", "Business — Corporate",
     "person:meridian:margaret-liu", "Margaret Liu (CHRO)",
     520, 488, 22, 10,
     54000000, 2400000, 51600000,
     5,
     "Workday HCM, payroll, recruiting, talent management, Glint engagement",
     "HR typically 0.85-1.1% of EE at $16-20B IDN (493-638 for 58k EE).",
     "Nursing workforce strategy + physician retention focus."),

    ("legal-compliance", "Legal, Compliance & Privacy", "Business — Corporate",
     "person:meridian:rebecca-hollings", "Rebecca Hollings (GC)",
     185, 170, 12, 3,
     34000000, 1200000, 32800000,
     4,
     "Litigation tools, contract lifecycle, HIPAA breach response, regulatory compliance platform",
     "Legal+Compliance typically 0.30-0.40% of EE at this scale (174-232 for 58k EE).",
     "Includes Plan Reg & Compliance Legal (Stern), Provider Reg Legal (Adekunle), Privacy/HIPAA (Olafsson)."),

    ("strategy-corp-dev", "Strategy & Corporate Development", "Business — Corporate",
     "person:meridian:monica-aponte", "Monica Aponte (CSO)",
     45, 42, 2, 1,
     12500000, 1500000, 11000000,
     0,
     "Strategy + M&A pipeline + competitive intelligence",
     "Healthcare IDN strategy team typically 30-60 FTE at $16-20B.",
     "Sponsors AI strategy alignment with portfolio."),

    ("communications-public-affairs", "Communications & Public Affairs", "Business — Corporate",
     "person:meridian:penelope-whitfield-aboagye", "Penelope Whitfield-Aboagye (CCO)",
     38, 35, 2, 1,
     8500000, 0, 8500000,
     0,
     "Communications platforms, media monitoring, government affairs CRM",
     "IDN communications typically 30-50 FTE at this scale.",
     "Manages DENIALS-2024 narrative + AI risk policy public posture."),
]


# Capital plan rows: (id_slug, category, subcategory, owner_pid, owner_name,
#  fy2026_capex, fy2026_opex, fy2025_actual_capex,
#  funding_source, approval_authority, approval_status, linked_program, notes)
MERIDIAN_CAPITAL_PLAN: list[tuple] = [
    # Total target: $1.1B FY2026 capital plan + ~$2.8B operating budget
    # IT capital share: ~10-12% of enterprise capex ($110-130M)

    # ---- IT capex within enterprise capital plan ----
    ("ent-cap-fy26-it-cybersecurity", "Capital — IT", "Cybersecurity Modernization",
     "person:meridian:daniel-reyes", "Daniel Reyes (CISO)",
     22000000, 0, 18500000,
     "CIO_change_capital", "EVP CIO + CFO joint", "approved",
     "program:meridian:cybersecurity-fy2026", "Compounded post-2024 ransomware sector trends; FFIEC-equivalent posture for plan side."),

    ("ent-cap-fy26-it-epic-optimization", "Capital — IT", "Epic Optimization",
     "person:meridian:linda-howard", "Linda Howard (EA)",
     38000000, 0, 32000000,
     "CIO_change_capital", "EVP CIO + CFO joint", "approved",
     "program:meridian:epic-optimization-fy2026", "Continued Epic standardization; Hawaii integration funding deferred (Pacific Queens completed FY2024)."),

    ("ent-cap-fy26-it-rcm-modernization", "Capital — IT", "RCM Modernization",
     "person:meridian:patricia-okafor", "Patricia Okafor",
     18500000, 6800000, 12200000,
     "Business_capital_RCM", "EVP CFO + EVP CDIO joint", "approved",
     "program:meridian:rcm-modernization", "Co-funded by RCM business unit (capital) + IT (opex). Active strategic program."),

    ("ent-cap-fy26-it-ambient-doc", "Capital — IT", "Ambient Documentation Rollout",
     "person:meridian:jennifer-wexler", "Dr. Jennifer Wexler (CMIO)",
     8500000, 4200000, 5800000,
     "CIO_transform_capital", "EVP CIO + CMO joint + AI Gov Council", "approved",
     "program:meridian:ambient-documentation", "Scribe pilot to enterprise rollout; gated through AI Governance Council."),

    ("ent-cap-fy26-it-prior-auth", "Capital — IT", "Prior Auth Automation (Cohere)",
     "person:meridian:patricia-okafor", "Patricia Okafor",
     6500000, 3200000, 4800000,
     "Business_capital_Plan", "Plan President + CFO joint", "approved",
     "program:meridian:prior-auth-cohere", "Plan-side capital; provider-side operational benefit."),

    ("ent-cap-fy26-it-ai-governance", "Capital — IT", "AI Governance Council Operations",
     "person:meridian:jennifer-wexler", "Dr. Jennifer Wexler (CMIO)",
     2200000, 4800000, 1800000,
     "CIO_transform_capital", "EVP CDIO + Board Risk Committee", "approved",
     "program:meridian:ai-governance-council", "23 use cases under review; FY2026 first full operating cycle."),

    ("ent-cap-fy26-it-data-platform", "Capital — IT", "Data Platform Modernization",
     "person:meridian:jordan-mckenzie", "Jordan McKenzie",
     11500000, 8500000, 8200000,
     "CIO_change_capital", "EVP CDIO + CFO joint", "approved",
     None, "Snowflake expansion + Databricks evaluation + Atlas v4 platform; founder directive to size to $30-40M data analytics."),

    ("ent-cap-fy26-it-cloud-migration", "Capital — IT", "Cloud Migration Workstream",
     "person:meridian:wei-zhang", "Wei Zhang",
     14500000, 6200000, 11800000,
     "CIO_run_capital", "EVP CDIO", "approved",
     None, "AWS-primary architecture; on-prem retirement on schedule."),

    # ---- Enterprise capex (non-IT) ----
    ("ent-cap-fy26-facilities-sacramento", "Capital — Facilities", "Sacramento Flagship Modernization",
     "person:meridian:robert-iverson", "Robert Iverson (VP Capital)",
     185000000, 0, 142000000,
     "Corporate_capital", "Board Finance Committee", "approved",
     None, "Continued multi-year flagship modernization."),

    ("ent-cap-fy26-facilities-bay-area", "Capital — Facilities", "Bay Area Network Investments",
     "person:meridian:robert-iverson", "Robert Iverson",
     124000000, 0, 98000000,
     "Corporate_capital", "Board Finance Committee", "approved",
     None, "Ambulatory expansion + service-line growth."),

    ("ent-cap-fy26-medical-equipment", "Capital — Medical Equipment", "Imaging + Surgical Equipment",
     "person:meridian:edward-kawano", "Dr. Edward Kawano",
     112000000, 0, 98000000,
     "Service_line_capital", "EVP CPE + CFO joint", "approved",
     None, "Imaging modernization + robotic surgery expansion."),

    ("ent-cap-fy26-research-institute", "Capital — Research", "Meridian Institute Expansion",
     "person:meridian:ralph-eichenberger", "Dr. Ralph Eichenberger",
     38000000, 0, 32000000,
     "Research_capital_grant_matched", "Board Research Committee", "approved",
     None, "Grant-matched research capital; on-prem GPU stack expansion."),

    ("ent-cap-fy26-hawaii-integration", "Capital — Facilities", "Hawaii Integration (DEFERRED)",
     "person:meridian:kenneth-akamu", "Kenneth Akamu",
     0, 0, 22000000,
     "Corporate_capital", "Board Finance Committee", "deferred_to_fy2027",
     None, "Funding deferred to FY2027 per existing fixtures (capital allocation pressure)."),

    ("ent-cap-fy26-real-estate", "Capital — Real Estate", "Ambulatory Network Expansion",
     "person:meridian:robert-iverson", "Robert Iverson",
     58000000, 0, 48000000,
     "Corporate_capital", "Board Finance Committee", "approved",
     None, "Ambulatory clinic footprint expansion."),

    # ---- Enterprise opex envelopes (informational, not capex) ----
    ("ent-opex-fy26-clinical-operations", "Operating — Clinical", "Clinical Operations (consolidated)",
     "person:meridian:sarah-obrien", "Sarah O'Brien (COO)",
     0, 1820000000, 1720000000,
     "Operating_budget", "EVP COO + CEO + CFO", "approved",
     None, "Includes nursing labor, allied health, ED, surgical, ambulatory."),

    ("ent-opex-fy26-medical-group", "Operating — Medical Group", "Physician Compensation",
     "person:meridian:elena-castellanos", "Dr. Elena Castellanos",
     0, 980000000, 920000000,
     "Operating_budget", "EVP CPE + CFO", "approved",
     None, "Physician comp model redesign deferred to FY2027 implementation."),

    ("ent-opex-fy26-plan-mlr", "Operating — Plan", "Plan Medical Costs",
     "person:meridian:thomas-hartwell", "Thomas Hartwell",
     0, 5200000000, 4980000000,
     "Plan_premium_budget", "Plan President + Plan CFO", "approved",
     None, "MLR pressure: target 84.5% from 87.2%. Largest single line in Meridian P&L."),

    ("ent-opex-fy26-it-operations", "Operating — IT", "Total IT Operating Budget",
     "person:meridian:anita-krishnamurthy", "Dr. Anita Krishnamurthy (CDIO)",
     0, 384000000, 365000000,
     "CIO_run_budget", "EVP CDIO + CFO", "approved",
     None, "Industry-standard 2.3% of revenue for healthcare IDN."),
]


# Funding authority rows: (id_slug, spend_band_label,
#  threshold_min, threshold_max, approver_role, approver_pid, approver_name,
#  funding_source_typical, documentation_required, review_cycle, notes)
MERIDIAN_FUNDING_AUTHORITY: list[tuple] = [
    ("auth-l1-director", "Director-level operating spend",
     0, 100000,
     "Director", None, "(any director within function)",
     "CIO_run_budget OR Business_opex",
     "Standard purchase requisition; no business case required",
     "Single-shot approval",
     "Aggregates rolled up monthly to VP."),

    ("auth-l2-vp-single", "VP-level single-decision",
     100000, 500000,
     "VP", None, "(VP of owning function)",
     "CIO_run_budget OR CIO_change_budget OR Business_opex",
     "Vendor scorecard, 1-page business case, owner+finance review",
     "Reviewed in monthly VP forum",
     "Below-the-line for CDIO; routinely approved at VP."),

    ("auth-l3-svp-single", "SVP-level single-decision",
     500000, 2000000,
     "SVP", None, "(SVP of owning function)",
     "CIO_change_budget OR CIO_transform_budget OR Business_capital",
     "Business case + sourcing pack + executive sponsor signoff",
     "Reviewed at quarterly portfolio forum",
     "Includes vendor renewals at this band; CPO Brooks gates vendor terms."),

    ("auth-l4-cdio-single", "CDIO single-decision authority",
     2000000, 10000000,
     "EVP CDIO", "person:meridian:anita-krishnamurthy", "Dr. Anita Krishnamurthy",
     "CIO_change_capital OR CIO_transform_capital",
     "Business case + EPMO charter + finance signoff + AI Governance Council attestation if AI-touching",
     "Monthly EC review",
     "AI-program initiation gated through AI Governance Council (Wexler chair)."),

    ("auth-l5-cfo-cdio-joint", "CFO + CDIO joint approval",
     10000000, 25000000,
     "EVP CFO + EVP CDIO joint", "person:meridian:david-park", "David Park (CFO) + Anita Krishnamurthy (CDIO)",
     "CIO_change_capital OR CIO_transform_capital OR Business_capital",
     "Capital request memo + 5-year P&L impact + sponsor signoff",
     "Monthly EC + quarterly Board Finance Committee summary",
     "Both signatures required; tension common between CFO discipline and CDIO transformation."),

    ("auth-l6-ceo-single", "CEO single-decision authority",
     25000000, 50000000,
     "CEO", "person:meridian:elaine-morales", "Dr. Elaine Morales",
     "Corporate_capital OR Business_capital",
     "Enterprise capital review packet + Board Finance Committee endorsement",
     "Quarterly Board Finance Committee",
     "Signaling threshold for board-level visibility."),

    ("auth-l7-board-finance-committee", "Board Finance Committee",
     50000000, 200000000,
     "Board Finance Committee", None, "Board Finance Committee",
     "Corporate_capital OR Service_line_capital",
     "Capital plan submission + investment thesis + 7-year P&L + sensitivity analysis",
     "Quarterly with board materials",
     "Sacramento flagship modernization, Bay Area network investments are at this band."),

    ("auth-l8-full-board", "Full Board approval",
     200000000, None,
     "Full Board of Trustees", None, "Full Board",
     "Strategic_capital OR M&A_capital",
     "Strategic plan + competitive analysis + financing plan + regulatory readiness",
     "Annually + special sessions",
     "Hawaii expansion ($240M total cycle 2022-2023) was at this band."),

    ("auth-special-ai-gov", "AI Governance Council attestation",
     0, None,
     "AI Governance Council (Wexler chair)", "person:meridian:jennifer-wexler", "Dr. Jennifer Wexler",
     "Any AI-touching spend regardless of dollar threshold",
     "Use case design + clinical safety review + bias assessment + PHI handling + monitoring plan",
     "Bi-weekly during 23-use-case cycle",
     "PARALLEL gate to dollar approval; required for any spend with AI components. Attests to Board Risk Committee."),

    ("auth-special-board-risk", "Board Risk Committee oversight",
     0, None,
     "Board Risk Committee", None, "Board Risk Committee",
     "Any spend creating new enterprise risk concentration",
     "Risk register update + mitigation plan + monitoring framework",
     "Quarterly + ad-hoc for material risk events",
     "Reviews AI Governance attestations + cybersecurity posture quarterly."),
]


# -----------------------------------------------------------------------------
# APEX (retail)
# -----------------------------------------------------------------------------
# Reconciles to: ~250k EE, $108B revenue, ~$3.5B capital plan, ~4,500 IT FTE,
# ~$1.62B IT operating budget. Onshore IT mix is ~50/50 with significant
# offshore (India + Philippines) for retail support. Retail typically
# under-spends on IT vs healthcare/banks (1.5% of revenue benchmark).

APEX_FUNCTIONS: list[tuple] = [
    # ---- IT functions (sum to ~4,500 IT FTE, $1.62B operating budget) ----
    ("data-analytics", "Data & Analytics", "IT — Data",
     "person:apex:sterling-park-aboagye", "Sterling Park-Aboagye",
     410, 220, 175, 15,
     145000000, 22000000, 123000000,
     18,
     "Snowflake EDW, Adobe Experience Platform, customer CDP, Tableau, dbt, Databricks under eval, merchandising/customer/supply-chain analytics marts",
     "Retail benchmark: $120-160M for an $80-120B retailer with merchandising + customer + supply chain analytics depth.",
     "Larger offshore mix typical for retail (cost arb on commodity reporting work)."),

    ("infrastructure-cloud", "Infrastructure & Cloud", "IT — Infrastructure",
     "person:apex:raj-patel", "Raj Patel",
     680, 295, 365, 20,
     185000000, 28000000, 157000000,
     24,
     "AWS primary, Azure for store apps, GCP for analytics burst, store networking, DC ops, e-commerce platform infra",
     "Retail IT infra typically 0.25-0.35% of EE (625-875 for 250k EE). Offshore-heavy.",
     "1,976-store SD-WAN migration in progress; e-commerce uptime is critical."),

    ("application-services", "Application Services", "IT — Applications",
     "person:apex:diana-lopez", "Diana Lopez",
     1450, 580, 845, 25,
     325000000, 48000000, 277000000,
     58,
     "Merchandising apps (JDA/Oracle Retail), POS, ERP (SAP), Workday, e-commerce, supply chain apps, store back-office",
     "Largest IT function; retail-typical mix of in-house product engineering + offshore sustainment.",
     "Includes merchandising platform team, e-commerce engineering, store systems, ERP, supply chain apps."),

    ("information-security", "Information Security", "IT — Cyber",
     "person:apex:sarah-whitfield", "Sarah Whitfield (CISO)",
     220, 168, 42, 10,
     78500000, 12500000, 66000000,
     16,
     "Okta, CyberArk, CrowdStrike, Palo Alto, Splunk, Proofpoint, store-level POS skimming detection, organized retail crime intel",
     "Retail cyber typically 4-6% of IT FTE (180-270 for 4,500). PCI-DSS compliance heavy.",
     "Includes IAM, SOC, security architecture, third-party risk, PCI compliance ops, organized retail crime intel."),

    ("enterprise-architecture", "Enterprise Architecture", "IT — Architecture",
     "person:apex:linda-mwangi", "Linda Mwangi",
     58, 48, 8, 2,
     14500000, 2800000, 11700000,
     0,
     "Architecture review board; merchandising, customer/digital, supply chain, store-systems architecture practices",
     "Retail EA team typically 50-80 at this scale.",
     "Owns merch platform decisions, e-commerce/store unification, RFID architecture."),

    ("digital-ecommerce", "Digital & E-commerce Tech", "IT — Digital",
     "person:apex:priya-iyer", "Priya Iyer",
     385, 220, 155, 10,
     112000000, 18500000, 93500000,
     12,
     "E-commerce platform, mobile app, marketplace integration, checkout, search/browse, AR features",
     "Retail e-commerce engineering typically 8-12% of IT FTE.",
     "GMV growth + conversion rate are P&L-anchored metrics."),

    ("data-engineering", "Data Engineering & Platform", "IT — Data",
     "person:apex:james-wright", "James Wright",
     180, 95, 80, 5,
     38500000, 5800000, 32700000,
     14,
     "Snowflake, Tableau, dbt, Fivetran, real-time event processing, customer-360 platform engineering",
     "Sub-function under CDO Stratham; ~5% of IT FTE.",
     "Platform layer that data analytics function consumes."),

    ("store-technology", "Store Technology", "IT — Stores",
     "person:apex:vacant-store-tech", "OPEN — Acting: Brandon Hayes",
     385, 285, 92, 8,
     78500000, 14500000, 64000000,
     14,
     "POS, store back-office, inventory at-store, RFID, self-checkout, store networking",
     "Retail store tech 6-10% of IT FTE; high field-support component.",
     "Position OPEN; acting interim Brandon Hayes. Self-checkout deployment + RFID rollout in flight."),

    ("ai-emerging-tech", "AI & Emerging Tech", "IT — AI",
     "person:apex:elena-fischer", "Elena Fischer",
     38, 28, 8, 2,
     15500000, 4500000, 11000000,
     6,
     "AI workforce scheduling pilot, demand sensing AI, loyalty next-best-offer, shadow AI inventory ops",
     "Emerging function; retail typically 25-50 FTE at this scale.",
     "AI Governance Council operations; shadow AI cleanup focus."),

    ("epmo-program-mgmt", "Enterprise PMO & AI Portfolio", "IT — Governance",
     "person:apex:daniel-okeke", "Daniel Okeke",
     45, 38, 5, 2,
     8500000, 0, 8500000,
     2,
     "ServiceNow Strategic Portfolio, AI program tracking, transformation portfolio reporting",
     "Retail PMO typically 30-60 FTE at this scale.",
     "Coordinates active strategic moves portfolio."),

    # ---- Business / Merchandising / Stores ----
    ("merchandising-apparel", "Merchandising — Apparel & Accessories", "Business — Merch",
     "person:apex:theresa-aponte", "Theresa Aponte",
     1820, 1485, 285, 50,
     None, None, None,
     0,
     "Apparel category buying, planning, allocation, vendor management",
     "Apparel merch typically 600-1,000 buyers + planners + allocators at this scale.",
     "Largest single merchandising vertical by revenue."),

    ("merchandising-home-lifestyle", "Merchandising — Home & Lifestyle", "Business — Merch",
     "person:apex:bradley-wickersham", "Bradley Wickersham",
     980, 825, 145, 10,
     None, None, None,
     0,
     "Home/seasonal/decor/furniture buying, planning, vendor mgmt",
     "Home category merch ~500-800 at this scale.",
     "Seasonal cycle planning is signature complexity."),

    ("merchandising-grocery-consumables", "Merchandising — Grocery & Consumables", "Business — Merch",
     "person:apex:marcus-aldridge", "Marcus Aldridge",
     1280, 1180, 92, 8,
     None, None, None,
     0,
     "Grocery/CPG/fresh buying, private label, fresh program operations",
     "Grocery category merch typically 1,000-1,500 at this scale.",
     "Private-label penetration target + fresh program scaling."),

    ("merchandising-beauty-wellness", "Merchandising — Beauty/Health/Wellness", "Business — Merch",
     "person:apex:yuki-tanaka-riveras", "Yuki Tanaka-Riveras",
     720, 615, 98, 7,
     None, None, None,
     0,
     "Beauty/health/wellness buying, planning, vendor mgmt",
     "Beauty/wellness merch ~500-800 at this scale.",
     "Beauty growth + wellness adjacency expansion focus."),

    ("planning-allocation", "Planning & Allocation", "Business — Merch",
     "person:apex:dorian-petrov", "Dorian Petrov",
     485, 285, 195, 5,
     None, None, None,
     0,
     "Cross-category planning, allocation, demand forecasting, size/regional fit",
     "Retail planning/allocation typically 380-600 at this scale; offshore-heavy.",
     "Demand forecasting AI under governance; allocation accuracy is a key lever."),

    ("pricing-promotions", "Pricing & Promotions", "Business — Merch",
     "person:apex:eliana-karimov", "Eliana Karimov",
     185, 142, 38, 5,
     22500000, 0, 22500000,
     2,
     "Pricing analytics, promotion planning, competitor price intelligence",
     "Pricing+promo team typically 150-220 at this scale.",
     "Price-pack architecture + promo ROI."),

    ("stores-west", "Store Operations — West", "Business — Stores",
     "person:apex:brendan-walsh", "Brendan Walsh",
     78500, 78500, 0, 14000,
     None, None, None,
     0,
     "~720 stores across western United States",
     "Retail store associates: ~85-100 per store including PT.",
     "Largest single workforce category."),

    ("stores-east", "Store Operations — East", "Business — Stores",
     "person:apex:tasha-williams-choudhury", "Tasha Williams-Choudhury",
     72500, 72500, 0, 13000,
     None, None, None,
     0,
     "~680 stores across eastern United States",
     "Same density as West region.",
     "East region store P&L ownership."),

    ("stores-central", "Store Operations — Central", "Business — Stores",
     "person:apex:kenny-brink", "Kenny Brink",
     68500, 68500, 0, 12500,
     None, None, None,
     0,
     "~576 stores across central United States",
     "Includes rural-format stores.",
     "Central region store P&L ownership; rural-format optimization."),

    ("supply-chain-distribution", "Distribution & Fulfillment", "Business — Supply Chain",
     "person:apex:esperanza-vargas", "Esperanza Vargas",
     14500, 14500, 0, 2200,
     None, None, None,
     0,
     "12 DCs across United States; fulfillment + e-commerce + store replenishment",
     "Retail DC labor typically 1,200-1,800 per DC at automation level.",
     "Robotics under AI governance; automation ROI focus."),

    ("supply-chain-transport", "Transportation & Logistics", "Business — Supply Chain",
     "person:apex:dieter-hauptmann", "Dieter Hauptmann",
     480, 425, 35, 20,
     None, None, None,
     0,
     "Carrier mgmt, last-mile, freight optimization",
     "Retail transport teams typically 350-600 at this scale.",
     "Last-mile cost reduction + carrier diversification."),

    ("inventory-planning", "Inventory Planning & Replenishment", "Business — Supply Chain",
     "person:apex:chinedu-adekoya", "Chinedu Adekoya",
     420, 280, 132, 8,
     None, None, None,
     0,
     "Demand planning, replenishment, vendor scorecards",
     "Inventory planning team typically 350-500 at this scale.",
     "Sell-through 62% target 70%; out-of-stock reduction."),

    ("global-sourcing", "Global Sourcing", "Business — Supply Chain",
     "person:apex:marisol-akinyemi", "Marisol Akinyemi",
     385, 195, 188, 2,
     None, None, None,
     0,
     "Asia + nearshore sourcing offices, supplier mgmt, tariff strategy",
     "Retail global sourcing 280-450 at this scale; offshore-heavy by definition.",
     "Nearshoring vs Asia tradeoffs; tariff impact strategy."),

    ("brand-marketing", "Brand & Marketing", "Business — Marketing",
     "person:apex:yolanda-mendez-pearce", "Yolanda Mendez-Pearce",
     485, 425, 48, 12,
     280000000, 0, 280000000,
     6,
     "Brand creative, campaigns, agency management, paid media",
     "Retail marketing typically 0.18-0.28% of EE.",
     "Brand health + campaign ROI; private-brand storytelling."),

    ("customer-loyalty", "Customer Loyalty & CRM", "Business — Marketing",
     "person:apex:ramon-velasquez-park", "Ramon Velasquez-Park",
     145, 122, 18, 5,
     58500000, 4200000, 54300000,
     4,
     "Loyalty program operations, CRM, next-best-offer ops",
     "Retail CRM/loyalty teams typically 100-180 at this scale.",
     "Loyalty LTV uplift; next-best-offer AI under governance."),

    ("ecommerce-business", "E-commerce Business Operations", "Business — Digital",
     "person:apex:hadassah-gold-bjornsson", "Hadassah Gold-Bjornsson",
     580, 425, 145, 10,
     None, None, None,
     0,
     "E-commerce P&L, marketplace strategy, site merchandising, digital category mgmt",
     "Retail e-com biz ops 480-720 at this scale.",
     "GMV growth + conversion + marketplace strategy."),

    ("finance-treasury", "Finance, Treasury & FP&A", "Business — Corporate",
     "person:apex:margaret-chen", "Margaret Chen (CFO)",
     1850, 1245, 580, 25,
     245000000, 0, 245000000,
     8,
     "Oracle ERP, Workday Adaptive, FP&A platform, treasury workstation, internal audit tools",
     "Retail finance typically 0.7-0.9% of EE (1,750-2,250 for 250k EE).",
     "Includes Chen CFO, Carrera Treasurer, FP&A, Audit, IR."),

    ("hr-people", "HR / People & Culture", "Business — Corporate",
     "person:apex:thomas-brennan", "Thomas Brennan (CHRO)",
     1450, 1180, 245, 25,
     185000000, 0, 185000000,
     5,
     "Workday HCM, payroll, recruiting, talent management, benefits admin, store associate ops",
     "Retail HR typically 0.55-0.75% of EE (1,375-1,875 for 250k EE).",
     "Frontline workforce focus; store associate retention is signature challenge."),

    ("legal-compliance-privacy", "Legal, Compliance & Privacy", "Business — Corporate",
     "person:apex:rebecca-singh", "Rebecca Singh (GC)",
     185, 168, 12, 5,
     38500000, 0, 38500000,
     4,
     "Litigation tools, contract lifecycle, employment legal, privacy compliance",
     "Retail legal+compliance typically 0.06-0.10% of EE (150-250 for 250k EE).",
     "Includes commercial/vendor (Marin), privacy (Ostrowski), litigation/employment (Moseti-Anderson)."),

    ("strategy-corp-dev", "Strategy & Corporate Development", "Business — Corporate",
     "person:apex:magnus-castellanos", "Magnus Castellanos (CSO)",
     58, 52, 4, 2,
     22500000, 0, 22500000,
     0,
     "Strategy + M&A pipeline + competitive intelligence",
     "Retail strategy typically 40-80 at this scale.",
     "Activist-investor narrative + AI portfolio strategy."),
]


APEX_CAPITAL_PLAN: list[tuple] = [
    # Total target: ~$3.5B FY2026 capital plan + ~$95B operating budget
    # IT capital share: ~5-7% of enterprise capex ($175-245M)

    ("ent-cap-fy26-it-store-tech", "Capital — IT", "Store Technology Refresh (POS, Self-Checkout, RFID)",
     "person:apex:vacant-store-tech", "OPEN — Acting: Brandon Hayes",
     78000000, 14000000, 62000000,
     "CIO_change_capital", "EVP CIO + CFO joint", "approved",
     None, "Multi-year refresh; self-checkout fleet expansion + RFID rollout to 1,200 stores."),

    ("ent-cap-fy26-it-merchandising-platform", "Capital — IT", "Merchandising Platform Modernization",
     "person:apex:patrick-suzuki", "Patrick Suzuki",
     32500000, 8500000, 24000000,
     "CIO_change_capital", "EVP CIO + CMO Foster joint", "approved",
     None, "Allocation + planning modernization; AI-assisted assortment integration."),

    ("ent-cap-fy26-it-data-platform", "Capital — IT", "Data Platform & CDP",
     "person:apex:james-wright", "James Wright",
     28500000, 8500000, 21000000,
     "CIO_change_capital", "EVP CIO + CDO Stratham joint", "approved",
     None, "Snowflake expansion + CDP utilization + customer-360."),

    ("ent-cap-fy26-it-cybersecurity", "Capital — IT", "Cybersecurity & PCI Modernization",
     "person:apex:sarah-whitfield", "Sarah Whitfield (CISO)",
     22000000, 0, 18500000,
     "CIO_change_capital", "EVP CIO + CFO joint", "approved",
     None, "Compounded post-organized-retail-crime trend; PCI-DSS posture refresh."),

    ("ent-cap-fy26-it-ecommerce", "Capital — IT", "E-commerce Platform Reliability",
     "person:apex:naveen-cabrera", "Naveen Cabrera",
     24500000, 4500000, 18500000,
     "CIO_change_capital", "EVP CIO + CMO Park joint", "approved",
     None, "Site conversion + marketplace integration."),

    ("ent-cap-fy26-it-ai-program", "Capital — IT", "AI Program Portfolio (Workforce Scheduling, Demand Sensing, NBO)",
     "person:apex:elena-fischer", "Elena Fischer",
     12500000, 4500000, 6800000,
     "CIO_transform_capital", "EVP CIO + AI Gov Council", "approved",
     None, "Workforce scheduling pilot + demand sensing + loyalty NBO; gated through governance."),

    ("ent-cap-fy26-it-supply-chain-systems", "Capital — IT", "Supply Chain Systems Modernization",
     "person:apex:yousef-andrade", "Yousef Andrade",
     18500000, 4500000, 14000000,
     "CIO_change_capital", "EVP CIO + CSCO Tanaka joint", "approved",
     None, "DC automation integration; transport tech."),

    ("ent-cap-fy26-it-cloud-migration", "Capital — IT", "Cloud Migration & FinOps",
     "person:apex:helena-brzezinski", "Helena Brzezinski",
     14500000, 6500000, 11200000,
     "CIO_run_capital", "EVP CIO", "approved",
     None, "Multi-cloud cost optimization + landing zone modernization."),

    # ---- Enterprise capex (non-IT) ----
    ("ent-cap-fy26-store-construction-remodel", "Capital — Stores", "Store Construction & Remodel",
     "person:apex:ronaldo-quintero", "Ronaldo Quintero",
     780000000, 0, 720000000,
     "Corporate_capital", "Board Capital Committee", "approved",
     None, "Multi-year remodel cycle + small-format expansion."),

    ("ent-cap-fy26-distribution-center-automation", "Capital — Supply Chain", "DC Automation",
     "person:apex:esperanza-vargas", "Esperanza Vargas",
     385000000, 0, 320000000,
     "Corporate_capital", "Board Capital Committee", "approved",
     None, "Robotics + WMS upgrade; throughput + labor reduction."),

    ("ent-cap-fy26-supply-chain-transport-fleet", "Capital — Supply Chain", "Transport Fleet & Tech",
     "person:apex:dieter-hauptmann", "Dieter Hauptmann",
     145000000, 0, 124000000,
     "Corporate_capital", "EVP CSCO + CFO", "approved",
     None, "Fleet refresh + last-mile capability."),

    ("ent-cap-fy26-corporate-headquarters", "Capital — Real Estate", "Corporate Real Estate",
     "person:apex:ronaldo-quintero", "Ronaldo Quintero",
     85000000, 0, 72000000,
     "Corporate_capital", "Board Capital Committee", "approved",
     None, "HQ + regional office consolidation."),

    ("ent-opex-fy26-store-labor", "Operating — Stores", "Store Associate Labor (consolidated)",
     "person:apex:david-okonjo", "David Okonjo (COO)",
     0, 18500000000, 17800000000,
     "Operating_budget", "EVP COO + CEO + CFO", "approved",
     None, "~219k store associates; largest line in Apex P&L."),

    ("ent-opex-fy26-cogs-grocery", "Operating — COGS", "Grocery + Consumables COGS",
     "person:apex:marcus-aldridge", "Marcus Aldridge",
     0, 22500000000, 21800000000,
     "Operating_budget", "EVP CMO Foster + CFO", "approved",
     None, "Grocery margin recovery focus."),

    ("ent-opex-fy26-it-operations", "Operating — IT", "Total IT Operating Budget",
     "person:apex:carlos-rivera", "Carlos Rivera (CIO)",
     0, 1620000000, 1525000000,
     "CIO_run_budget", "EVP CIO + CFO", "approved",
     None, "Industry-standard 1.5% of revenue for retail at this scale."),
]


APEX_FUNDING_AUTHORITY: list[tuple] = [
    ("auth-l1-director", "Director-level operating spend",
     0, 250000,
     "Director", None, "(any director within function)",
     "CIO_run_budget OR Business_opex",
     "Standard PR; aggregates monthly to VP",
     "Single-shot",
     "Retail thresholds higher than healthcare due to scale + commodity volume."),

    ("auth-l2-vp-single", "VP-level single-decision",
     250000, 1000000,
     "VP", None, "(VP of owning function)",
     "CIO_run_budget OR CIO_change_budget OR Business_opex",
     "Vendor scorecard, 1-page business case, finance review",
     "Monthly VP forum",
     "VP-level vendor renewals at this band."),

    ("auth-l3-svp-single", "SVP-level single-decision",
     1000000, 5000000,
     "SVP", None, "(SVP of owning function)",
     "CIO_change_budget OR Business_capital OR Merch_budget",
     "Business case + sourcing pack + executive sponsor",
     "Quarterly portfolio forum",
     "Includes most merchandising vendor commitments at this band."),

    ("auth-l4-cio-single", "CIO single-decision authority",
     5000000, 25000000,
     "EVP CIO", "person:apex:carlos-rivera", "Carlos Rivera (CIO)",
     "CIO_change_capital OR CIO_transform_capital",
     "Business case + EPMO charter + finance signoff + AI Gov Council attestation if AI-touching",
     "Monthly EC review",
     "AI program initiation gated through Apex AI Governance Council."),

    ("auth-l5-cfo-cio-joint", "CFO + CIO joint approval",
     25000000, 75000000,
     "EVP CFO + EVP CIO joint", "person:apex:margaret-chen", "Margaret Chen (CFO) + Carlos Rivera (CIO)",
     "CIO_change_capital OR Business_capital",
     "Capital memo + 5-year P&L + sponsor signoff",
     "Monthly EC + quarterly Board Capital",
     "Both signatures required."),

    ("auth-l6-ceo-single", "CEO single-decision authority",
     75000000, 200000000,
     "CEO", "person:apex:robert-vance", "Robert Vance",
     "Corporate_capital OR Strategic_capital",
     "Enterprise capital review packet + Board endorsement",
     "Quarterly Board Capital Committee",
     "Store remodel programs + DC automation are at this band."),

    ("auth-l7-board-capital-committee", "Board Capital Committee",
     200000000, 750000000,
     "Board Capital Committee", None, "Board Capital Committee",
     "Corporate_capital",
     "Capital plan + investment thesis + 7-year P&L",
     "Quarterly with board materials",
     "Multi-year store remodel cycle + DC automation programs."),

    ("auth-l8-full-board", "Full Board approval",
     750000000, None,
     "Full Board of Directors", None, "Full Board",
     "Strategic_capital OR M&A_capital",
     "Strategic plan + competitive analysis + financing plan",
     "Annually + special sessions",
     "Multi-year strategic plans."),

    ("auth-special-ai-gov", "AI Governance Council attestation",
     0, None,
     "Apex AI Governance Council", None, "Apex AI Governance Council",
     "Any AI-touching spend",
     "Use case design + bias assessment + customer data handling + monitoring",
     "Bi-weekly during active program cycles",
     "PARALLEL gate to dollar approval."),
]


# -----------------------------------------------------------------------------
# FIRST CAPITAL (regional super-bank)
# -----------------------------------------------------------------------------
# Reconciles to: 46k EE, $18.2B revenue, $362B assets, ~$700M capital plan,
# ~2,400 IT FTE, ~$1.67B IT operating budget (9.2% per existing fixtures).
# Banks have tighter approval authorities because of regulatory risk.

FC_FUNCTIONS: list[tuple] = [
    # ---- IT functions ----
    ("data-analytics", "Data & Analytics (incl. MRM analytics)", "IT — Data",
     "person:firstcapital:sandra-liu", "Sandra Liu (CDO)",
     245, 198, 38, 9,
     78500000, 12500000, 66000000,
     12,
     "Snowflake EDW, Databricks (MRM-gated), Tableau Cloud, Alteryx, Collibra, regulatory reporting platform, data science + AI platform",
     "Bank benchmark: $70-90M for $15-20B regional super-bank with regulatory + LOB analytics depth.",
     "Gated relationship with MRM (James Park) for AI/ML use cases."),

    ("infrastructure-cloud", "Infrastructure & Cloud", "IT — Infrastructure",
     "person:firstcapital:garrison-veres", "Garrison Veres",
     385, 245, 128, 12,
     145000000, 22000000, 123000000,
     22,
     "AWS primary cloud, Azure secondary (M365 + Azure OpenAI), VMware on-prem private cloud, Cisco network, branch connectivity",
     "Bank infra typically 0.7-1.0% of EE (322-460 for 46k EE).",
     "Bank-typical heavy on-prem private cloud for core banking; 480-branch network operations."),

    ("application-services", "Application Services (Core Banking + LOB platforms)", "IT — Applications",
     "person:firstcapital:reginald-hawthorne-bjornsson", "Reginald Hawthorne-Bjornsson",
     820, 480, 320, 20,
     285000000, 32500000, 252500000,
     38,
     "FIS Profile core banking, payments (FedNow build, ACH, wires, cards via TSYS), wealth (FIS Charlotte, Pershing), commercial (treasury mgmt), trading (Calypso, Murex)",
     "Largest IT function; banks operate complex platform portfolios.",
     "Core banking modernization decision live in FY2026 (replace vs. modernize FIS Profile)."),

    ("information-security", "Information Security", "IT — Cyber",
     "person:firstcapital:tobias-aboagye", "Tobias Aboagye (CISO)",
     220, 178, 32, 10,
     128000000, 18500000, 109500000,
     14,
     "Okta, CyberArk, CrowdStrike, Palo Alto + Prisma, Splunk SIEM, Proofpoint, Zscaler, third-party risk tooling",
     "Bank cyber 8-12% of IT FTE (192-288 for 2,400). FFIEC-compliant.",
     "Includes IAM, SOC, security architecture, third-party risk."),

    ("enterprise-architecture", "Enterprise Architecture", "IT — Architecture",
     "person:firstcapital:manuela-ostrowski-brennan", "Manuela Ostrowski-Brennan",
     58, 52, 4, 2,
     14500000, 2500000, 12000000,
     0,
     "Architecture review board; LOB, data, integration, AI architecture practices",
     "Bank EA typically 50-80 at this scale.",
     "Owns target-state architecture for AI-enabled bank + FedNow integration + core banking decision."),

    ("digital-banking-engineering", "Digital Banking Engineering", "IT — Digital",
     "person:firstcapital:eira-hauptmann-park", "Eira Hauptmann-Park",
     245, 185, 55, 5,
     78500000, 12500000, 66000000,
     6,
     "Q2 platform, mobile/web engineering, online banking, commercial digital banking",
     "Bank digital eng typically 8-12% of IT FTE.",
     "Digital adoption from 41% to 60% target."),

    ("model-risk-management", "Model Risk Management", "IT — Risk Tech",
     "person:firstcapital:ferris-adekoya-park", "Ferris Adekoya-Park",
     85, 78, 5, 2,
     22500000, 3500000, 19000000,
     2,
     "DataRobot model registry, MRM tooling, AI/ML attestation pipeline",
     "Bank MRM typically 60-120 FTE under SR 11-7 governance.",
     "Critical voice for every AI program initiation."),

    ("regulatory-reporting-tech", "Regulatory Reporting Tech", "IT — Risk Tech",
     "person:firstcapital:eleanora-ouellette-park", "Eleanora Ouellette-Park",
     95, 88, 5, 2,
     32500000, 4500000, 28000000,
     4,
     "AxiomSL ControllerView, OneSumX, Call Report platform, FFIEC tooling",
     "Bank reg-reporting tech typically 80-120 FTE at this scale.",
     "OCC examination response + Basel + CCAR reporting."),

    ("ai-platform-mlops", "AI Platform & MLOps (under MRM)", "IT — AI",
     "person:firstcapital:ramses-mwakikagile", "Ramses Mwakikagile",
     32, 28, 3, 1,
     12500000, 3500000, 9000000,
     5,
     "Databricks MLOps, model registry, DataRobot, Anthropic Claude via Bedrock (gated)",
     "Bank AI platform 25-50 FTE; growth gated by MRM.",
     "Bridge between AI program portfolio and Model Risk Management."),

    ("epmo-program-mgmt", "Enterprise IT PMO & AI Portfolio", "IT — Governance",
     "person:firstcapital:jamilla-quintero-adekoya", "Jamilla Quintero-Adekoya",
     45, 42, 2, 1,
     8500000, 0, 8500000,
     2,
     "ServiceNow Strategic Portfolio, AI program tracking, MRM intake coordination",
     "Bank PMO typically 35-60 FTE at this scale.",
     "Coordinates active strategic moves portfolio."),

    # ---- LOB operations ----
    ("consumer-banking-ops", "Consumer Banking Operations", "Business — LOB",
     "person:firstcapital:reuben-hayes-andersen", "Reuben Hayes-Andersen",
     2480, 2080, 380, 20,
     185000000, 8500000, 176500000,
     12,
     "Branch ops, contact center, consumer payment ops, deposit ops, lending servicing",
     "Bank consumer ops 5-8% of total bank FTE; large branch + contact center.",
     "Includes 480 branches + contact center modernization in flight."),

    ("commercial-banking-ops", "Commercial Banking Operations", "Business — LOB",
     "person:firstcapital:daniel-ostrowski", "Daniel Ostrowski (CFO Commercial)",
     1850, 1685, 145, 20,
     142000000, 6500000, 135500000,
     8,
     "Treasury management ops, commercial loan origination + servicing, commercial deposits",
     "Bank commercial ops typically 4-6% of total bank FTE.",
     "Treasury platform refresh + FedNow corporate connectivity."),

    ("wealth-management-ops", "Wealth Management Operations", "Business — LOB",
     "person:firstcapital:verity-nakamura-reid", "Verity Nakamura-Reid",
     1720, 1545, 165, 10,
     124000000, 5500000, 118500000,
     10,
     "Advisor desktop ops, trust accounting, brokerage clearing operations, private bank ops",
     "Bank wealth ops typically 0.4-0.6 FTE per $250M AUM (1,680 for $420B AUM).",
     "Includes private bank, trust, investment mgmt, brokerage, wealth onboarding."),

    ("treasury-markets-ops", "Treasury & Capital Markets Operations", "Business — LOB",
     "person:firstcapital:otis-brennan-mwale", "Otis Brennan-Mwale",
     580, 545, 32, 3,
     85000000, 4500000, 80500000,
     8,
     "Bank treasury ops, ALM, trading floor support, market-making ops",
     "Bank treasury+markets typically 1-2% of total bank FTE.",
     "FedNow liquidity tooling + ALM modernization."),

    # ---- Risk & Compliance ----
    ("compliance-bsa-aml", "Compliance, BSA/AML & Financial Crime", "Business — Risk",
     "person:firstcapital:saoirse-quintero", "Saoirse Quintero",
     1180, 1085, 85, 10,
     245000000, 0, 245000000,
     8,
     "NICE Actimize, Verafin pilot, LexisNexis KYC, sanctions screening, fair lending tooling",
     "Bank compliance largest at this scale; 2.5-3.5% of EE post-OCC findings (1,150-1,610 for 46k EE).",
     "Largest contributor to 34% compliance share of IT budget (per existing fixtures)."),

    ("risk-credit", "Credit Risk Management", "Business — Risk",
     "person:firstcapital:quentin-olabode-reyes", "Quentin Olabode-Reyes",
     385, 358, 22, 5,
     85000000, 0, 85000000,
     4,
     "SAS Risk Engine, Moodys RiskFrontier, credit modeling platforms",
     "Bank credit risk 0.7-1.0% of EE (322-460 for 46k EE).",
     "Stress testing + portfolio analytics + concentration."),

    ("risk-market-liquidity", "Market & Liquidity Risk", "Business — Risk",
     "person:firstcapital:marisol-skouras-wendt", "Marisol Skouras-Wendt",
     145, 138, 5, 2,
     45000000, 0, 45000000,
     3,
     "Calypso market risk, LCR/NSFR tooling, hedge effectiveness platforms",
     "Bank market+liquidity risk typically 120-180 at this scale.",
     "Balance-sheet + trading + ALM risk."),

    ("risk-operational", "Operational Risk", "Business — Risk",
     "person:firstcapital:hayden-carrera-park", "Hayden Carrera-Park",
     180, 172, 5, 3,
     38500000, 0, 38500000,
     2,
     "Operational risk framework, third-party risk, scenario analysis",
     "Bank operational risk typically 150-220 at this scale.",
     "Third-party risk concentration focus post-OCC."),

    ("audit-internal", "Internal Audit", "Business — Risk",
     "person:firstcapital:reginald-atherton", "Reginald Atherton (CAE)",
     280, 265, 12, 3,
     58500000, 0, 58500000,
     3,
     "MetricStream GRC, audit workpapers, regulatory remediation tracking",
     "Bank internal audit typically 0.5-0.7% of EE.",
     "Reports to Audit Committee; AI program audit + reg remediation."),

    # ---- Corporate Functions ----
    ("finance-treasury", "Finance, Treasury & FP&A", "Business — Corporate",
     "person:firstcapital:jules-bernhardt", "Jules Bernhardt (Treasurer)",
     720, 685, 28, 7,
     128000000, 0, 128000000,
     6,
     "Oracle ERP, Workday Adaptive, treasury workstation, CCAR platforms, IR tools",
     "Bank finance typically 1.4-1.8% of EE (644-828 for 46k EE).",
     "Includes Torres CFO, Bernhardt Treasurer, FP&A, IR, Tax."),

    ("hr-people", "HR / People & Culture", "Business — Corporate",
     "person:firstcapital:rosalind-castellanos", "Rosalind Castellanos (CHRO)",
     385, 365, 15, 5,
     58500000, 0, 58500000,
     3,
     "Workday HCM, payroll, recruiting, talent management, benefits admin",
     "Bank HR typically 0.7-0.9% of EE (322-414 for 46k EE).",
     "Tech labor market + advisor recruiting focus."),

    ("legal-securities", "Legal (Banking + Securities + Wealth)", "Business — Corporate",
     "person:firstcapital:camille-beauregard", "Camille Beauregard (GC)",
     245, 232, 8, 5,
     78500000, 0, 78500000,
     3,
     "Litigation tools, contract lifecycle, regulatory legal platforms",
     "Bank legal typically 0.4-0.6% of EE (184-276 for 46k EE).",
     "Includes Banking Legal (Nwoko-Park), Securities/Wealth Legal (Aboagye-Williams), Litigation (Bjornsdottir)."),

    ("strategy-corp-dev", "Strategy & Corporate Development", "Business — Corporate",
     "person:firstcapital:theodore-kobayashi", "Theodore Kobayashi (CSO)",
     58, 52, 4, 2,
     22500000, 0, 22500000,
     0,
     "Strategy + M&A pipeline + competitive intelligence",
     "Bank strategy typically 40-80 at this scale.",
     "Regional-bank consolidation strategy + AI program alignment."),

    ("communications-investor-relations", "Communications & Investor Relations", "Business — Corporate",
     "person:firstcapital:yvonne-marchetti-park", "Yvonne Marchetti-Park (CCO)",
     38, 35, 2, 1,
     12500000, 0, 12500000,
     0,
     "IR platforms, regulatory exam comms, AI public posture mgmt",
     "Bank communications typically 30-60 at this scale.",
     "OCC findings narrative + investor relations."),

    ("procurement-vendor-mgmt", "Procurement & Vendor Mgmt (TPRM)", "Business — Corporate",
     "person:firstcapital:nadia-rahman", "Nadia Rahman (CPO)",
     145, 138, 5, 2,
     32500000, 0, 32500000,
     3,
     "Coupa, vendor risk tooling, contract lifecycle, fintech vendor reviews",
     "Bank procurement typically 0.25-0.35% of EE (115-161 for 46k EE).",
     "Includes IT Sourcing (Brooks); fintech vendor risk is signature complexity."),
]


FC_CAPITAL_PLAN: list[tuple] = [
    # Total target: ~$700M FY2026 capital plan + ~$13.4B operating budget
    # IT capital share: ~22-28% of enterprise capex (banks IT-heavy)

    ("ent-cap-fy26-it-fednow-build", "Capital — IT", "FedNow + Real-Time Payments Build",
     "person:firstcapital:kira-tanaka-riveras", "Kira Tanaka-Riveras",
     32500000, 8500000, 22500000,
     "CIO_change_capital", "EVP CIO + CRO James Park joint", "approved",
     None, "Build phase for 2026 cutover; CRO concurrence required given payment risk."),

    ("ent-cap-fy26-it-core-banking-discovery", "Capital — IT", "Core Banking Modernization Discovery",
     "person:firstcapital:pia-quintero-walsh", "Pia Quintero-Walsh",
     12000000, 0, 6500000,
     "CIO_transform_capital", "EVP CIO + CFO + CEO joint", "approved",
     None, "FY2026 evaluation: replace vs. modernize FIS Profile. Largest single transformation decision pending."),

    ("ent-cap-fy26-it-cybersecurity", "Capital — IT", "Cybersecurity Modernization (post-OCC)",
     "person:firstcapital:tobias-aboagye", "Tobias Aboagye (CISO)",
     38500000, 0, 32000000,
     "CIO_change_capital", "EVP CIO + CRO James Park joint", "approved",
     None, "FFIEC cyber assessment-driven; OCC findings remediation."),

    ("ent-cap-fy26-it-data-platform", "Capital — IT", "Data Platform & MRM Tooling",
     "person:firstcapital:bjorn-ngangole", "Bjorn Ngangole",
     22500000, 8500000, 14000000,
     "CIO_change_capital", "EVP CIO + CDO Liu joint", "approved",
     None, "Snowflake expansion + MRM model registry + AI program data infra."),

    ("ent-cap-fy26-it-digital-banking", "Capital — IT", "Consumer Digital Banking Roadmap",
     "person:firstcapital:eira-hauptmann-park", "Eira Hauptmann-Park",
     18500000, 4500000, 14000000,
     "CIO_change_capital", "EVP CIO + Consumer Bank CEO Osei joint", "approved",
     None, "Mobile feature velocity + personalization (under MRM)."),

    ("ent-cap-fy26-it-ai-program", "Capital — IT", "AI Program Portfolio (under MRM)",
     "person:firstcapital:ramses-mwakikagile", "Ramses Mwakikagile",
     8500000, 4500000, 3200000,
     "CIO_transform_capital", "EVP CIO + CRO + MRM Adekoya-Park joint", "approved",
     None, "First full-year AI program; MRM gated; CRO Park is independent voice."),

    ("ent-cap-fy26-it-reg-reporting", "Capital — IT", "Regulatory Reporting Modernization",
     "person:firstcapital:eleanora-ouellette-park", "Eleanora Ouellette-Park",
     12500000, 0, 9500000,
     "CIO_change_capital", "EVP CIO + CRO joint", "approved",
     None, "Adenza/AxiomSL upgrade + Call Report automation."),

    ("ent-cap-fy26-it-cloud-migration", "Capital — IT", "Cloud Migration & FinOps",
     "person:firstcapital:phaedra-andersen", "Phaedra Andersen",
     14500000, 6500000, 10800000,
     "CIO_run_capital", "EVP CIO", "approved",
     None, "AWS-primary + Azure secondary architecture; AI workload growth driver."),

    ("ent-cap-fy26-it-fraud-aml", "Capital — IT", "Fraud + AML Platform Expansion",
     "person:firstcapital:saoirse-quintero", "Saoirse Quintero",
     8500000, 4500000, 5800000,
     "Business_capital_compliance", "EVP Compliance + CRO joint", "approved",
     None, "Post-OCC findings; NICE Actimize + Verafin pilot consolidation."),

    ("ent-cap-fy26-it-branch-tech", "Capital — IT", "Branch Tech & ATM Refresh",
     "person:firstcapital:donovan-marsh-yamaguchi", "Donovan Marsh-Yamaguchi",
     22000000, 0, 18500000,
     "CIO_run_capital", "EVP CIO + Consumer Bank CEO joint", "approved",
     None, "480-branch + 720-ATM fleet refresh."),

    # ---- Enterprise capex (non-IT) ----
    ("ent-cap-fy26-branch-network", "Capital — Branches", "Branch Network Rationalization",
     "person:firstcapital:donovan-marsh-yamaguchi", "Donovan Marsh-Yamaguchi",
     85000000, 0, 78000000,
     "Corporate_capital", "Board Capital Committee", "approved",
     None, "Branch consolidation + relocation + select expansions."),

    ("ent-cap-fy26-corporate-real-estate", "Capital — Real Estate", "Corporate Real Estate Modernization",
     "person:firstcapital:nadia-rahman", "Nadia Rahman",
     58000000, 0, 48000000,
     "Corporate_capital", "Board Capital Committee", "approved",
     None, "HQ + regional office consolidation."),

    ("ent-cap-fy26-cra-community", "Capital — CRA", "Community Reinvestment Investments",
     "person:firstcapital:vivienne-solberg-apt", "Vivienne Solberg-Apt",
     145000000, 0, 132000000,
     "CRA_balance_sheet_capital", "Board Risk + CRA Committee", "approved",
     None, "CRA-aligned investments; required for regulatory compliance."),

    ("ent-cap-fy26-stress-test-buffer", "Capital — Risk Buffer", "CCAR Stress Capital Reserve",
     "person:firstcapital:james-park", "James Park (CRO)",
     0, 0, 0,
     "CCAR_buffer_capital", "Board Risk Committee", "approved",
     None, "Capital reserve held against CCAR scenarios; not deployed unless stressed."),

    # ---- Enterprise opex envelopes ----
    ("ent-opex-fy26-comp-benefits", "Operating — People", "Total Compensation & Benefits",
     "person:firstcapital:rosalind-castellanos", "Rosalind Castellanos (CHRO)",
     0, 5800000000, 5520000000,
     "Operating_budget", "EVP CHRO + CFO + CEO", "approved",
     None, "Largest single operating expense line."),

    ("ent-opex-fy26-credit-loss-provisions", "Operating — Credit", "Provision for Credit Losses",
     "person:firstcapital:james-park", "James Park (CRO)",
     0, 980000000, 740000000,
     "Operating_budget", "EVP CRO + CFO + Board Risk", "approved",
     None, "Counter-cyclical; credit-cycle dependent."),

    ("ent-opex-fy26-it-operations", "Operating — IT", "Total IT Operating Budget",
     "person:firstcapital:patricia-huang", "Patricia Huang (CIO)",
     0, 1670000000, 1525000000,
     "CIO_run_budget", "EVP CIO + CFO", "approved",
     None, "9.2% of revenue per existing fixtures (highest in peer group; compliance-driven)."),

    ("ent-opex-fy26-occupancy", "Operating — Occupancy", "Branches + Offices + Data Centers",
     "person:firstcapital:nadia-rahman", "Nadia Rahman",
     0, 480000000, 465000000,
     "Operating_budget", "EVP COO + CFO", "approved",
     None, "Real estate + utilities + facilities; branch rationalization opportunity."),
]


FC_FUNDING_AUTHORITY: list[tuple] = [
    # Banks have tighter authorities than retail/healthcare due to regulatory risk
    ("auth-l1-director", "Director-level operating spend",
     0, 100000,
     "Director", None, "(any director within function)",
     "CIO_run_budget OR Business_opex",
     "Standard PR; aggregates monthly to VP",
     "Single-shot",
     "Banks tighter than retail at director level due to regulatory scrutiny."),

    ("auth-l2-vp-single", "VP-level single-decision",
     100000, 500000,
     "VP", None, "(VP of owning function)",
     "CIO_run_budget OR CIO_change_budget OR Business_opex",
     "Vendor scorecard, business case, finance + risk review",
     "Monthly VP forum",
     "Risk function review required for any vendor introduction."),

    ("auth-l3-svp-single", "SVP-level single-decision",
     500000, 2000000,
     "SVP", None, "(SVP of owning function)",
     "CIO_change_budget OR CIO_transform_budget OR Business_capital",
     "Business case + sourcing pack + executive sponsor + TPRM review",
     "Quarterly portfolio forum",
     "Third-party risk review (TPRM) is required for new vendors."),

    ("auth-l4-cio-or-evp-single", "CIO single-decision authority",
     2000000, 5000000,
     "EVP CIO", "person:firstcapital:patricia-huang", "Patricia Huang (CIO)",
     "CIO_change_capital OR CIO_transform_capital",
     "Business case + EPMO charter + finance + MRM intake if AI/ML touching",
     "Monthly EC review",
     "AI initiation gated through MRM (Adekoya-Park)."),

    ("auth-l5-cfo-cio-cro-joint", "CFO + CIO + CRO joint approval",
     5000000, 25000000,
     "CFO + CIO + CRO joint", "person:firstcapital:michael-torres", "Michael Torres (CFO) + Patricia Huang (CIO) + James Park (CRO)",
     "CIO_change_capital OR CIO_transform_capital OR Business_capital",
     "Capital memo + 5-year P&L + risk attestation + sponsor signoff",
     "Monthly EC + quarterly Board Risk Committee summary",
     "Three-signature requirement at this band; CRO is gating voice for risk concentration."),

    ("auth-l6-ceo-single", "CEO single-decision authority",
     25000000, 50000000,
     "CEO", "person:firstcapital:david-morrison", "David Morrison",
     "Corporate_capital OR Strategic_capital",
     "Enterprise capital review + Board Risk + Audit Committee summary",
     "Quarterly Board",
     "FedNow build + cybersecurity modernization at this band."),

    ("auth-l7-board-risk-committee", "Board Risk Committee (with CRO independent attestation)",
     0, None,
     "Board Risk Committee", None, "Board Risk Committee",
     "Any spend creating new risk concentration",
     "Risk register + mitigation plan + monitoring framework + regulatory implications",
     "Quarterly + ad-hoc for material risk events",
     "PARALLEL gate: any AI program + any third-party concentration + any regulatory remediation reaches this committee regardless of dollar threshold."),

    ("auth-l8-board-capital-committee", "Board Capital Committee",
     50000000, 200000000,
     "Board Capital Committee", None, "Board Capital Committee",
     "Corporate_capital",
     "Capital plan + investment thesis + 7-year P&L + sensitivity",
     "Quarterly with board materials",
     "CRA investments + branch network + core banking modernization decision will reach this committee."),

    ("auth-l9-full-board", "Full Board approval",
     200000000, None,
     "Full Board of Directors", None, "Full Board",
     "Strategic_capital OR M&A_capital",
     "Strategic plan + financing + regulatory readiness + CCAR implications",
     "Annually + special sessions",
     "Core banking replacement (if elected) would reach Full Board."),

    ("auth-special-mrm", "Model Risk Management attestation (SR 11-7)",
     0, None,
     "MRM (Adekoya-Park) reporting to CRO", "person:firstcapital:ferris-adekoya-park", "Ferris Adekoya-Park",
     "Any AI/ML model deployment regardless of dollar threshold",
     "Model documentation + validation + monitoring + lineage + bias assessment",
     "Bi-weekly during active program cycles",
     "PARALLEL gate to dollar approval; required for any AI/ML model regardless of business sponsor or dollar size. SR 11-7 governance."),

    ("auth-special-fair-lending", "Fair Lending compliance review",
     0, None,
     "Fair Lending compliance (Castellanos-Liu) reporting to CCO", "person:firstcapital:brendan-castellanos-liu", "Brendan Castellanos-Liu",
     "Any consumer-facing AI/ML model touching credit decisions",
     "Disparate impact testing + variable selection review + monitoring",
     "Bi-weekly",
     "PARALLEL gate for any consumer credit AI/ML model."),
]


# -----------------------------------------------------------------------------
# Persistence
# -----------------------------------------------------------------------------

TENANTS: dict[str, dict] = {
    "meridian": {
        "out_dir": ROOT / "meridian-data",
        "id_prefix": "meridian",
        "functions": MERIDIAN_FUNCTIONS,
        "capital_plan": MERIDIAN_CAPITAL_PLAN,
        "funding_authority": MERIDIAN_FUNDING_AUTHORITY,
    },
    "apex": {
        "out_dir": ROOT / "src/scripts/setup-data/apex-data",
        "id_prefix": "apex",
        "functions": APEX_FUNCTIONS,
        "capital_plan": APEX_CAPITAL_PLAN,
        "funding_authority": APEX_FUNDING_AUTHORITY,
    },
    "firstcapital": {
        "out_dir": ROOT / "src/scripts/setup-data/firstcapital-data",
        "id_prefix": "firstcapital",
        "functions": FC_FUNCTIONS,
        "capital_plan": FC_CAPITAL_PLAN,
        "funding_authority": FC_FUNDING_AUTHORITY,
    },
}


def write_csv(path: Path, header: list[str], rows: list[list]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as f:
        w = csv.writer(f)
        w.writerow(header)
        for row in rows:
            w.writerow(row)
    print(f"  {path.relative_to(ROOT)}: {len(rows)} rows")


def emit_for_tenant(tenant_key: str) -> None:
    cfg = TENANTS[tenant_key]
    base = cfg["out_dir"]
    prefix = cfg["id_prefix"]

    # Function capacity
    fc_rows: list[list] = []
    for r in cfg["functions"]:
        fc_rows.append([
            f"function:{prefix}:{r[0]}",  # function_id
            *r[1:],
        ])
    write_csv(base / "02_org_structure" / "function_capacity.csv",
              FUNCTION_CAPACITY_HEADER, fc_rows)

    # Capital plan
    cp_rows: list[list] = []
    for r in cfg["capital_plan"]:
        cp_rows.append([
            f"capital:{prefix}:{r[0]}",  # line_id
            *r[1:],
        ])
    write_csv(base / "04_it_financials" / "fy2026_capital_plan.csv",
              CAPITAL_PLAN_HEADER, cp_rows)

    # Funding authority
    fa_rows: list[list] = []
    for r in cfg["funding_authority"]:
        fa_rows.append([
            f"funding-authority:{prefix}:{r[0]}",
            *r[1:],
        ])
    write_csv(base / "04_it_financials" / "funding_authority_matrix.csv",
              FUNDING_AUTHORITY_HEADER, fa_rows)


if __name__ == "__main__":
    print("Tenant functional data files:")
    for key in TENANTS:
        print(f"\n  [{key}]")
        emit_for_tenant(key)
