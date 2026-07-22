# 2026-07-22-tower-mart-v3-ai-tagged-spend — V3 AI-tagged spend lens in the unified Tower projection

## Release ID

`2026-07-22-tower-mart-v3-ai-tagged-spend`

## Status

`candidate`

## Plain-English Summary

Follow-up to the merged TOWER-MART-PROJECTION-PR1 (#5262). That PR's V3→facts adapter had one documented gap: it did not emit the governed **AI-tagged spend lens** (`08.ai_tagged_budget_usd`), so a unified-pipeline run showed `$0` AI-tagged for Meridian while the live mart (populated by the prior single-tenant script) correctly shows `$53.7M`. Running the unified write in that state would have **regressed a live, correct number** — so this PR closes the gap first.

The AI-tagged spend lens is an annual, non-additive budget view. It is deliberately distinct from real tool telemetry, which is monthly actual run cost. This PR emits the lens as its own enterprise-envelope fact (`it_ai_tagged_budget_usd`) and has the assembler read the command-center total **directly from that governed fact**, never by summing per-tool telemetry (which would mix monthly actuals into an annual lens and double-count). Telemetry monthly cost still rolls up at the program level as usage evidence.

With this change the unified pipeline reproduces all six target Meridian numbers exactly from the real V3 CSVs: total `$650.0M`, run `$487.5M`, change `$162.5M`, **AI-tagged `$53.7M`**, promised `$35.5M`, finance-validated `$3.8M`, realized `$0`. The unified write is now a strict superset of the live mart (same numbers, plus telemetry-readiness and the tool→program crosswalk), so it no longer risks a regression.

## Layer Impact

- `global-control-lane`: `src/lib/cio-tower/mart-projection/{mart-metric-keys,facts-from-v3,assemble-mart}.ts` — pure projection library; no runtime behavior change until the projection CLI is run.

## Client Applicability

- All clients: the emitter is generic (any tenant whose 08 budget carries `ai_tagged_budget_usd`).
- Specific clients: verified against Meridian's real CSV.
- Feature flag: none.

## Changes Included

- `mart-metric-keys.ts` — add `BUDGET_METRIC_KEYS.aiTagged = "it_ai_tagged_budget_usd"`.
- `facts-from-v3.ts` — sum `08.ai_tagged_budget_usd` across atomic budget rows and emit one enterprise-envelope `app_run_cost` lens fact.
- `assemble-mart.ts` — command-center `ai_tagged_spend_fy26_non_additive` reads the governed lens fact directly; telemetry sum is used only as a fallback when no lens fact exists (never added to it).
- `__tests__/facts-from-v3.test.ts` — 2 new tests (lens emitted = $53.7M shape; no lens when the column is absent).

## QA / Validation

- Pass: `npx jest src/lib/cio-tower/mart-projection/__tests__/` — 49/49 (47 prior + 2 new).
- Pass: `tsc --noEmit` — zero errors in new files.
- Pass: end-to-end dry-run against real Meridian V3 CSVs — command center now shows AI-tagged `$53.7M` (was `$0`), all other numbers unchanged and exact.
- Not run: live `--write` (VNet/ACA-job only). No mart rows written by this PR.

## Rollout Plan

Merge via squash to `main`. No migration, no surface change. Once merged + deployed, the unified projection is regression-free and the governed ACA write job for Meridian can run without losing the `$53.7M` AI-tagged number.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (existing, unmodified).
- Shared runtime mutators: none.
- ACA runtime invariant: unaffected.
- Live signed-in proof required: not for this PR (no surface change). Required after the governed ACA write job runs the unified pipeline for a tenant.

## Rollback Plan

Revert the PR. Additive pure-library change unreferenced by any surface; reverting restores the prior `$0` AI-tagged behavior in the unified pipeline (the live mart, populated by the prior script, is unaffected).

## Audit Evidence

- Test run: `src/lib/cio-tower/mart-projection/__tests__/facts-from-v3.test.ts` (9/9).
- Dry-run: command center AI-tagged `$53.7M` from `sum(ai_tagged_budget_usd)` over 70 atomic budget rows.
- PR URL: pending.

## Known Gaps

- Real `tower_*` telemetry is still not ingested for any tenant, so the usage/adoption half of every tenant's story remains gap-only until the ingest connectors run.
- ITSM agent-deflection source augmentation, alias seeding for non-Meridian tenants, and the Tower fallback-visibility badge remain deferred (carried from #5262).
