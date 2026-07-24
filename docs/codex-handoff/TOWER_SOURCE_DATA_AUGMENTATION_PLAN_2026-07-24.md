# Tower source-data augmentation — plan (2026-07-24)

Augment the tenant source packets so Tower's governed mart carries real budget, spend, usage,
owner and vendor attribution for every tenant — without turning Tower into a ticket warehouse.

Everything in §1 was verified against the working tree on 2026-07-24. Re-verify before acting;
counts and paths move.

---

## 1 · What is actually on disk

### 1.1 CORRECTION — there are TWO source trees, and the complete one is `tower-standardized-v1/`

An earlier draft of this plan claimed Lakeshore and Retail had no source packet. **That was wrong.**
It looked only at `datasets/tenant-inputs/`, which is one of two parallel trees:

| Tree                                                   | Contents                                  | Tenants                                           | Read by the Tower mart projection?               |
| ------------------------------------------------------ | ----------------------------------------- | ------------------------------------------------- | ------------------------------------------------ |
| `datasets/tenant-inputs/<tenant>/standard-2026-07-v3/` | 18 core + SA08–SA11                       | 3 (meridian-health, first-capital, skyharbor-air) | **yes** — `project-meridian-v3-to-cio-tower.mjs` |
| `tower-standardized-v1/<tenant>/`                      | **45 CSVs incl. the full T00–T13 family** | **all 5**                                         | **no**                                           |

`tower-standardized-v1/` is the authoritative, complete Tower source. Every tenant has an identical
45-file packet and all 14 T-family files. It is the tree the Command Center handoff prompt already
cited for First Capital's $2.132B budget.

**The gap is not missing data. It is that the mart projection reads the smaller tree.**

### 1.1b The T-family already covers the tool classes

An earlier section of this plan argued SA09 was seat-only and that ERP-agent and DORA grains had to
be built. They already exist, populated, for all five tenants:

| File                        | Rows | Carries                                                                                                                                                       | Covers                                   |
| --------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `T01_initiative-registry`   | 10   | `initiative_id`, `owner_role`, `business_sponsor_role`, `promised_benefit_usd`, `measured_value_usd`, `value_confidence`, `evidence_status`, `scale_decision` | the join spine                           |
| `T03_tool-usage-monthly`    | 40   | `period`, `tool_name`, `licensed_users`, `active_users`, `prompts_or_actions`, `estimated_hours_saved`                                                        | Copilot + coding tools, **multi-period** |
| `T04_agent-outcomes`        | 10   | `agent_id`, `business_process`, `work_items_resolved`, `deflection_pct`, `exception_rate_pct`, `human_escalation_pct`                                         | **the ERP/workflow agent grain**         |
| `T06_dora-delivery-metrics` | 10   | before/after `deployment_frequency`, `lead_time`, `change_failure`, `mttr`                                                                                    | **DORA**                                 |
| `T07_benefit-realization`   | —    | promised / measured / validated                                                                                                                               | the value funnel                         |
| `T08_spend-contracts`       | 10   | **`initiative_id`**, `vendor_or_tool`, `budget_fy26_usd`, `actual_ytd_usd`, `contract_value_usd`, `renewal_date`                                              | **the `$0` AI-tagged fix**               |

`T08` carries a real `initiative_id` (`LAK-AI-001`) and `T04` a real `agent_id` (`LAK-AGENT-001`),
so **the T-family has proper keys**. The missing-key finding in §1.2 applies to the v3 packet only.

**Consequence: almost nothing needs to be authored.** The work is consuming what exists.

### 1.1c A third tenant-key namespace

`tower-standardized-v1/` uses its own directory and `tenant_key` values:

`apex-retail` · `first-capital-financial` · **`lakeshore-industries`** · `meridian-health` · `skyharbor-air`

Against `CANONICAL_TENANT_KEYS` that is **two** disagreements, not one:
`first-capital` vs `first-capital-financial`, and `lakeshore-holdings` vs `lakeshore-industries`.
This tree agrees with the live mart on First Capital, so the mart and the canon disagree — see §1.8.

### 1.2 There is no stable cross-file key — this blocks everything

`04_applications_systems.csv` has 206 rows and 206 distinct `record_id` values, which looks like a
primary key. It is not:

- `record_id` is a **positional sequence that restarts in every file**. Application #1 is
  `SHA-V3-0001`. Vendor #1 in `07_vendors_contracts.csv` is **also** `SHA-V3-0001`. Same identifier,
  different entity, different file.
- `entity_id` is `SHA-AIR` on every row — that is the **tenant**, not the record.

So the only join available across files is free-text `business_name` and semicolon-delimited
`systems` strings. This one fact explains most of the defects already found on the live surface:

