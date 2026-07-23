# 2026-07-23-meridian-tower-ai-spend-attribution — Meridian Tower AI Spend Attribution Projection

## Release ID

`2026-07-23-meridian-tower-ai-spend-attribution`

## Status

`candidate`

## Plain-English Summary

Meridian already carries a governed FY26 AI-tagged spend lens in V3 source data, but the Tower mart projection only surfaced that number as an enterprise portfolio total. That made the new Tower Command Center correctly render "portfolio-only" spend because no `mart_ai_portfolio` rows carried per-item `ai_tagged_spend_usd`.

This change teaches the V3-to-Tower projection to emit program-level AI-tagged spend facts from `09_programs_initiatives.ai_tagged_approved_funding_usd`. The Tower mart assembler already rolls recognized spend facts into `mart_ai_portfolio.ai_tagged_spend_usd`, so the UI can show partial per-program attribution without inventing new rows.

## Layer Impact

- `client-data-lane`: Changes Meridian-capable Tower mart projection semantics from portfolio-only to partially attributed where source rows already carry program-level AI spend.
- `global-control-lane`: Adds one shared metric key to the Tower facts-to-mart assembler so any tenant using the same V3 field can benefit.
- `product runtime`: No route or UI change; the existing UI behavior remains honest and data-driven.

## Client Applicability

- All clients: Projection path supports the new metric key.
- Specific clients: Meridian Health is the immediate beneficiary because its V3 `09_programs_initiatives.csv` contains `ai_tagged_approved_funding_usd`.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Tower Command Center flags apply; no new flag.

## Changes Included

- `src/lib/cio-tower/mart-projection/facts-from-v3.ts`
- `src/lib/cio-tower/mart-projection/mart-metric-keys.ts`
- `src/lib/cio-tower/mart-projection/__tests__/facts-from-v3.test.ts`

## QA / Validation

- Pass: `npx jest src/lib/cio-tower/mart-projection/__tests__/facts-from-v3.test.ts src/lib/cio-tower/mart-projection/__tests__/assemble-mart.test.ts --runInBand`
- Pass: `npx tsx src/scripts/tower/project-tower-mart.ts --dry-run --no-db --tenant meridian-health --v3-dir datasets/tenant-inputs/meridian-health/standard-2026-07-v3 --out-dir reports/tower-mart-projection-meridian-health-spend-attribution`
- Dry-run result: command-center AI-tagged lens remains `$53.7M`; four funded program rows receive `$18.6M` of direct program-level AI spend attribution; `$35.1M` remains unallocated until reconciled to a safe initiative-level source.

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA main workflow if runtime image pickup is needed, then run the governed Tower mart write job for `tenant=meridian-health`. Do not manually mutate the shared runtime tables from a local shell.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Governed ACA data-build job for Tower mart write.
- Approved image digest: To be captured by the ACA main workflow after merge.
- ACA runtime invariant: Required after deploy if the runtime image changes.
- Worker image invariant: Required after deploy before running the mart write job.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, after the mart write job, verify Meridian `/tower` AI Portfolio no longer renders the spend lens as portfolio-only.

## Rollback Plan

Revert this projection change and rerun the governed Tower mart write job for Meridian. Runtime UI will return to portfolio-only behavior if `mart_ai_portfolio.ai_tagged_spend_usd` returns to zero.

## Audit Evidence

- Dry-run proof directory: `reports/tower-mart-projection-meridian-health-spend-attribution`
- Source files: `datasets/tenant-inputs/meridian-health/standard-2026-07-v3/09_programs_initiatives.csv`, `datasets/tenant-inputs/meridian-health/standard-2026-07-v3/08_it_budget_spend_value.csv`

## Known Gaps

This does not create more synthetic data. It only maps existing direct program-level attribution. Meridian still has `$35.1M` of the `$53.7M` AI-tagged spend lens that is known at portfolio level but not safely assigned to specific initiatives. The next data-model step is a governed reconciliation rule or source file for unallocated/shared platform AI spend, not blind generation.
