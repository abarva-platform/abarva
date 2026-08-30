---
date: 2026-08-30
lane: client-data-lane
summary: Preserve renewal-choice evidence through the ECL Source-room generator, adapters, and Source 360 projection.
---

# 2026-08-30-source-ecl-renewal-substrate — ECL Renewal Substrate

## Release ID

`2026-08-30-source-ecl-renewal-substrate`

## Status

`candidate`

## Plain-English Summary

This release makes the synthetic Source-room contract fixture carry an explicit renewal posture instead of leaving product pages to infer it from incomplete fields. The generated package now includes planted renewal cohorts, renewal notice dates, and auto-renew metadata; the loaders preserve those fields through the commercial and Source projection layers; and the serving view keeps renewal work as a focused decision subset instead of mirroring the full contract book.

The change prepares Source 360 to state only what the refreshed substrate proves. It does not create finance-confirmed realized value and does not promote synthetic evidence as live-client truth.

## Layer Impact

- Release lane: `client-data-lane`.
- Layer 1: Contract-register fixture rows include deterministic renewal notice dates, notice windows, and planted renewal cohorts.
- Layer 2: Source-room adapter output preserves the contract metadata needed by downstream layers, with hashes and row-level quality state intact.
- Layer 3: Commercial contract records store renewal notice dates and carry auto-renew, notice-window, benchmarking, and termination metadata in attributes.
- Layer 4: Source projection rows write non-null renewal notice dates and expose auto-renew metadata in the payload consumed by Source 360.
- Products: Source 360 can compute renewal posture from served data. The renewal serving view is narrowed to decision-relevant rows.

## Client Applicability

- All clients: The shared adapter and Source 360 parsing path receive safer metadata handling.
- Specific clients: None by name in this public release record.
- Internal only: ECL fixture generation and governed data-build operation.
- Public/demo only: Synthetic fixture package used for controlled demonstration evidence.
- Feature flag: Existing ECL Source-room provider path only.

## Changes Included

- `scripts/ecl/generate_dense_source_room_extracts.py`
- `scripts/ecl/load_dense_source_room_commercial_layer.py`
- `scripts/ecl/load_dense_source_room_source_projection_layer.py`
- `scripts/ecl/__tests__/run-ecl-demo-findings-source-contract-tests.mjs`
- `docs/architecture/ecl-dense-all-layer-count-contract.json`
- `src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts`
- `src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts`
- `docs/architecture/sql-drafts/ecl_serving_views_v1_draft.sql`

## QA / Validation

QA status: `pass` for scoped validation, with one broader base-branch gate still outside this release.

- `node scripts/ecl/__tests__/run-ecl-demo-findings-source-contract-tests.mjs` passed.
- `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts' --runInBand` passed.
- `npx eslint 'src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts'` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` passed.
- A disposable local Source projection build passed readback with no duplicate Source serving row-key sets and rejected planted FK/gate failures.

Known validation note: the broader ECL product predeploy gate still reports unrelated route/surface coverage drift already present on the base branch. This release does not modify those route files.

## Rollout Plan

Merge through PR, deploy through the approved Azure Container Apps main workflow, then run the governed ECL dense all-layer ACA data-build job with the deployed digest-pinned image. Read back source, commercial, projection, cube, and serving row counts before claiming product readiness.

## Deployment Authority

- Repo-owned deploy workflow: Required for the shared web runtime.
- Shared runtime mutators: No ad-hoc shared web runtime mutation by agents.
- Approved image digest: Captured from the successful main ACA deploy before the data-build job runs.
- ACA runtime invariant: Required before signed-in proof.
- Worker image invariant: Required for the governed data-build job.
- Feature/env flag update path: No feature/env flag update in this release.
- Live signed-in proof required: Yes, after deploy and data-build refresh.

## Rollback Plan

Revert the PR and redeploy through the ACA main workflow. If refreshed data has already been loaded, rerun the prior governed data-build job version or restore the previous approved proof bundle according to the data-build runbook. Do not use product requests or ad-hoc web runtime mutation as rollback tools.

## Audit Evidence

- PR URL: to be added when opened.
- Merge commit: to be added after merge.
- ACA deploy run: to be added after merge.
- ACA data-build job proof bundle: to be captured after deployment.
- Signed-in Source 360 proof: to be captured after data-build refresh.
- Local validation artifacts: `/tmp/source-ecl-renewal-projection-local-*`.

## Known Gaps

The refreshed data is not live-proven until the ACA data-build job runs and the signed-in Source 360 page shows the renewal posture from the refreshed substrate. Broader route/surface predeploy drift remains out of scope for this release.