| Symptom                                                 | Cause                                                              |
| ------------------------------------------------------- | ------------------------------------------------------------------ |
| `ai_tagged_spend_usd` = $0 on all 250 AI portfolio rows | spend in `07` cannot be joined to a tool or application            |
| "No owner recorded" on every decision row               | `04` carries owners, but nothing links a program to an application |
| 242 candidate AI rows, 97% of the portfolio             | see 1.3                                                            |

`07_vendors_contracts.csv` is the exception — it has real keys (`SHA-VEN-AMS`, `SHA-VEN-PSS`).
That is the pattern to copy.

### 1.3 `09_programs_initiatives` and `10_ai_automation_use_cases` are the same data

213 rows each, covering **the identical 133 `business_name` values** — 133 shared, 0 unique to
either. Both are projected into the mart, which is where the duplicate-looking AI portfolio comes
from. One of them is the initiative registry and the other is the use-case backlog; today they are
indistinguishable.

### 1.4 There is no tool catalog anywhere

The AI tools are absent from the application inventory. Checked `04_applications_systems.csv` for
Copilot, Now Assist, Workday, Databricks and Codex — **none appear**. They exist only in
`SA09_AI_Tool_Usage_Feed.csv`, which has no `tool_id`.

So the catalog has to be authored. Small mercy: 8–25 rows per tenant, not 200.

### 1.5 SA09/SA10/SA11 exist and are never read

`scripts/tower/project-meridian-v3-to-cio-tower.mjs` references only `benefitsSa08`. SA09
(tool usage), SA10 (interview evidence) and SA11 (KPI outcomes) are present at 8 rows per tenant
and unconsumed. The projection audit now warns about this explicitly.

### 1.6 SA09 is a seat-adoption feed, not a universal tool feed

Its measurement model is `licensed_users → enabled_users → active_users → power_users`, plus
`usage_events`, `usage_rate_pct`, `adoption_target_pct`, and **one** untyped outcome slot
(`baseline_metric_name` / `target_value` / `actual_value` / `metric_unit`).

| Tool class                                         | Fit                                                                          | Gap                                                                                         |
| -------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| M365 Copilot                                       | good — seats are the native unit                                             | active days, per-app split, chat vs agent                                                   |
| Coding tools (Copilot, Codex, Cursor, Claude Code) | partial                                                                      | acceptance rate, suggestions shown/accepted, chat turns, agent tasks, sessions, tokens/cost |
| ERP / workflow agents (Workday, SAP)               | **poor** — wrong unit. "1,984 licensed users" for an HR agent is meaningless | work items, assisted vs human, deflection %, exceptions, cycle time                         |
| DORA                                               | **absent** — no team grain, none of the four measures                        | deployment frequency, lead time, change failure rate, MTTR                                  |

Also: the outcome half of every row is prose (`"Partial movement observed"`, `unit = mixed`), so
Tower cannot do arithmetic on it. That is why `usage_supported_value` currently derives from
`adoption_rate_pct` alone — it is the only real number in the outcome chain.

**And the tenants are not differentiated.** Meridian and SkyHarbor carry byte-identical usage
ladders (1035/306, 1351/494, 1667/725, 1984/1001, 2300/680, 2616/956, 2933/1275, 0/0); only the
tool names differ. Any cross-tenant comparison today is meaningless. Cheap to fix while
regenerating.

### 1.7 The mart needs no migration for the MVP

`ai_tagged_spend_usd`, `usage_metric`, `usage_actual`, `adoption_rate_pct`, `owner_role` and
`finance_owner_role` **already exist** on both `mart_program_decision_lanes` and
`mart_ai_portfolio`. They are null or zero because nothing populates them. The MVP is a
_fill-the-columns_ job, not a schema job.

### 1.8 Three tenant-key namespaces exist

| Namespace                               | Keys                                                                                                           |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `CANONICAL_TENANT_KEYS` (governance)    | `apex-retail`, `meridian-health`, `northstar-clinical`, `first-capital`, `skyharbor-air`, `lakeshore-holdings` |
| `ClientKey` (app, flags, active client) | `apexretail`, `meridian`, `arcturus`, `northstar`, `skyharbor`, `lakeshore`                                    |
| Tower mart `tenant_key` (live)          | `meridian-health`, `skyharbor-air`, **`first-capital-financial`**                                              |

First Capital has four identifiers. `AGENTS.md` requires tenants to come from code, never a
hand-typed list; nothing enforces it today, which is how this drifted. PR #5482 was a fix for
exactly this class.

---

## 2 · Scope rule

**Only build what a Tower surface reads today.** Any family that cannot name the tab it feeds is
deferred, not generated.

Applying that: **CMDB / ITSM application-month, service-month, problem themes, DORA and persona
productivity are all out of the MVP.** No current tab renders an application, a service or a
deployment frequency. Generating ~60,000 ITSM rows would repeat the 242-candidate mistake — data
nothing displays.

