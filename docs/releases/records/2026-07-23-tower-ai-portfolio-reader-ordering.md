# 2026-07-23 Tower AI Portfolio Reader Ordering

## Release ID

`2026-07-23-tower-ai-portfolio-reader-ordering`

## Status

`candidate`

## Plain-English Summary

The Tower Command Center AI Portfolio reader no longer lets a large candidate-opportunity pool crowd out funded, embedded, and usage-backed AI rows. The live page had enough governed mart data for Healthcare Demo, Airline Demo, and FS Demo, but the reader fetched only the first 80 rows ordered alphabetically by `item_kind`; candidate rows sorted first, so the executive matrix and header could render as `0 AI initiatives`.

This change reads the full governed AI portfolio for the tenant and orders funded, embedded, and usage-benefit rows before candidate opportunities. The UI still keeps dense executive views readable through the existing top-10 matrix and candidate preview caps, while the All initiatives table and search can reach the loaded portfolio.

## Layer Impact

- Runtime read model: updates the `cio_tower.mart_ai_portfolio` selection in `loadTowerMartCommandView`.
- Tower UI data contract: preserves the existing Command Center component contract while ensuring it receives a representative tenant portfolio.
- Data plane: no schema change and no data mutation.

## Client Applicability

- All clients: yes, for tenants using the Tower Command Center mart path.
- Specific clients: the bug was observed in Healthcare Demo, Airline Demo, and FS Demo.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none; `/tower` currently serves the Command Center.

## Changes Included

- `src/lib/cio-tower/tower-mart-view-model.ts`
  - Removes the `limit 80` AI portfolio read.
  - Adds deterministic ordering that places `funded_program`, `embedded_platform`, and `usage_benefit` before `candidate_opportunity`.
- `src/lib/cio-tower/__tests__/tower-mart-view-model.test.ts`
  - Adds a regression test proving candidate rows cannot starve the active AI portfolio slice and the old `limit 80` does not return.

## QA / Validation

- `npx jest src/lib/cio-tower/__tests__/tower-mart-view-model.test.ts src/lib/tower/command-center/__tests__/view-model.test.ts src/components/tower/command-center/__tests__/TowerCommandCenter.test.tsx --runInBand`
  - Passed: 3 suites, 60 tests.
- Pre-fix signed-in runtime audit showed Healthcare Demo, Airline Demo, and FS Demo had governed rows but rendered `0 AI initiatives` and `0 on matrix`.

## Rollout Plan

Merge to `main`, allow the repo-owned ACA main deploy workflow to build and deploy the digest-pinned image, then rerun signed-in browser proof for Healthcare Demo, Airline Demo, and FS Demo.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by ACA main deploy after merge.
- ACA runtime invariant: required after deployment.
- Worker image invariant: verify with the same invariant check.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, cross-tenant `/tower` proof for Healthcare Demo, Airline Demo, and FS Demo.

## Rollback Plan

Revert this PR and deploy through ACA main. The rollback restores the prior limited read behavior; no schema or data rollback is required.

## Audit Evidence

- Pre-fix cross-tenant audit: `reports/tower-cross-tenant-runtime-audit/summary.md`.
- Regression test: `src/lib/cio-tower/__tests__/tower-mart-view-model.test.ts`.
- Post-deploy proof to be attached after ACA deploy and signed-in browser audit.

## Known Gaps

- Per-item AI spend attribution can still be absent even when portfolio-level AI spend exists. In that case Tower correctly shows the portfolio-only spend attribution state rather than drawing an unsupported category chart.
- Tenants with no governed Tower mart rows still render the honest empty state until their mart projection job is run.
