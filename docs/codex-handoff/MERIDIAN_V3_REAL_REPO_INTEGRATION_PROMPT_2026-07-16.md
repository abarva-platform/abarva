# Meridian V3 Real-Repo Integration — Corrected Prompt v2 (2026-07-16)

**Supersedes [MERIDIAN_V3_SYNTHETIC_DATA_RESET_PROMPT_2026-07-16.md](MERIDIAN_V3_SYNTHETIC_DATA_RESET_PROMPT_2026-07-16.md) for execution.**
That v1 prompt was correct in its diagnosis but was handed to an agent that ran
it in the wrong place: it produced a standalone zip
(`meridian-v3-source-reset-20260716.zip`) at a path that doesn't exist in this
repo (`datasets/tenant-inputs/active/meridian-health/current/`), reported
"passed" on 9 audit script names that don't exist in `package.json`, wholesale
**replaced** rather than extended 08/09/10 (dropping 223/237/237 existing
rows down to 26/11/6), and created a second, competing SA07 interview file
instead of reconciling into the real one. Nothing from that run touched this
repo — `git status` and `find` confirm zero related changes landed.

**Verification correction:** the real SA07 file
(`datasets/tenant-inputs/meridian-health/interviews/executive_interviews.csv`)
has **216 data rows** across **18** stakeholder groups (12 questions each,
not 217/16 as earlier stated) — confirmed by direct CSV parse. Minor, but
noted for accuracy.

**What's still good and worth reusing:** the financial modeling in that zip
(the $650M/$487.5M/$162.5M reconciliation, the AI-spend tagging as
non-additive allocations, the 09/10 schema split, the Member Service AI
Assist candidate framing) is well-designed and matches the target model —
only the execution path (replace vs. extend, wrong location, duplicate SA07)
was wrong. Use it as **reference content only**, per the hard rules below.

---

## PART 1 — Paste this to Codex