They land when a surface asks for them. `04_applications_systems.csv` is the anchor they will
attach to, and step 1 below is the prerequisite for that attachment.

---

## 3 · Phases

### Phase 0 — Display names + alias guard _(independent, do first)_

- `DEMO_SAFE_CLIENT_NAMES.lakeshore` is the one outlier (`"Lakeshore Holdings"`). Every other tenant
  is already a demo name and already proven live. One line.
- Add a test that **fails when a tenant-key literal appears outside the canonical config**. This is
  the control that prevents a fourth alias, and it would have caught the `first-capital` /
  `first-capital-financial` error before a synthetic row was generated.
- **Do not rename existing keys.** ~2,000 code hits, ~2,000 proof/report files that are audit
  evidence, and composite keys that embed the tenant (`meridian-health::tower_command_mart_v1::…`)
  — renaming breaks every idempotency key, so the next load duplicates instead of updating. Fix the
  one genuine disagreement in the mart, which is regenerable.

### Phase 1 — Stable IDs _(blocks everything else)_

Assign durable, prefixed, file-unique keys, deterministic from `business_name` so regeneration is
stable and re-runs are idempotent:

```
SHA-APP-0001    04_applications_systems
SHA-VEN-0001    07_vendors_contracts      (already has vendor_id — keep it)
SHA-INIT-0001   09_programs_initiatives
SHA-UC-0001     10_ai_automation_use_cases
SHA-TOOL-0001   02_tool_catalog           (new, Phase 2)
```

Keep `record_id` as-is for backwards compatibility; add the new key as a separate column so nothing
that reads the packets today breaks.

**Acceptance:** every `systems` / `linked_systems` free-text reference resolves to an `app_id`, or
is reported as an unresolved-link gap. No silent drops.

### Phase 2 — Tool catalog + de-duplicate 09/10

- Author `02_tool_catalog.csv` per tenant: `tool_id`, `tool_name`, `vendor_id`, `tool_category`,
  `initiative_id`, `business_owner_role`, `technology_owner_role`, `policy_status`, `risk_tier`.
  8–25 rows. This is the join layer — it is what lets every source tab stay in its native shape.
- Decide which of `09` / `10` is the initiative registry and which is the use-case backlog, and stop
  projecting both into the AI portfolio.

### Phase 3 — Canonical contract + SA09 extension

- `tower-canonical-input-contract-v1.yaml` — for every field: canonical name, business definition,
  type, required/optional, grain, null policy, transformation, validation, evidence requirement,
  **and the Tower surface it feeds**.
- Extend SA09 for coding tools: `suggestions_shown`, `suggestions_accepted`, `acceptance_rate_pct`,
  `agent_tasks`, `sessions`. Still seat-based, so it belongs in the same file.
- Type the outcome slot, or accept that `usage_supported_value` stays adoption-derived.
- Common source envelope on every row: `tenant_key`, `source_system`, `source_record_id`,
  `extract_id`, `period_start`, `period_end`, `captured_at`, `source_owner`, `evidence_id`,
  `confidence`, `attestation_status`, `is_synthetic`, `source_hash`.

### Phase 4 — Synthetic generation

- **Generate full packets for `lakeshore-holdings` and `apex-retail`** — they have none. Seed from
  their `approved-content/` and `derived/relationship-graph.json`.
- Regenerate SA09 for the other three so tenants stop sharing one usage ladder.
- Deterministic seed; `is_synthetic = true`, `generator_version`, `generation_seed` on every row.
- Reuse existing IDs; never mint cross-tenant references.
- Distribution rules: not every program succeeds, candidates stay unfunded,
  `claimable_value_usd = 0` unless gates deliberately pass, usage never equals value.
- **Generate one tenant that deliberately fails each QA gate**, held as a negative fixture, so the
  gates are proven to bite rather than assumed to.

### Phase 5 — Mart projection _(the phase most likely to be skipped)_

Extend `assemble-mart.ts` / `project-tower-mart.ts` to consume SA09 and the tool catalog, and to
**populate `ai_tagged_spend_usd` on portfolio rows**.

Without this, Phases 1–4 produce beautifully-governed canonical data and **nothing changes on
screen**. SA09 has been sitting fully formed and unread for weeks — that is the precedent.

Deliverable: a `canonical → mart` mapping CSV beside the `source → canonical` one.

### Phase 6 — Governed load

- One dataset manifest per canonical family under `docs/governance/dataset-manifests/`.
  `validate:context-corpus manifests` blocks the load without them.
- ACA operator job, `--tenant` scoped, `--dry-run` first, run-id + idempotency key + Blob proof
  bundle per the ACA data-build job rule. No local shell.
