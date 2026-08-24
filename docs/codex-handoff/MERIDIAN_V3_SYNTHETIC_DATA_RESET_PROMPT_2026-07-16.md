# Meridian V3 Synthetic Data Reset — Corrected Codex Prompt (2026-07-16)

> **DO NOT EXECUTE.** Superseded by
> [MERIDIAN_V3_REAL_REPO_INTEGRATION_PROMPT_2026-07-16.md](MERIDIAN_V3_REAL_REPO_INTEGRATION_PROMPT_2026-07-16.md).
> This v1 doc is kept for its diagnosis/history only. It also contains a
> stale fact (SA07 row count below is off by one) that the v2 doc corrects —
> use v2 for anything execution-related.

**This replaces the earlier "MERIDIAN-V3-SYNTHETIC-DATA-AND-INTERVIEW-GENERATION-RESET" draft.**
That draft assumed a schema, output path, and SA07 status that do not match what is
actually on disk. Everything below was verified against the live repo on 2026-07-16
before writing this prompt — file paths, row counts, and column headers are quoted,
not assumed. Do not resurrect the old draft's path or schema.

---

## PART 1 — Paste this to Codex

```
GOAL
Extend Meridian's real, current-state v3 tenant-input dataset with Tower-grade
budget/spend/program-funding rules and a source-adapter layer, WITHOUT breaking
what already exists and already passes audit. This is source-data-only work.

Do not load v3/v6/v7 derived layers. Do not mutate Azure/Postgres. Do not
promote candidate data. Do not deploy. Do not update live runtime. We will
review and approve the generated/edited source files before any load or
derived-layer build.

GROUND TRUTH — VERIFIED ON DISK, DO NOT ASSUME OTHERWISE
1. The canonical Meridian v3 tenant-input directory is
   datasets/tenant-inputs/meridian-health/standard-2026-07-v3/
   — NOT datasets/tenant-inputs/active/meridian-health/current/. The real path is
   enforced by scripts/tenant-v6/audit-tenant-v3-inputs.mjs:65-66
   (`path.join(repoRoot, "datasets/tenant-inputs", tenantKey, "standard-2026-07-v3")`).
   Any output written elsewhere will not be picked up by the existing audit or
   any downstream loader.

2. It currently holds 19 core dimension CSVs (00 through 18). All 19 share a
   common boilerplate column set:
   tenant_key, record_id, entity_id, business_name, context_item, dimension,
   evidence_id, active_candidate_status, confidence, source_type, source_basis,
   synthetic_data_flag, evidence_boundary, module_usage_notes
   plus a small number of dimension-specific free-text columns (e.g. 08 adds
   value_hypothesis, amount_usd, realized_value_usd, value_boundary; 09/10 add
   use_case, data_domain, systems, value_hypothesis, evidence_needed).
   `active_candidate_status` today only takes two values: candidate, active.
   This is a narrative "value hypothesis" model, not a structured financial-fact
   model. You are EXTENDING this schema by adding new required columns to the
   existing 19 files — you are not replacing the boilerplate columns and you
   are not inventing a new directory structure.

3. Zero of the 7 proposed source-adapter files (SA01–SA07) exist as separate
   adapter CSVs under standard-2026-07-v3/. Confirmed directly: exporting the
   current tenant bundle produces a MANIFEST.txt stating "Requested source
   adapter files not found in repo or Downloads... NOT included: 7" for
   SA01–SA07.

4. SA07 already effectively exists — DO NOT CREATE A NEW FILE FOR IT.
   datasets/tenant-inputs/meridian-health/interviews/executive_interviews.csv
   already has 216 rows (within the 140–220 target range) across a 28-column
   schema (tenant_key, interview_id, interview_group, executive_area,
   stakeholder_role, question_id, question, synthetic_answer, priority_theme,
   business_priority, pain_point, known_challenge, key_initiative,
   initiative_link, system_or_vendor_mentioned, data_domain_mentioned,
   metric_mentioned, risk_or_control_mentioned, evidence_needed,
   decision_supported, confidence, source_type, source_adapter_id,
   source_adapter_name, interview_date, active_candidate_status, evidence_id,
   module_usage_notes). It is already labeled internally as the SA07 source
   adapter and already has a dedicated audit:
   scripts/tenant-v6/audit-meridian-executive-interviews.mjs. Your job on SA07
   is a GAP-FILL / RECONCILIATION pass on this existing file — add missing
   interview groups, tighten AI-Assist-is-candidate-not-funded framing, keep
   the existing schema and source_adapter_id/source_adapter_name convention —
   not a new SA07 CSV in a new location.

5. CONFIRMED CRITICAL BUG: 08_it_budget_spend_value.csv has 223 data rows and
   ALL 223 have amount_usd = "not_provided" and realized_value_usd =
   "not_provided". Zero rows carry a dollar figure. This is more severe than
   "allows TBD" — there is currently no budget number anywhere in Meridian's
   source data.

6. CONFIRMED CRITICAL BUG: 09_programs_initiatives.csv and
   10_ai_automation_use_cases.csv are content-duplicates of each other — same
   147 unique business_name entities, same row count (237), same status
   vocabulary. There is currently no data-level distinction between an
   approved/funded program and a candidate AI use case; the same rows are
   filed under both dimension names. Do not just add new columns on top of
   this duplication — you must split the two files so each row lives in
   exactly one of them (see Phase 5/6 below), or the AI-Assist funding
   boundary problem cannot be fixed no matter what columns you add.

7. No legacy $1.1B / $1.7B figures remain anywhere in the current 19 files —
   confirmed by full-text search. Do not reintroduce them.

8. Governance: the existing manifest
   docs/governance/dataset-manifests/meridian-health-v6-v7-current-state-v1.json
   explicitly states in its `notes` field: "It does not cover older Meridian
   packs or the local Downloads demo bundle." That means
   datasets/tenant-inputs/meridian-health/ (standard-2026-07-v3/, interviews/,
   and the new adapters/ directory below) is currently UNGATED by any
   manifest. Peer tenants do this correctly — see
   docs/governance/dataset-manifests/first-capital-financial-v3-v7-context-v1.json
   and skyharbor-air-v3-v7-context-v1.json, whose `notes` fields explicitly
   name "plus tenant-inputs/<tenant> standard-2026-07-v3". Per
   docs/governance/NEW_DATASET_ONBOARDING_POLICY.md, a dataset must have a
   passing manifest BEFORE it loads — Phase 9 below has you create one.

9. Existing audits you must keep passing, not duplicate:
   - npm run audit:tenant-v3-data  (scripts/tenant-v6/audit-tenant-v3-inputs.mjs)
   - npm run audit:meridian-executive-interviews
     (scripts/tenant-v6/audit-meridian-executive-interviews.mjs)
   Do not invent 7-8 parallel audit script names that nothing will ever run.
   New checks (budget reconciliation, no-duplicate-09-10, AI-Assist funding
   boundary, adapter evidence resolution) get added as new checks WITHIN these
   two scripts, or as one new script
   scripts/tenant-v6/audit-tenant-v3-finance-ai-boundary.mjs wired to a new
   `audit:tenant-v3-finance-ai-boundary` npm script — not eight new names.

HARD RULES (unchanged from prior guidance)
- Do not invent approved AI Assist funding.
- Do not treat AI Assist as an approved/funded program.
- Do not create realized value for AI Assist.
- Do not use old $1.1B technology budget or $1.7B planned value (none present —
  keep it that way).
- Do not treat static src/data/meridian.ts values as Tower source truth.
- Do not leave required financial amount fields as "not_provided" or blank.
- Do not invent the budget taxonomy from general model knowledge — use PHASE 2
  below exactly.
- Preserve every existing row's evidence_id and boilerplate columns; you are
  adding columns and adding new rows, not deleting existing content, except
  for the 09/10 de-duplication in Phase 5/6 which is an explicit, scoped
  exception.

TARGET TENANT
tenant_key: meridian-health
Canonical directory: datasets/tenant-inputs/meridian-health/
  standard-2026-07-v3/   (19 core files — EXTEND schema + add budget rows)
  interviews/executive_interviews.csv   (SA07 — GAP-FILL, do not replace)
  adapters/   (NEW — SA01–SA06 only; 6 files, not 7)

PHASE 1 — Extend the 19 core CSV schemas (in place)
Add these columns to the existing files, preserving all existing rows and
existing columns exactly as-is:

08_it_budget_spend_value.csv — add:
  financial_fact_type, fiscal_year, budget_amount_usd, approved_budget_usd,
  actual_spend_ytd_usd, forecast_spend_usd, run_budget_usd, change_budget_usd,
  planned_value_usd, target_value_usd, amount_basis, gross_or_net,
  additive_status, finance_attestation_status, business_owner, finance_owner,
  source_system, source_adapter_reference, tower_usage, tower_hero_eligible,
  ai_spend_flag, ai_spend_type, ai_spend_category, program_code, initiative_id,
  vendor_name, system_name, funding_status, run_change_flag,
  tower_tracking_status, caveat
  (keep existing amount_usd/realized_value_usd/value_boundary columns as-is;
  the new budget_amount_usd etc. are the Tower-grade fields — do not just
  rename the old ones)

09_programs_initiatives.csv — add:
  initiative_status, funding_status, approved_funding_usd,
  requested_funding_usd, forecast_spend_usd, actual_spend_ytd_usd,
  planned_value_usd, target_value_usd, realized_value_usd,
  value_claim_status, executive_owner, finance_owner,
  tower_measurement_ready, additive_status, program_code, initiative_id,
  linked_budget_record_ids, linked_sa02_records, ai_spend_flag, ai_spend_type,
  caveat

10_ai_automation_use_cases.csv — add:
  use_case_status, related_move, business_problem, affected_process,
  required_data_domains, readiness_status, funding_status,
  measurement_status, risk_control_status, tower_tracking_status,
  expected_decision_path, linked_program_code, linked_initiative_id,
  linked_budget_record_ids, embedded_platform_source, caveat

14_metrics_outcomes.csv — add:
  metric_name, metric_type, baseline_value, target_value, actual_value, unit,
  fiscal_year, measurement_period, measurement_owner, source_system,
  measurement_cadence, baseline_available, actual_available,
  tower_claim_allowed, caveat

17_managed_services_scope.csv — add:
  annual_contract_value_usd, run_spend_usd, change_order_spend_usd,
  invoice_amount_ytd_usd, service_credit_ytd_usd, vendor_name, service_tower,
  contract_id, fiscal_year, tower_usage, caveat

Allowed values:
  financial_fact_type: total_technology_spend, run_opex_spend,
    change_transformation_spend, applications_run_support,
    infrastructure_cloud_network, managed_services_outsourcing,
    cybersecurity_iam_privacy, data_analytics_reporting_run,
    end_user_workplace_service_desk, digital_member_customer_platforms,
    program_funding, forecast_spend, actual_spend, planned_value,
    target_value, vendor_spend
  finance_attestation_status: synthetic_planning_assumption,
    finance_review_required, source_extract_reconciled
    (never finance_attested unless a corresponding SA02 finance-approval
    evidence row exists)
  funding_status: approved, requested, not_approved, unknown
  initiative_status: approved, active, proposed, candidate, retired
  use_case_status: candidate, discovery, approved_for_pilot, active_pilot,
    scaled
  ai_spend_type: none, embedded_platform_ai, approved_ai_program,
    ai_enablement_foundation, ai_governance_controls,
    candidate_ai_opportunity, ai_run_operations
  ai_spend_category: not_ai, copilot_productivity, servicenow_ai, erp_ai,
    crm_contact_center_ai, cloud_ai_services, data_ai_platform, clinical_ai,
    claims_ai, cyber_ai, ai_governance, ai_training_change

Rule: no required amount field may be "not_provided" or blank once you finish
Phase 3.

PHASE 2 — Meridian healthcare IT budget model (use exactly this; do not invent)
FY26 total technology spend: $650,000,000
Run/operate (75%): $487,500,000
  - Applications run/support: $132,500,000
  - Infrastructure/cloud/network/data-center run: $102,500,000
  - Managed services/outsourcing run: $125,000,000
  - Cybersecurity/IAM/privacy/security ops: $52,500,000
  - Data/analytics/reporting run: $37,500,000
  - End-user/workplace/service desk: $37,500,000
Change/transformation (25%): $162,500,000
  - Data foundation/lakehouse modernization: $42,500,000
  - Integration/API modernization: $28,000,000
  - Cybersecurity/identity/PHI control uplift: $24,000,000
  - EHR/clinical analytics modernization: $22,000,000
  - Contact center platform/knowledge modernization: $16,000,000
  - Cloud cost governance/FinOps: $10,000,000
  - Enterprise data product operating model: $12,000,000
  - AI governance/model risk controls: $8,000,000
AI-related spend view (subset of the above, tagged not added):
  $35M–$55M across Copilot/productivity AI, ServiceNow AI, Databricks/data-AI
  platform, cloud AI services, AI governance, contact-center AI-enabling work,
  AI training/change. Tag with ai_spend_flag/ai_spend_type/ai_spend_category —
  do not create new budget lines for this; it is a lens on Phase 2's numbers.
AI Assist (Member Service AI Assist) gets ZERO of this budget. It is a
candidate opportunity, not a funded line item.

PHASE 3 — Populate 08_it_budget_spend_value.csv with real numbers
Add new rows (do not touch the 223 existing narrative rows) carrying the
Phase 2 figures: total spend, run total, change total, each of the 6 run
categories, each of the 8 change categories. Every new row:
  - fiscal_year = FY26
  - finance_attestation_status per the allowed values above
  - evidence_id resolving in 13_evidence_sources.csv (add matching evidence
    rows there — evidence_type = synthetic_finance_extract)
  - tower_hero_eligible = true only for total/run/change totals, false for
    category-level and planned-value rows
  - realized_value_usd blank/0 unless real evidence exists (it doesn't yet)

PHASE 4 — Create SA01–SA06 (6 files, NOT 7) under a new adapters/ directory
datasets/tenant-inputs/meridian-health/adapters/
  SA01_ServiceNow_CMDB_Extract.csv
  SA02_IT_Finance_Budget_Spend_Extract.csv
  SA03_Vendor_Contracts_Extract.csv
  SA04_Program_Portfolio_Extract.csv
  SA05_Cloud_Inventory_Extract.csv
  SA06_Incident_Problem_Change_Extract.csv
SA02 must reconcile line-by-line to the Phase 3 totals in 08 ($650M total /
$487.5M run / $162.5M change). Use a consistent period (e.g. FY26-Q2-YTD) and
plausible partial-year actuals — do not set actual = full budget. SA04 must
carry program_code/initiative_id values that Phase 5's 09 rows can link to via
linked_sa02_records / linked_budget_record_ids.

PHASE 5 — Split 09_programs_initiatives.csv from its duplicate content
Today 09 and 10 share the same 147 entities. Re-partition:
  - 09 keeps only entities that are real enterprise programs: Data
    Foundation/Lakehouse Modernization, Integration/API Modernization,
    Cybersecurity/Identity/PHI Control Uplift, EHR/Clinical Analytics
    Modernization, Contact Center Platform/Knowledge Modernization, Cloud Cost
    Governance/FinOps, Enterprise Data Product Operating Model, AI
    Governance/Model Risk Controls, Managed Services Optimization — each with
    initiative_status/funding_status set from Phase 2/4 and
    linked_budget_record_ids / linked_sa02_records populated.
  - Every row you keep in 09 with initiative_status = approved/active MUST tie
    to at least one 08 or SA02 row (linked_budget_record_ids /
    linked_sa02_records non-empty).
  - Remove from 09 any row that is really a candidate/discovery idea — it
    belongs only in 10.

PHASE 6 — Rebuild 10_ai_automation_use_cases.csv as true candidates
Keep only genuine AI/automation candidate opportunities. Add (these do not
exist in the data today — confirmed zero "AI Assist" mentions in 09 or 10):
  - Member Service AI Assist: use_case_status=discovery,
    funding_status=not_approved, measurement_status=baseline_required,
    tower_tracking_status=opportunity_only, readiness_status=
    data_foundation_required, risk_control_status=PHI_controls_required,
    related_move="Member Service Agent Assist Transformation",
    required_data_domains="CRM, claims, eligibility, benefits, knowledge base,
    call transcripts, contact center events, member identity"
  - Contact Center Knowledge Assist, Claims/Eligibility Inquiry Assist,
    Clinical Operations Documentation Assist (candidate), Revenue Cycle
    Exception Triage (candidate) — same funding boundary rules.
No row in 10 may have realized_value_usd or approved_funding_usd populated.

PHASE 7 — Extend 14_metrics_outcomes.csv
Add measurement definitions for AI Assist / member service (AHT, FCR,
transfer rate, ACW, CSAT, escalation rate, knowledge search time, PHI
incident rate), data foundation (domain coverage, governed data products,
lineage coverage, DQ pass rate, identity match rate), and Tower value
realization (baseline availability, finance validation status, actuals
availability, value-claim approval rate). tower_claim_allowed = false for any
AI Assist metric until baseline_available=yes AND actual_available=yes.

PHASE 8 — SA07 gap-fill (reconciliation, not creation)
Edit datasets/tenant-inputs/meridian-health/interviews/executive_interviews.csv
in place. Confirm/fill coverage across all 16 stakeholder groups (CEO, CFO,
CIO, CTO, CDAO, COO, Chief Experience/Member Service, Health Plan
Operations/Claims, Contact Center Ops, CISO, Privacy/Compliance/Legal,
Procurement, Enterprise Architecture, Program/Transformation Office, Clinical
Operations, HR/Workforce) with 8-12 questions each, staying within the
existing 28-column schema and existing source_adapter_id/source_adapter_name
values. Content must reinforce: AI Assist is candidate/not funded; data
foundation is a prerequisite; CFO requires baselines + actuals before value
claims; CISO/privacy require PHI controls, HITL, audit logging. Do not let
this file exceed ~220 rows or duplicate existing question_ids.

PHASE 9 — Governance manifest
Per docs/governance/NEW_DATASET_ONBOARDING_POLICY.md, create a NEW manifest
(the existing meridian-health-v6-v7-current-state-v1.json explicitly excludes
this directory — do not edit its scope) at:
  docs/governance/dataset-manifests/meridian-health-tenant-inputs-standard-v3.json
Copy docs/governance/DATASET_POLICY_MANIFEST_TEMPLATE.json, set client_key=
meridian-health, classification=confidential, source_basis=
user_provided_current_state_plus_synthetic_demo_structuring, and in `notes`
explicitly list all three covered paths: standard-2026-07-v3/, interviews/,
adapters/. Leave approved_by/approved_at blank — that is a human sign-off
step, not yours to fill.

PHASE 10 — Evidence and relationships
Every new/changed row in 08, 09, 10, 14, 17, and the new adapters must have an
evidence_id that resolves in 13_evidence_sources.csv. Update
12_relationships.csv so AI Assist depends-on data foundation / CRM / claims /
eligibility / knowledge base / contact center / PHI controls, and maps to a
Moves opportunity rather than a funded Tower program.

PHASE 11 — Audits (extend existing scripts, do not fork new ones)
Extend scripts/tenant-v6/audit-tenant-v3-inputs.mjs with checks for:
  - no required amount field is blank/not_provided in 08
  - total = run + change = $650M/$487.5M/$162.5M in both 08 and SA02
  - 09 and 10 have zero overlapping business_name/entity content
  - every approved/active 09 row has a non-empty linked_budget_record_ids or
    linked_sa02_records
  - AI Assist (and every use_case_status=candidate/discovery row) has
    funding_status=not_approved and no realized_value_usd
  - every evidence_id in 08/09/10/14/17/adapters resolves in
    13_evidence_sources.csv
Extend scripts/tenant-v6/audit-meridian-executive-interviews.mjs to confirm
row count stays in [140,220] and coverage spans all 16 groups.
Add ONE new script scripts/tenant-v6/audit-tenant-v3-finance-ai-boundary.mjs
(wired to `npm run audit:tenant-v3-finance-ai-boundary`) for the
program-budget-AI reconciliation and duplicate-detection checks above if they
don't fit cleanly in the existing scripts.

Run before declaring done:
  npm run audit:tenant-v3-data
  npm run audit:meridian-executive-interviews
  npm run audit:tenant-v3-finance-ai-boundary
  npm run validate:context-corpus:manifests
  npm run audit:enterprise-naming
  npm run release:check
  git diff --check

Required output: reports/meridian-v3-synthetic-data-reset-2026-07-16/summary.md
covering what changed per file, the budget reconciliation numbers, the 09/10
split result, and confirmation SA07 was edited in place (not duplicated).

DEFINITION OF DONE
The 19 core files are extended (not replaced) with Tower-grade columns. 08 has
real, reconciled FY26 dollar figures. 09 and 10 no longer share duplicate
content — 09 is funded/proposed programs tied to budget, 10 is true AI/
automation candidates. AI Assist exists in 10 as a candidate, not a funded
program, with zero realized value. SA01–SA06 exist under a new adapters/
directory and reconcile to 08. SA07 (the existing interviews file) is
gap-filled in place, not duplicated. A new governance manifest gates the
tenant-inputs/meridian-health directory. All listed audits pass. No v3/v6/v7
derived layer has been loaded and no runtime has been touched.
```