```
CODENAME: MERIDIAN-V3-REAL-REPO-INTEGRATION-PRESERVE-ROWS

Goal:
Integrate the useful Meridian finance/program/use-case/interview improvements
into the real repo source files, preserving existing rows and
extending/reclassifying them. Do not replace the real files with the
generated ZIP output.

This is a real-repo integration pass, not a fresh rebuild.

Important context:
A prior generated bundle (meridian-v3-source-reset-20260716.zip) had good
content ideas but was created in the wrong location, dropped existing rows,
duplicated SA07, and reported audits that do not exist in this repo. Do not
trust its completion report. Use it only as reference material.

Real canonical path:
datasets/tenant-inputs/meridian-health/standard-2026-07-v3/

Do not write to:
datasets/tenant-inputs/active/meridian-health/current/
unless that path already exists in this repo and is part of the current real
data structure. (It does not, as of 2026-07-16.)

Hard rules:
- Do not delete existing source rows.
- Do not wholesale replace existing files.
- Preserve existing record IDs where possible.
- PRESERVING A ROW IS NOT THE SAME AS PRESERVING ITS STATUS. "Preserve" means
  keep the row's identity, evidence lineage, and narrative content. It does
  NOT mean a row may keep (or be assigned) initiative_status=active/approved
  or funding_status=approved unless it has a non-empty
  linked_budget_record_ids or linked_sa02_records that reconciles into the
  $650M/$487.5M/$162.5M totals. A row cannot be both "active"/"approved" and
  financially unaccounted for — that is not a preserved row, it's a false
  financial claim. If a row has no reconciling budget/SA02 link, its status
  MUST be downgraded to candidate/proposed/not_approved/unknown (with a
  caveat explaining why) — the row stays, the false status does not. This
  applies identically to the 237 legacy rows and to any new row you add;
  never fabricate a budget link just to justify keeping an existing active
  label.
- Add new columns where needed.
- Backfill new columns for existing rows.
- Reclassify existing rows into the improved schema.
- Add new rows only where the existing file lacks the required source fact.
- Do not create a second competing SA07 interview file.
- Reconcile any useful new interview material into the existing SA07 file.
- Do not regenerate universal XLSX templates in this PR.
- Do not invent audit script names.
- Use only scripts that exist in package.json, or add clearly scoped scripts
  if absolutely necessary.
- Do not mutate Azure/Postgres.
- Do not load derived v3 layers.
- Do not promote candidate data.
- Do not deploy.

Reference material:
The generated ZIP (meridian-v3-source-reset-20260716.zip, if you have access
to it — otherwise treat this prompt's Phase 1-7 content specs as the source
of truth directly) may be used only as a content reference for:
- the $650M / $487.5M / $162.5M budget posture
- the 09/10 schema split logic
- AI spend tagging logic
- the distinction between approved programs, proposed initiatives, candidate
  AI use cases, and interviews
- possible new interview rows, only if deduplicated and merged into existing
  SA07

Do not copy its file replacement behavior.

Current real repo facts to preserve (verified 2026-07-16):
- 08_it_budget_spend_value.csv currently has 223 data rows.
- 09_programs_initiatives.csv currently has 237 data rows.
- 10_ai_automation_use_cases.csv currently has 237 data rows (content-
  identical to 09's business_name set today — that duplication is exactly
  what this integration must resolve via new status columns, not deletion).
- Existing SA07 interviews
  (datasets/tenant-inputs/meridian-health/interviews/executive_interviews.csv)
  have 216 rows across 18 stakeholder groups and already pass
  `npm run audit:meridian-executive-interviews`
  (scripts/tenant-v6/audit-meridian-executive-interviews.mjs). It currently has
  ZERO mentions of "AI Assist" or candidate/not-funded framing — that is the
  real gap to fill, not row count.
- The prior generated bundle reduced 08/09/10 drastically (26/11/6 rows);
  that must not happen here.

Required integration decisions:

1. 08_it_budget_spend_value.csv
Goal: add Tower-grade financial facts without deleting existing 223 rows.
- Preserve all existing rows as-is.
- Add required finance/Tower columns if missing: financial_fact_type,
  fiscal_year, time_period, budget_amount_usd, approved_budget_usd,
  actual_spend_ytd_usd, forecast_spend_usd, run_budget_usd, change_budget_usd,
  planned_value_usd, target_value_usd, amount_basis, gross_or_net,
  additive_status, budget_row_level, finance_attestation_status,
  program_code, initiative_id, ai_spend_flag, ai_spend_type,
  ai_spend_category, platform_embedded_ai_flag, vendor_name, system_name,
  source_adapter_reference, tower_usage, tower_hero_eligible, caveat.
  (realized_value_usd already exists in the real file — reuse it, don't
  duplicate.)
- Backfill existing 223 rows conservatively: they are narrative value-
  hypothesis rows, not financial facts. Mark them clearly (e.g.
  budget_row_level = narrative_not_budget_fact, additive_status =
  excluded_from_budget_rollup, finance_attestation_status =
  not_applicable_narrative_row, tower_hero_eligible = false) rather than
  inventing numbers for them.
- Add new budget control/category/allocation rows using this posture:
  FY26 total technology spend: $650,000,000
  Run/operate (75%): $487,500,000
    Applications run/support: $132,500,000; Infrastructure/cloud/network/
    data-center: $102,500,000; Managed services/outsourcing: $125,000,000;
    Cybersecurity/IAM/privacy: $52,500,000; Data/analytics/reporting run:
    $37,500,000; End-user/workplace/service desk: $37,500,000.
  Change/transformation (25%): $162,500,000
    Data foundation/lakehouse: $42,500,000; Integration/API modernization:
    $28,000,000; Cyber/identity/PHI uplift: $24,000,000; EHR/clinical
    analytics: $22,000,000; Contact center platform/knowledge: $16,000,000;
    Cloud cost governance/FinOps: $10,000,000; Enterprise data product
    operating model: $12,000,000; AI governance/model risk: $8,000,000.
  AI-related spend (~$49.8M) is tagged inside the above rows via
  ai_spend_flag/ai_spend_type/ai_spend_category/platform_embedded_ai_flag —
  it is a non-additive VIEW, never a separate budget line, and raw
  SUM(budget_amount_usd) across all 08 rows must never be interpreted as
  total spend (mark control/subtotal/category/allocation-view rows so a
  consumer can filter correctly).

2. SA02 finance adapter
- No SA02 file exists yet at the real standard-v3 path — create
  datasets/tenant-inputs/meridian-health/standard-2026-07-v3/SA02_IT_Finance_Budget_Spend_Extract.csv
  fresh (nothing to preserve here).
  Do not invent a separate active/current path.
- Columns: tenant_key, source_record_id, fiscal_year, period, source_system,
  cost_center, account_gl_code, spend_category, it_tower_category,
  business_unit, program_code, initiative_id, vendor_name, system_name,
  run_change_flag, budget_amount_usd, actual_spend_usd, forecast_spend_usd,
  committed_spend_usd, invoice_amount_usd, variance_usd, ai_spend_flag,
  ai_spend_type, ai_spend_category, platform_embedded_ai_flag, finance_owner,
  evidence_id, confidence, active_candidate_status, notes.
- Reconcile to $650M total / $487.5M run / $162.5M change. Use a consistent
  period (e.g. FY26-Q2-YTD) with plausible partial-year actuals — actual
  must not equal full-year budget. No realized-value claims.

3. 09_programs_initiatives.csv
Goal: make 09 genuinely about funded/proposed programs, not a duplicate of
10, while preserving the existing 237 rows.
- Preserve all existing rows.
- Add columns if missing: initiative_status, funding_status,
  approved_funding_usd, requested_funding_usd, forecast_spend_usd,
  actual_spend_ytd_usd, planned_value_usd, target_value_usd,
  realized_value_usd, value_claim_status, executive_owner, finance_owner,
  tower_measurement_ready, program_code, initiative_id,
  linked_budget_record_ids, linked_sa02_records, ai_spend_flag,
  ai_spend_type, ai_spend_category, additive_status, caveat.
- Reclassify existing rows without deleting: these 237 narrative rows are not
  structured funded programs today and have no budget/SA02 link. Per the
  reconciliation hard rule above, that means initiative_status=candidate (or
  proposed) and funding_status=not_approved/unknown for essentially all of
  them — none may be marked active/approved unless you also give them a real
  linked_budget_record_ids/linked_sa02_records tie, which for the legacy rows
  you should not fabricate. Mark a caveat pointing to the newly added real
  program rows.
- Add new curated program rows (Data Foundation/Lakehouse Modernization,
  Integration/API Modernization, Cyber/Identity/PHI Uplift, EHR/Clinical
  Analytics Modernization, Contact Center Platform/Knowledge Modernization,
  Cloud Cost Governance/FinOps, Enterprise Data Product Operating Model, AI
  Governance/Model Risk Controls, Managed Services Optimization, Microsoft
  365 Copilot Productivity Enablement, and a Member Service AI Assist
  CANDIDATE row with funding_status=not_approved/approved_funding_usd=0).
  Every approved/active new row must tie to at least one 08 or SA02 row via
  linked_budget_record_ids/linked_sa02_records.
- AI Assist must not become an approved funded program anywhere in this file.

4. 10_ai_automation_use_cases.csv
Goal: make 10 the true AI/automation candidate-opportunity file, while
preserving the existing 237 rows.
- Preserve existing rows; add columns if missing: use_case_status,
  related_move, business_problem, affected_process, required_data_domains,
  readiness_status, funding_status, measurement_status, risk_control_status,
  evidence_needed, tower_tracking_status, expected_decision_path,
  linked_program_code, linked_initiative_id, linked_budget_record_ids,
  embedded_platform_source, ai_spend_flag, ai_spend_type, ai_spend_category,
  caveat.
- Reclassify existing 237 rows conservatively (use_case_status=candidate,
  funding_status=not_approved) with a caveat pointing to the new curated
  rows below — do not claim any legacy narrative row is a real AI use case.
- Add new curated use-case rows: Member Service AI Assist (use_case_status=
  discovery, funding_status=not_approved, measurement_status=
  baseline_required, tower_tracking_status=opportunity_only,
  risk_control_status=PHI_controls_required, related_move="Member Service
  Agent Assist Transformation"), Contact Center Knowledge Assist, Claims/
  Eligibility Inquiry Assist, Clinical Operations Documentation Assist,
  Revenue Cycle Exception Triage (all candidate/not_approved), and Workforce
  Productivity/Policy Assist (approved_for_pilot, tied to the Copilot
  program row, embedded_platform_source=Microsoft 365 Copilot).
- No row may carry realized_value_usd or approved funding for a pure
  candidate use case.

5. 14_metrics_outcomes.csv
- Preserve existing rows. Add/backfill: baseline_available, actual_available,
  tower_claim_allowed, measurement_owner, measurement_cadence, source_system,
  evidence_id (if missing), caveat.
- tower_claim_allowed = false until baseline + actual + owner + evidence
  exist. Add new metric-definition rows for AI Assist/member service (AHT,
  FCR, transfer rate, ACW, CSAT, escalation rate, knowledge search time, PHI
  incident rate), data foundation (domain coverage, governed data products,
  lineage coverage, DQ pass rate, identity match rate), and Tower value
  realization (baseline availability, finance validation status, actuals
  availability, value-claim approval rate). No realized value.

6. 17_managed_services_scope.csv
- Preserve existing rows. Add/backfill: annual_contract_value_usd,
  run_spend_usd, change_order_spend_usd, invoice_amount_ytd_usd,
  service_credit_ytd_usd, vendor_name, service_tower, contract_id,
  fiscal_year, tower_usage, caveat. Tie into 08/SA02 where the managed-
  services vendors overlap (Deloitte/Accenture/Infosys/Cognizant against the
  $125M managed-services run category). No savings/realized value unless
  evidenced.

7. SA07 Executive Interview Insights
Goal: do not create a duplicate SA07. Reconcile new material into the
existing 216-row file at
datasets/tenant-inputs/meridian-health/interviews/executive_interviews.csv.
- Preserve the existing 216 rows exactly.
- Add a budget_or_value_mentioned column if missing (it is currently absent
  from the real file's 27-column schema even though other target columns
  already exist).
- The real gap is content, not row count: today's 216 rows have zero
  mentions of "AI Assist" or candidate/not-funded framing. Add a modest,
  targeted set of net-new rows (aim for the file staying well under ~250
  total, not appending all of a prior reference bundle wholesale) into the
  CFO, CIO, CISO, Chief Experience Officer/Member Experience, and Contact
  Center groups specifically reinforcing: AI Assist is candidate/discovery
  and not funded; data foundation is a prerequisite; CFO requires baselines
  and actuals before value claims; CISO/privacy require PHI controls, HITL,
  and audit logging before any pilot.
- Use fresh interview_id/question_id values that do not collide with the
  existing MER-INT-*/Q* sequence.
- Do not replace the existing file. Keep `npm run audit:meridian-executive-interviews`
  (scripts/tenant-v6/audit-meridian-executive-interviews.mjs) passing.

8. Program-budget-AI reconciliation
- First inspect package.json and identify existing scripts. At minimum use:
  npm run audit:tenant-v3-data
  npm run audit:meridian-executive-interviews
- If additional scripts are needed, add them deliberately as real
  package.json entries — do not report a script as passed unless it exists
  and was actually run. Suggested real additions:
  npm run audit:meridian-program-budget-ai-reconciliation
  npm run audit:meridian-ai-assist-boundary
  npm run audit:meridian-budget-rollup-safety
- Checks these audits must cover: 08 control-total row = $650M with run =
  $487.5M and change = $162.5M; additive category rows reconcile to the
  totals when filtered by budget_row_level; AI-related spend is non-additive
  and never summed into total spend; ZERO rows anywhere in 09 (or 10) have
  initiative_status=active/approved (or funding_status=approved) with an
  empty linked_budget_record_ids and linked_sa02_records — a caveat does
  NOT substitute for a real link; a row failing this must be downgraded to
  candidate/not_approved, not merely caveated while staying "active"; every
  AI-tagged spend row ties to SA02 and/or 08; every 10 use case has a
  funding boundary; AI
  Assist is never funded, never an approved program, never has realized
  value; embedded AI spend (Copilot/ServiceNow/etc.) is never counted as AI
  Assist funding; no old $1.1B/$1.7B figures reappear; all new evidence_id
  values resolve in 13_evidence_sources.csv.

9. Reports
Create in the real repo (not a zip):
reports/meridian-v3-real-repo-integration/summary.md
reports/meridian-v3-real-repo-integration/file-diff-summary.csv
reports/meridian-v3-real-repo-integration/row-preservation-report.csv
reports/meridian-v3-real-repo-integration/budget-reconciliation.csv
reports/meridian-v3-real-repo-integration/program-budget-ai-reconciliation.csv
reports/meridian-v3-real-repo-integration/ai-assist-boundary-audit.csv
reports/meridian-v3-real-repo-integration/sa07-merge-report.csv
reports/meridian-v3-real-repo-integration/evidence-resolution.csv
reports/meridian-v3-real-repo-integration/proof.html
The row-preservation report must show, per file: old row count, new row
count, rows preserved, rows added, rows removed, rows reclassified, rows
status-downgraded for lacking a budget/SA02 reconciliation link, reason.
Rows removed should be zero unless explicitly justified and approved. Rows
status-downgraded should be non-zero for 09/10 (see the reconciliation hard
rule) — a zero here is a signal the reconciliation check wasn't actually run.

10. Governance
This directory (datasets/tenant-inputs/meridian-health/) is currently
ungated — the existing manifest
docs/governance/dataset-manifests/meridian-health-v6-v7-current-state-v1.json
explicitly disclaims covering it. Per
docs/governance/NEW_DATASET_ONBOARDING_POLICY.md, add a new manifest
docs/governance/dataset-manifests/meridian-health-tenant-inputs-standard-v3.json
(copy DATASET_POLICY_MANIFEST_TEMPLATE.json; client_key=meridian-health;
classification=confidential) covering standard-2026-07-v3/ and interviews/.
Leave approved_by/approved_at blank — that is a human sign-off step.

11. Validation
Run only real scripts. If new scripts are added, they must be present in
package.json before being cited as passed.
Required:
  npm run audit:tenant-v3-data -- --tenant meridian-health
  npm run audit:meridian-executive-interviews
  npm run audit:meridian-program-budget-ai-reconciliation
  npm run audit:meridian-ai-assist-boundary
  npm run audit:meridian-budget-rollup-safety
  npm run validate:context-corpus:manifests
  npm run audit:enterprise-naming
  npm run release:check
  git diff --check
If any script is missing, do not report it as passed. Either add it as part
of this PR or omit it from the report.

Definition of done:
The real repo's Meridian v3 source files are extended, not replaced.
Existing rows are preserved (zero unexplained removals). Budget/program/use-
case/interview logic is corrected in place. AI Assist is candidate/discovery
only. Programs tie to budget/spend. AI spend is tracked across embedded
platforms, programs, and candidate opportunities without double-counting.
The output is a normal PR against this repo, ready for human review before
any derived v3 layer build or load — not a zip, not a runtime change.
```

---

## PART 2 — Go-ahead for Codex

```
Yes — integrate the good content into the real files, preserving existing
rows and reconciling SA07. Do not use the ZIP as a replacement bundle.
Treat this as a source-integration PR against this repo, not a runtime or
derived-layer PR. Open it as a normal PR (this repo requires PR + squash
merge on main, no direct pushes) and report only audits that actually ran.
```
