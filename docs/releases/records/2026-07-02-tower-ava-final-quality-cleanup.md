# 2026-07-02 — Tower aVa Final Quality Cleanup

## Release ID

`2026-07-02-tower-ava-final-quality-cleanup`

## Status

`candidate`

## Plain-English Summary

This release tightens Tower aVa answer routing for value-proof and AI hold questions. It prevents broad AI/value wording from falling into the wrong top-program template, and it returns a specific value-proof governance gap when Tower does not have enough initiative-level evidence to rank AI or board-ready items safely.

## Layer Impact

- `global-control-lane`: Updates the shared Tower aVa answer contract and deterministic answer path used by all tenants.
- `client-data-lane`: No data schema, ingestion, migration, or tenant data mutation is included.

## Client Applicability

- All clients: Yes, for the shared Tower aVa answer path.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Tightened AI routing so “missing value proof” and “hold until evidence improves” map to the weak-value-evidence contract instead of the top-program contract.
- Added deterministic value-proof governance answers for board-ready and AI hold questions.
- Added regression coverage for the exact question families that failed the post-deploy Tower aVa 50x2 audit.

## QA / Validation

- `npx eslint src/lib/cio-tower/answer.ts src/lib/cio-tower/__tests__/answer.test.ts` passed.
- `npx jest src/lib/cio-tower/__tests__/answer.test.ts --runInBand` passed: 31 tests.
- TypeScript and release checks must pass before merge.

## Rollout Plan

Merge to `main`, allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the new image, then rerun the signed-in Tower aVa 50x2 live audit against `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: No manual ACA mutation approved in this release.
- Approved image digest: To be produced by the main deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Tower aVa audit rerun.

## Rollback Plan

Revert the PR and redeploy the previous approved `main` image through the repo-owned ACA deploy workflow.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/4331
- Local targeted lint and Jest output.
- Post-merge ACA deploy artifact and signed-in Tower aVa 50x2 audit report.

## Known Gaps

This release only addresses the remaining value-proof/AI hold answer quality failures from the post-#4329 audit. It does not redesign Tower data, dashboard visuals, or broader question-bank coverage.
