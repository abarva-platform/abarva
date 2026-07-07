# 2026-06-29-tower-answer-contract-executor — Tower answer trace executor

## Release ID

`2026-06-29-tower-answer-contract-executor`

## Status

`candidate`

## Plain-English Summary

Adds the missing server-side Tower answer executor. The existing right-answer scorer can judge persisted Tower traces, but the first VNet run proved that the sampled question bank had no matching answer traces yet. This change asks the selected question bank through the real Tower composer, persists the exact prompt package, raw Claude output, validation result, and rendered answer, then writes an HTML audit bundle for review.

## Layer Impact

- `global-control-lane`: Adds internal QA tooling for the shared Tower answer contract path. It does not change the user-facing Tower route.
- `internal-admin`: Adds an operator-safe batch executor for private VNet runs where `DATABASE_URL` and `ANTHROPIC_API_KEY` are available.

## Client Applicability

- All clients: The executor is tenant-keyed and defaults to Apex Retail, First Capital Financial, Lakeshore Holdings, Meridian Health, and SkyHarbor Air.
- Specific clients: None only.
- Internal only: Yes. This is a QA/control-plane executor, not a feature surface.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/qa/tower-answer-contract-executor.ts`: Selects a bounded sample from the Tower question bank, calls `answerCioTowerQuestion(...)`, persists traces through the existing Tower composer, and exports prompt/raw/rendered evidence.
- `package.json`: Adds `npm run tower:cio:answer-execute`.

## QA / Validation

- Pass: `npx eslint scripts/qa/tower-answer-contract-executor.ts scripts/qa/tower-answer-contract-server-runner.ts src/lib/cio-tower/answer-contract.ts src/lib/cio-tower/__tests__/answer-contract.test.ts`.
- Pass: `npm test -- --runTestsByPath src/lib/cio-tower/__tests__/answer-contract.test.ts --runInBand`.
- Blocked then fixed: first dry-run exposed the same `server-only` import behavior handled elsewhere in repo QA scripts. The package script now uses the existing `src/scripts/_mock-server-only-preload.cjs` shim.
- Pass: `TOWER_ANSWER_EXECUTE_DRY_RUN=1 TOWER_ANSWER_EXECUTE_OUT_DIR=/Users/anand/Downloads/tower-answer-contract-executor-dry-run npm run tower:cio:answer-execute -- --sample-limit 2 --total-limit 3`.
- Pass: `npm run release:check`.
- Not run yet: VNet proof after merge/deploy. Run the executor inside the approved ACA operator job using the approved main image, then rerun `npm run tower:cio:answer-contracts -- --require-traces` with the same sample limit.

## Rollout Plan

Merge to main through the normal repo workflow. After ACA main deploy, run the executor in the private VNet with a small sample first, then expand the sample once prompt quality, latency, and right-answer scoring are stable.

## Deployment Authority

- Repo-owned deploy workflow: Required before VNet execution against the deployed image.
- Shared runtime mutators: None from this PR.
- Approved image digest: Captured by the ACA main deploy workflow after merge.
- ACA runtime invariant: Checked by the deploy workflow.
- Worker image invariant: The private operator job must be restored to `/bin/true` after any temporary execution.
- Feature/env flag update path: N/A.
- Live signed-in proof required: Not for this internal executor; browser proof follows once server-side scoring is stable.

## Rollback Plan

Revert the executor script and package script. No schema, data, or runtime behavior changes are made by this PR.

## Audit Evidence

- HTML report: `TOWER_ANSWER_EXECUTE_OUT_DIR=... npm run tower:cio:answer-execute`.
- Score report: `TOWER_ANSWER_CONTRACT_SERVER_OUT_DIR=... npm run tower:cio:answer-contracts -- --require-traces`.

## Known Gaps

The executor may call Claude for every selected question, so large runs should be staged. The default is intentionally small; large samples should be run from the VNet with explicit limits and progress monitoring.
