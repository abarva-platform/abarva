# 2026-07-31-skyharbor-air-enriched-knowledge-layer — Enriched core dataset, interviews, and Tower AI-control-tower fixes for skyharbor-air

## Release ID

`2026-07-31-skyharbor-air-enriched-knowledge-layer`

## Status

`candidate`

## Plain-English Summary

Replaces `skyharbor-air`'s thin, mostly-empty synthetic dataset (~4,840 rows across 19 files,
most fields blank) with a genuinely rich, $50B+-airline-scale dataset (503 applications, 3,071
relationships, 499 data/integration rows, and full population across all 21 template dimensions),
regenerates the executive interview corpus to fix a mail-merge content defect (216 rows, previously
repeating boilerplate answers across different questions; now role-specific and duplicate-free),
and fixes a real data gap in the existing Tower AI-control-tower dataset (`T00`/`T01` were
partially or fully boilerplate). `skyharbor-air` is the tenant's real registry identity — see
`datasets/tenant-inputs/tenant-input-registry.json`; "Airline Demo" is its display label. This
release does not touch the separate, unregistered `airline-demo-new` corpus (a different,
abandoned effort tracked separately).

## Layer Impact

**Release lane: `client-data-lane`** (client-scoped source/input data, not shared control-plane).

- **Layer 1 (Client intake)**: this is entirely Layer 1 content — governed tenant input files,
  not canonical/published data. No Layer 3 (canonical model) or Layer 4 (product) code changed.
- Does not touch any product route, API, or UI component.
- Does not touch `CANONICAL_TENANTS.ts`, the tenant-input registry, or any governance/policy file.

## Client Applicability

- All clients: No.
- Specific clients: `skyharbor-air` only.
- Internal only: Yes — this is candidate/local synthetic data, not loaded to Azure/Postgres, not
  client-facing.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `datasets/tenant-inputs/active/skyharbor-air/current/00_enterprise_profile.csv` through
  `18_operational_process_evidence.csv` (19 files, enriched) plus new
  `19_data_analytics_platform_maturity.csv` (new dimension).
- `datasets/tenant-inputs/active/skyharbor-air/current/{04,05,06,09,19}.xlsx` — populated
  Client Intake workbooks matching the Universal Template v3 structure (Start Here/Questionnaire/
  Examples/Reference Values/Relationship Expectations tabs preserved unmodified).
- `datasets/tenant-inputs/active/skyharbor-air/_pre-enrichment-backup-20260731/` — the prior
  thin dataset, preserved rather than deleted.
- `datasets/tenant-inputs/active/skyharbor-air/PROMOTION_READINESS_MANIFEST.md` — new; documents
  the file inventory, the declared-but-unbound Azure landing pattern, the guarded loader's
  `BLOCKED_BEFORE_PROMOTION` status, and a 7-step operator checklist for actual promotion (not
  performed by this release).
- `datasets/tenant-inputs/skyharbor-air/interviews/executive_interviews.csv` — regenerated (216
  rows, same 32-column schema), plus `interview_guidance.md` (added design-principles section).
- `tower-standardized-v1/skyharbor-air/ai-control-tower/T00_ai-investment-super-template.csv`
  and `T01_initiative-registry.csv` — T00 rebuilt from boilerplate to 26 real rows; T01's
  previously 100%-blank `business_area`/`status` columns populated.

## QA / Validation

- Row counts independently re-verified by direct `wc -l` against the report claims (not just
  trusted): 503 applications, 499 data/integrations, 3,071 relationships, 65 vendors, etc. — all
  match.
- Placeholder-value scan (`TBD`/`unknown`/`sample`/etc.) across all core CSVs: **pass**, zero hits.
- Spot-checked `04_applications_systems.csv`'s `system_type` column distribution (SaaS 160, COTS
  134, Custom 113, Legacy 75, Data-Platform 10, Custom-ERP-Module 5, Middleware 4,
  Mainframe-Legacy 2 — sums to 503) — confirmed **zero** instances of the `application_type`
  QA-flag-as-taxonomy defect found in the separate, abandoned `airline-demo-new` corpus
  (`"regional duplicate"` / `"acquired-carrier inherited system"` stored as a business type).
  New taxonomy values are real categories.
  synthetic samples).