---

## PART 2 — What changed vs. the original draft, and why

| Original draft assumption                                            | What's actually true on disk                                                                                                                                                                                     | Source                                                 |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Output path `datasets/tenant-inputs/active/meridian-health/current/` | Real, audit-enforced path is `datasets/tenant-inputs/meridian-health/standard-2026-07-v3/`                                                                                                                       | `scripts/tenant-v6/audit-tenant-v3-inputs.mjs:65-66`   |
| 08 "allows TBD"                                                      | 08 has **zero** dollar figures in **all 223 rows** (`amount_usd`/`realized_value_usd` = `not_provided`)                                                                                                          | Verified via CSV parse of the 2026-07-16 export        |
| SA07 doesn't exist, needs 140-220 new rows generated                 | SA07 already exists as `interviews/executive_interviews.csv`, 216 rows, already audited by `audit-meridian-executive-interviews.mjs`, already labeled "Source adapter: SA07" internally                          | File + script inspection                               |
| 09/10 just need new status columns                                   | 09 and 10 are **content-duplicates** — same 147 entities in both files today                                                                                                                                     | Verified via set comparison of `business_name` columns |
| Propose 8 new audit script names                                     | `audit:tenant-v3-data` and `audit:meridian-executive-interviews` already exist and already validate this exact directory                                                                                         | `package.json` scripts + script source                 |
| No manifest gap called out                                           | `meridian-health-v6-v7-current-state-v1.json` explicitly disclaims covering this directory; peer tenants (first-capital, skyharbor-air) gate their v3 tenant-inputs in their manifest `notes` — Meridian doesn't | Manifest file contents, compared across tenants        |

Everything else from the original draft (the budget taxonomy in Phase 2, the
AI-Assist-is-candidate-not-funded principle, the AI-spend-tagging model) held
up and is preserved above — those weren't wrong, they just needed to be
grounded in the real file layout before Codex touches anything.
