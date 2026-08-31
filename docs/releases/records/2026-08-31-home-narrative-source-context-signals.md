# 2026-08-31-home-narrative-source-context-signals — Home Narrative Source Context Signals

## Release ID

`2026-08-31-home-narrative-source-context-signals`

## Status

`candidate`

## Plain-English Summary

This release widens the Home narrative build packet so executive narrative generation can use the active source package as source-backed context, not only projection rows and file-level coverage summaries. It also emits the Home narrative proof as a retrievable operator proof bundle instead of relying on oversized stdout payloads.

## Layer Impact

Release lane: `client-data-lane`.

Layer 1 client intake: the active source package is read during the governed narrative build as deterministic source evidence with per-file hashes.

Layer 4 product projections: Home narrative planning can cite richer source-context signals for business profile, strategy, organization, spend/value, metrics, risk, AI, operations, and data analytics maturity. Product runtime still reads the published Home projection rows.

Operator proof: the ACA operator wrapper can extract a Home narrative proof tarball from job logs.

## Client Applicability

- All clients: Home narrative build path and operator proof extraction behavior.
- Specific clients: none.
- Internal only: operator proof artifact extraction.
- Public/demo only: none.
- Feature flag: writes remain gated by `HOME_ECL_NARRATIVE_WRITE=true` and `HOME_ECL_NARRATIVE_WRITE_APPROVED=true`.

## Changes Included

- `scripts/ecl/build_home_ecl_narrative_layer.ts`
- `scripts/data-build/build-enterprise-thesis.ts`
- `scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs`
- `scripts/ops/submit-aca-operator-job.mjs`

## QA / Validation

- `node scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs` passed.
- `node scripts/ops/submit-aca-operator-job.mjs --self-test` passed.
- `NODE_PATH=/Users/anand/Projects/nexus/node_modules /Users/anand/Projects/nexus/node_modules/.bin/tsx -e "Promise.all([import('./scripts/ecl/build_home_ecl_narrative_layer.ts'), import('./scripts/data-build/build-enterprise-thesis.ts')]).then(()=>console.log('tsx import ok'))"` passed.
- `git diff --check` passed.

## Rollout Plan

Merge through a pull request. The repo-owned ACA main deploy workflow builds and deploys the updated image. Run the narrative job in plan-only mode, inspect the extracted proof bundle, and then run the write-gated job if the output quality gates pass.

## Deployment Authority

- Repo-owned deploy workflow: required for the shared web image.
- Shared runtime mutators: not used directly by this change.
- Approved image digest: produced by the repo-owned workflow after merge.
- ACA runtime invariant: required before claiming deployed behavior.
- Worker image invariant: repo-owned workflow updates worker jobs.
- Feature/env flag update path: Home narrative writes require the two explicit write env gates.
- Live signed-in proof required: required only after a write is applied and product output is expected to change.

## Rollback Plan

Revert the pull request and redeploy the prior digest through the repo-owned ACA workflow. If a write-gated narrative job has already published rows, restore the prior Home projection rows from the latest accepted readback/proof bundle before re-running product proof.

## Audit Evidence

- Pull request URL after creation.
- GitHub checks for the pull request.
- ACA deploy workflow after merge.
- Home narrative operator proof bundle from the plan-only run.
- Home narrative readback output after any write-gated run.

## Known Gaps

This change prepares a richer packet and proof extraction path. It does not by itself publish new Home narrative rows; publication still requires a passing plan-only proof followed by the write-gated operator job and readback.
