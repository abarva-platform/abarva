# skyharbor-air ("Airline Demo") — Governed Load-Readiness Manifest

**Purpose of this document:** an inventory and checklist for an operator with real Azure
access who will eventually request and perform tenant-data promotion for `skyharbor-air`.
This document does not perform, request, or claim promotion. No Azure/Postgres write, no
`az` command of any kind (read-only or otherwise), and no live cloud mutation was executed
to produce it — it was built by reading repo files only.

Tenant key: `skyharbor-air`. AbarVa-facing display label: **Airline Demo**. Physical/source
label: SkyHarbor Air. Do not rename or alias the tenant key anywhere in the promotion path.

---

## 1. What needs to land in Azure Blob

Three file groups make up the full skyharbor-air input surface. All three are enumerated
here by actually listing what exists in the repo at the time this manifest was written —
none of the counts below are assumed from a template.

### 1a. Core dimension files — `datasets/tenant-inputs/active/skyharbor-air/current/`

This is the canonical input root per `datasets/tenant-inputs/tenant-input-registry.json`
(`canonicalInputRoot`). **This directory already contains 23 files** (not a hypothetical
21 — list them, don't assume), produced by a parallel effort. At the time of this check
they were already present with real row counts, i.e. this packet appears complete, not
in progress — but this was a file-existence and row-count check only, not a quality
re-audit; run the quality gate in §4 before treating it as promotion-ready.

| File | Rows |
| --- | ---: |
| `00_enterprise_profile.csv` | 2 |
| `01_business_functions.csv` | 24 |
| `02_org_ownership.csv` | 278 |
| `03_workforce_roles.csv` | 12 |
| `04_applications_systems.csv` | 613 |
| `05_data_assets_integrations.csv` | 570 |
| `06_infrastructure_platforms.csv` | 691 |
| `07_vendors_contracts.csv` | 71 |
| `08_spend_value.csv` | 186 |
| `09_programs_initiatives.csv` | 67 |
| `10_ai_automation_use_cases.csv` | 43 |
| `11_risks_controls.csv` | 28 |
| `12_relationships.csv` | 380 |
| `13_evidence_sources.csv` | 11 |
| `14_metrics_outcomes.csv` | 124 |
| `15_industry_context_patterns.csv` | 9 |
| `16_expert_lenses.csv` | 10 |
| `17_service_scope_managed_services.csv` | 3 |
| `18_operational_process_evidence.csv` | 410 |
| `SA08_AI_Benefits_Realization_Usage_Ledger.csv` | 8 |
| `SA09_AI_Tool_Usage_Feed.csv` | 8 |
| `SA10_AI_Value_Interview_Evidence.csv` | 8 |
| `SA11_AI_KPI_Operational_Outcome_Feed.csv` | 8 |

### 1b. Interview files — `datasets/tenant-inputs/skyharbor-air/interviews/`

Also being regenerated in parallel. **Present at time of check:**

| File | Rows / type |
| --- | --- |
| `executive_interviews.csv` | 216 rows |
| `interview_question_bank.csv` | 216 rows |
| `interview_coverage_matrix.csv` | 18 rows |
| `interview_guidance.md` | guidance doc, not row-based |
| `interview_data_dictionary.json` | schema doc, not row-based |

`interview_guidance.md` requires: "Use Airline Demo in AbarVa-facing pages," "Keep
SkyHarbor Air only as a physical/source label," "Treat unanswered or weak answers as
context gaps, not invented facts," and no claims of realized value / production use /
live customer or passenger evidence. Confirm the regenerated interview rows still satisfy
these rules before promotion — this was not re-verified as part of this task.

### 1c. AI Control Tower (T-family) — `tower-standardized-v1/skyharbor-air/ai-control-tower/`

This is the group finalized as part of this task (14 files, T00–T13). All are real,
non-boilerplate content as of this manifest:

| File | Rows | Notes |
| --- | ---: | --- |
| `T00_ai-investment-super-template.csv` | 26 | AI-only initiative subset of T01 (ai_native/ai_enabled only). Populated this task; was previously boilerplate-only. |
| `T01_initiative-registry.csv` | 30 | Full initiative register, 4 of 30 are non_ai. |
| `T02_project-milestones.csv` | 150 | |
| `T03_tool-usage-monthly.csv` | 144 | 12 real AI tools, correct AI-spend source of record. |
| `T04_agent-outcomes.csv` | 12 | |
| `T05_persona-productivity.csv` | 18 | |
| `T06_dora-delivery-metrics.csv` | 54 | |
| `T07_benefit-realization.csv` | 30 | |
| `T08_spend-contracts.csv` | 120 | TOTAL initiative delivery cost, never AI-specific — see §3. |
| `T09_risk-governance.csv` | 150 | |
| `T10_evidence-items.csv` | 80 | Evidence catalog; not linked to initiative_id (see known gaps below). |
| `T11_refresh-log.csv` | 9 | |
| `T12_derived-actions.csv` | 5 | One unresolved orphaned reference — see known gaps below. |
| `T13_model-ai-inventory.csv` | 64 | Confirmed content-quality issue, not fixed — see known gaps below. |

Plus `tower-standardized-v1/TEMPLATE_FIELD_GUIDE.csv` / `.md` (schema reference, not
tenant data — does not need to land in Blob as tenant content).

**Known gaps in the T-family, carried forward for the operator rather than fabricated:**

- `T00`/`T01` `evidence_id` is blank for all rows. `T10_evidence-items.csv` has 80 real
  evidence entries but its own `initiative_id` column is 100% blank, so there is no
  verified way to link a specific evidence item to a specific initiative without
  guessing. Left blank rather than invented.
- `T12_derived-actions.csv` row `SHA-ACT-004` references `SHA-VND-001` in its
  `derived_from` column. No such ID exists anywhere in the T-family (T08's line IDs are
  `SHA-SPEND-*`), and no IBM-named vendor line exists in T08 at all despite the parent
  initiative's blocker text being about "IBM Z coupling." Unresolved orphaned reference.
- `T13_model-ai-inventory.csv`: `model_name`/`domain` cycle through a fixed 8-slot
  rotation independent of `parent_initiative_id` (e.g. a row named "MRO reliability
  model" is parented to the Teradata data-platform initiative, not an MRO initiative),
  and `model_type`/`use_case`/`risk_tier`/`pii_phi_financial_data` are 100% blank (all
  four are populated in every peer tenant's T13). This needs regeneration, not a patch,
  and was intentionally left as-is rather than layering fabricated risk/PII data on top
  of a mismatched model↔initiative mapping. Flagged separately for follow-up.
- Several other files have columns that are 100% blank for skyharbor-air but populated
  in peer tenants (numeric/enum operational metrics such as DORA before/after figures,
  T05 cycle-time and quality percentages, T04 deflection/approval fields). These were
  **not** fabricated — filling numeric performance metrics with no grounding would be
  worse than leaving them blank per this repo's own governance stance (a blank is a
  reported gap; an invented number is not). Left for the business owners who actually
  hold that data to fill in.

---

## 2. Azure landing pattern (declared, not bound)

Per `datasets/tenant-inputs/tenant-input-registry.json` (`universalTemplateSet.azureLanding`)
and `datasets/tenant-inputs/README.md`:

```text
container:  tenant-inputs
raw:        tenant-inputs/{tenant_key}/{intake_id}/raw/
validated:  tenant-inputs/{tenant_key}/{intake_id}/validated/
archive:    tenant-inputs/archive/{tenant_key}/{intake_id}/
```

File naming pattern: `{tenant_key}__{template_name}__{as_of_yyyymmdd}__{source_owner}__r{revision}.csv`

For skyharbor-air, `{tenant_key}` = `skyharbor-air`. **`storageAccount` is literally the
string `"to-be-bound-by-environment"`** in the registry — this is not a placeholder I am
interpreting, it is the actual configured value. No storage account, connection string,
or credential is bound in this repo. **An operator with real Azure access must resolve
the storage account binding for the target environment before any upload can occur.**
`{intake_id}` is also not yet assigned for a skyharbor-air promotion run; it will be
generated at intake time by whatever process kicks off the real promotion.

---

## 3. AI-spend-tagging discipline (verify before quoting any spend figure)

Confirmed still holding at the raw-data level for skyharbor-air, per the rule fixed in
commit `c4e07b93c` and restated in AGENTS.md:

- `T08_spend-contracts.csv` `spend_category` enum is exactly `{labor, vendor_license,
  cloud_infra, si_services}` across all 120 rows — never an AI-spend label. It sums to
  **$1.031B** across all 30 initiatives (AI and non-AI) — this is total initiative
  delivery cost, not AI spend.
- `T03_tool-usage-monthly.csv` `cost_usd` is the correct AI-tool-spend source of record:
  **$11.9M** across 12 real tools (AWS Bedrock, Adobe Sensei/Firefly, Claude Code, Codex,
  Cursor, GitHub Copilot, M365 Copilot, SAP Joule, SAS Viya AI, Salesforce Einstein,
  ServiceNow Now Assist, Teradata Vantage AI) and 144 monthly rows.
- No T08 row asserts an AI-only figure, and no T03 row duplicates a T08 line. No
  double-counting found between the two files.

Note for the operator: `scripts/tower/fact-lineage-report.mjs`'s own
`ai_initiative_funding_usd` metric currently sums T08's full $1.031B and labels it "AI
initiative funding" in its report output — this mislabeling is in the shared reporting
script, not in the tenant data itself, and is being tracked separately (not something to
fix by editing skyharbor-air's data). Do not quote that particular report line as an
AI-specific figure until the script is corrected.

---

## 4. Existing guarded-loader status

`reports/skyharbor-air-data-factory/summary.md` (generated by
`scripts/knowledge/fs-airline-azure-candidate-load.mjs`) shows:

```
Final status: BLOCKED_BEFORE_PROMOTION
```

- Azure/Postgres write execution remains blocked by the existing guarded loader.
- **Active promotion has never been requested or performed for skyharbor-air.** This
  manifest is preparation for that eventual request — it is not the request itself, and
  nothing in this task triggered, ran, or scheduled a promotion.
- Signed-in page/API read-back from the data plane is not claimed anywhere in this repo
  for skyharbor-air.

---

## 5. Operator checklist for the real promotion

To be worked through by someone with actual Azure access, in roughly this order:

1. **Confirm storage account binding.** Resolve `storageAccount` from
   `"to-be-bound-by-environment"` to the real target (per environment: lab vs.
   production) in whatever config layer actually binds it — do not hand-edit
   `tenant-input-registry.json` to hardcode an account (that file is a governance file;
   this task's guardrails explicitly disallow modifying it, and hardcoding an
   environment-specific value into a shared registry would break the other 4 tenants'
   promotion paths too).
2. **Confirm write credentials.** Verify the identity/role that will perform the upload
   has write access to the `tenant-inputs` container's `raw/` prefix for
   `skyharbor-air`, scoped no wider than necessary.
3. **Confirm the guarded loader's approval mechanism.** Read
   `scripts/knowledge/fs-airline-azure-candidate-load.mjs` and
   `docs/ops/aca-data-build-job-rule.md` for the exact approval/status-transition gates
   (`WATCH_BEFORE_PROMOTION` → `READY_FOR_ACTIVE_PROMOTION_REVIEW` → active) before
   assuming any file drop alone triggers promotion.
4. **Run the loader** as an Azure Container Apps Job per
   `docs/ops/aca-data-build-job-rule.md` — not as a long-running manual
   `az containerapp exec` session, and not as a production web request. Break-glass
   `az containerapp exec` is read-only-inspection or documented-exception only.
5. **Verify row counts match source manifests.** Compare post-load row counts against
   the counts in §1 of this document (23 core files, 3 interview CSVs + 2 docs, 14
   T-family files) and against whatever the loader's own manifest/checksum step reports.
6. **Run the reconciliation checks already built for this:**
   ```bash
   npm run audit:canonical-tenant-inputs
   npm run audit:tenant-input-quality
   ```
   per `datasets/tenant-inputs/README.md` and the template pack's own quality-gate
   instructions. The first proves files are under the governed root; the second checks
   universal template coverage and publishes a depth matrix so a thin packet can't pass
   as promotion-ready.
7. **Record the release.** Per AGENTS.md's release-control discipline, this would be a
   `client-data-lane` change (client-scoped ingestion/data-plane) requiring a release
   record under `docs/releases/records/` before/alongside any PR — do not let a
   promotion happen without one, and do not describe it as `live-proven` until the ACA
   runtime invariant and a live signed-in check are both captured.

---

*Generated as part of a Tower T-family finalization pass for skyharbor-air. No Azure
read or write of any kind, including `az` read-only commands, was performed to produce
this document — every fact above was verified by reading files already in this repo.*
