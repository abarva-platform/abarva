# 2026-07-08-ava-answer-mode-safe-blocks — aVa Moves Mode Safe-Block Hardening

## Release ID

`2026-07-08-ava-answer-mode-safe-blocks`

## Status

`candidate`

## Plain-English Summary

The live 100-question product-truth regression after PR #4612 showed that runtime safety was holding, but some execution and orchestration answers still missed the required P0-P5 Moves phase table. This release broadens answer-mode classification for single-phase and cross-surface execution prompts, and ensures safe retired-fact blocks can still show the generic governed Moves phase contract without exposing blocked tenant facts.

## Layer Impact

- `global-control-lane`: Intelligence answer-mode classification and runtime output assembly for all tenants.
- `global-control-lane`: Retired-fact safe-block messages now pass through the same deterministic answer-mode fallback used for normal answers.

## Client Applicability

- All clients: Applies to all Intelligence/aVa tenants using the shared ask path.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing runtime path; no new flag.

## Changes Included

- Broadened `strategy_to_moves_execution` detection for P0/P1/P2/P3/P4/P5 prompts, single-phase Moves questions, and cross-surface orchestration prompts.
- Route-level and generator-level retired-fact safe-block messages now apply `applyCxoAnswerModeFallbacks` for the detected answer mode.
- Added regression tests for the exact live failing prompt shapes and for safe-block phase-table append behavior.

## QA / Validation

- Pass: `npx jest src/lib/intelligence/ask/response-policy.test.ts src/lib/intelligence/ask/__tests__/strategy-to-moves-contract.test.ts --runInBand`
- Pass: `npx eslint src/lib/intelligence/ask/response-policy.ts src/lib/intelligence/ask/response-policy.test.ts src/lib/intelligence/ask/__tests__/strategy-to-moves-contract.test.ts src/lib/intelligence/ask/index.ts src/app/api/intelligence/ask/route.ts`
- Pending: full TypeScript check.
- Pending: `npm run release:check`.
- Pending: deploy to ACA through repo-owned main workflow and rerun the same 100-question live product-truth regression.

## Rollout Plan

Open PR, squash merge to `main` after validation, let the repo-owned ACA main deploy workflow build and deploy the digest-pinned image, then rerun the live 100-question product-truth regression against `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: No ad-hoc Azure mutation.
- Approved image digest: Pending ACA deploy.
- ACA runtime invariant: Pending ACA deploy.
- Worker image invariant: Pending ACA deploy.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, rerun the same 100-question product-truth regression.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No schema, migration, or data-plane rollback is required.

## Audit Evidence

- Post-4612 live regression report: `reports/ava-product-truth-100q-regression-post-4612-2026-07-08.md`
- Post-4612 proof bundle: `proof/ava-product-truth-100q-regression-post-4612-2026-07-08/`
- Downloads zip: `/Users/anand/Downloads/ava-product-truth-100q-regression-post-4612-2026-07-08.zip`

## Known Gaps

Live acceptance is pending deploy and rerun. The prior deployed run still had 16 `moves_canonical_phases_missing` findings, with 0 critical failures and 0 stale/cross-tenant/raw-internal/suggested-question safety failures.
