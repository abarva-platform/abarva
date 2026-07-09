# 2026-07-08-ava-strategy-execution-value-mode — aVa Strategy-to-Execution Value Classifier

## Release ID

`2026-07-08-ava-strategy-execution-value-mode`

## Status

`candidate`

## Plain-English Summary

The post-4613 live 100-question regression reduced true Moves phase-table misses to one prompt: a healthcare administrative AI question that asked how to connect strategy to execution and value without saying the word Moves. This release maps that intent shape to the governed `strategy_to_moves_execution` answer mode so aVa includes the deterministic P0-P5 plus Tower phase artifact.

## Layer Impact

- `global-control-lane`: Intelligence answer-mode classification for all tenants.

## Client Applicability

- All clients: Applies to shared aVa/Intelligence answer-mode classification.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing runtime path; no new flag.

## Changes Included

- Classifies `strategy ... execution ... value` and `connecting strategy to execution and value` prompts as `strategy_to_moves_execution`.
- Adds a regression test using the exact live Q096 prompt shape.

## QA / Validation

- Pass: `npx jest src/lib/intelligence/ask/response-policy.test.ts --runInBand`
- Pass: `npx eslint src/lib/intelligence/ask/response-policy.ts src/lib/intelligence/ask/response-policy.test.ts`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`
- Pass: `npm run release:check`
- Not run: ACA deploy and live regression verification after merge.

## Rollout Plan

Open PR, squash merge to `main`, let the repo-owned ACA main deploy workflow publish the digest-pinned image, then rerun at minimum Q096 and preferably the full 100-question regression.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: No ad-hoc Azure mutation.
- Approved image digest: Pending ACA deploy.
- ACA runtime invariant: Pending ACA deploy.
- Worker image invariant: Pending ACA deploy.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No schema or data rollback is required.

## Audit Evidence

- Post-4613 report: `reports/ava-product-truth-100q-regression-post-4613-2026-07-08.md`
- Post-4613 proof bundle: `proof/ava-product-truth-100q-regression-post-4613-2026-07-08/`
- Downloads zip: `/Users/anand/Downloads/ava-product-truth-100q-regression-post-4613-2026-07-08.zip`

## Known Gaps

The post-4613 report still contains two scorer false positives for scope-boundary prompts on the Moves surface. Those answers correctly redirected out-of-scope prompts and should be handled as audit scoring calibration, not product answer-mode defects.