- Order: SkyHarbor → Meridian → FS → Lakeshore → Retail.

### Phase 7 — Live proof

Per tenant, signed in: budget and spend non-zero, AI-tagged attribution present, tool adoption
visible, value funnel intact, owners on decision rows, no `$0 FY26 IT budget`, no
"No owner recorded", no "No vendor data", no source filenames, no console errors, tenant isolation
holds.

---

## 4 · Reconciliation — three equalities, not one

```
source total  =  canonical total  =  mart total
```

The middle equality alone is what let the `$0` budgets ship: canonical was fine, the mart was empty,
and nothing compared them.

## 5 · QA gates — fail the build

- an initiative / app / vendor / tool reference does not resolve
- a tenant row resolves to another tenant
- source ≠ canonical, or canonical ≠ mart
- source has positive usage or budget but the mart shows zero without a stated reason
- candidate initiatives contribute to approved funding
- usage is converted directly into realized value
- finance-validated value lacks an attestation record
- ticket text, personal data or source filenames appear in Tower staging or on a surface
- synthetic rows are not marked synthetic

## 6 · Client intake workbook _(real clients only — not needed for synthetic)_

A tab is defined by **who can produce it in a single action**, not by what the schema wants. One
flat tool-usage file forces one person to collect from four teams and hand-normalize; that never
happens, and it converts four independent extracts into one blocked deliverable.

| Tab                        | Owner                 | Source                                     | Effort                         |
| -------------------------- | --------------------- | ------------------------------------------ | ------------------------------ |
| 01 Initiative Registry     | PMO / transformation  | authored                                   | one-time                       |
| **02 Tool Catalog**        | same                  | authored                                   | **the only real ongoing work** |
| 10 Copilot Usage           | M365 admin            | Graph / admin report                       | paste export                   |
| 11 ServiceNow AI Usage     | ServiceNow platform   | Now Assist analytics                       | paste export                   |
| 12 Developer AI Usage      | engineering platform  | GitHub / Cursor / Claude Code admin export | paste export                   |
| 13 Delivery Metrics (DORA) | engineering platform  | CI/CD export — separate grain              | paste export                   |
| 14 ERP / Workflow Outcomes | HR + Finance systems  | process reporting                          | paste export                   |
| 20 Spend & Contracts       | finance / vendor mgmt | AP + contract register                     | paste export                   |
| 30 Benefit & Attestation   | finance value office  | authored                                   | judgement                      |

Each source tab keeps its **native export shape**. The Copilot admin is not asked to think in
`usage_events`; the HR team is not asked to express cases as `licensed_users`. The adapter
normalizes; the client never sees the canonical shape.

The Tool Catalog carries `tool_name → tool_id → initiative_id`, so source tabs need only what their
export already contains. Each tab loads independently — Copilot lands Tuesday, Workday lands next
month, Tower shows what it has and flags the rest as an evidence gap, which is the page's thesis
anyway.

**Two artifacts, not one:** the intake workbook (multi-tab, per-owner, native shapes) and the
canonical contract (SA09-like, what adapters emit). Synthetic data is generated at the canonical
layer directly and skips the workbook entirely.

## 7 · ServiceNow boundary

Aggregate at source; never load raw tickets. ServiceNow's Aggregate API (`/api/now/stats/{table}`
with `sysparm_count` / `sysparm_avg_fields` / `sysparm_group_by`) returns monthly counts and
averages grouped by `business_service` — hundreds of rows per month, not millions, and the same
numbers. Row-level only for the AI-touched subset needed to compute deflection, metadata only.
Never `short_description`, work notes, attachments, caller identities or audit history.

## 8 · Open decisions

1. **`operationally_evidenced_value_usd`** inserts a fifth funnel stage. The waterfall renders four
   levels and three drops. Cheap to change, but it is a dependent UI workstream — not automatic.
2. **Does `usage_supported_value` become a source column or stay derived?** If it becomes a column,
   two live-verified constraints must hold or the two Tower surfaces will disagree again: it must be
   adoption-evidenced (not floored at finance-validated), and `finance_validated > usage_supported`
   must remain legal.
3. **09 vs 10** — which is the registry, which is the backlog.
4. **Lakeshore and Retail** — generate full synthetic packets, or defer those tenants.

## 9 · Stop and ask

- an existing canonical table conflicts with the contract
- a source field has ambiguous financial meaning
- an entity cannot be linked and dropping it would change a total
- the governed ACA load path is unavailable
- a live tenant could be modified

## 10 · Smallest next step

Phase 0 (one line + one test), then Phase 1 on **SkyHarbor alone**, then Phase 5 far enough to
populate `ai_tagged_spend_usd`. If that one number goes non-zero on one tenant, the whole
source → canonical → mart → screen chain is proven and everything after it is repetition.