- Spot-checked the Genesys Cloud CX row's 5 narrative columns directly against the file (not the
  agent's report) — content matches exactly, and a sibling `Genesys PureConnect (legacy — 2
  international sites)` row exists so the narrative isn't dangling.
- Found and fixed a real pre-existing data-quality defect while reviewing: `00_enterprise_profile.csv`
  previously had two conflicting duplicate rows (`conflict_status: conflict_resolved` on one,
  inconsistent revenue/employee_count between them); now a single clean row.
- Excluded from this commit: `tower-standardized-v1/skyharbor-air/family-*` and `derived/`
  files, and `T02`-`T13` (other than `T00`/`T01`) — these showed as modified only due to a
  pre-existing CRLF/LF line-ending difference already present on the source branch, unrelated to
  this work; reverted to `origin/main`'s content before committing to keep this diff scoped to
  genuine changes only.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — pending (run before PR open).

## Rollout Plan

Merge to `main` via the standard squash-merge path. This release has **no runtime rollout** — it
is local/repo-tracked candidate data only. Actual Azure Blob landing and promotion into the
governed knowledge pipeline is a separate, explicit next step, gated on resolving the unbound
`storageAccount` in the tenant-input registry and the guarded loader's approval mechanism — see
`PROMOTION_READINESS_MANIFEST.md`'s operator checklist. This release does not request that
promotion.

## Deployment Authority

- Repo-owned deploy workflow: Not applicable — no runtime/image change.
- Shared runtime mutators: None.
- Approved image digest: N/A.
- ACA runtime invariant: Not affected.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: No — this release contains no product-facing change.

## Rollback Plan

Revert the merge commit. The prior dataset is also preserved at
`datasets/tenant-inputs/active/skyharbor-air/_pre-enrichment-backup-20260731/` independent of
git history, as a second, non-git-dependent rollback path.

## Audit Evidence

- This release record.
- `datasets/tenant-inputs/active/skyharbor-air/PROMOTION_READINESS_MANIFEST.md`.
- Downloads packages produced during generation (local, not part of this PR):
  `skyharbor-air-enriched-core-dataset-20260731.zip`,
  `skyharbor-air-executive-interviews-final.zip`, `skyharbor-air-tower-ai-control-final.zip`.

## Known Gaps

- No proven ingestion path yet from these files into the new consumption-projection pipeline
  (`source_registry` → ... → `consumption.*_v1`) — the existing loader
  (`load-tenant-candidate-context.mjs`) targets an older schema generation
  (`intelligence_v7`/`public.enterprise_context_*`) that the new Knowledge UI and Cube do not
  read from. Building that connector is tracked separately, out of scope for this release.
- `T02`-`T13`'s other confirmed-blank columns (various quantitative/enum fields) were
  deliberately left blank rather than fabricated — documented in
  `PROMOTION_READINESS_MANIFEST.md`.
- Two known issues tracked as separate follow-ups (task chips already spawned, not part of this
  release): the shared `scripts/tower/fact-lineage-report.mjs`'s `ai_initiative_funding_usd`
  metric mislabels total program budget as AI-specific spend (affects all 5 tenants using that
  script); `T13_model-ai-inventory.csv`'s `model_name`/`domain` values don't correspond to their
  `parent_initiative_id` and need full regeneration, not a patch.
- The ~270 long-tail application/station rows use a moderate-size narrative template pool
  (verified duplicate-free) rather than fully bespoke prose per row, unlike the ~230 hand-authored
  flagship rows — a careful reviewer will notice family resemblance in phrasing within that
  long tail specifically.
