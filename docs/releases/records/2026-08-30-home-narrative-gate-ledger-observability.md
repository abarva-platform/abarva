# 2026-08-30-home-narrative-gate-ledger-observability — Home Narrative Gate Ledger Observability

## Release ID

`2026-08-30-home-narrative-gate-ledger-observability`

## Status

`candidate`

## Plain-English Summary

The Home narrative plan job now emits a compact publication-gate event before the full narrative payload. This makes failed plan-only runs debuggable from normal ACA job logs without publishing any narrative rows. The claim verifier also recovers an explicit verdict from malformed JSON when the model response names a verdict but fails JSON parsing.

## Layer Impact

Lane: `global-control-lane`

Layer 2 / Source adapters: No change.

Layer 3 / Canonical model: No change.

Layer 4 / Products: Home narrative build proof is more observable. The Home product data and default route are not changed by this release.

Operations: ACA operator job logs now include a tail-safe publication-gate summary with tallies and failed claim samples.

## Client Applicability

- All clients: Home narrative operator proof path only.
- Specific clients: None.
- Internal only: Yes, for the Home narrative build and publication gate.
- Public/demo only: No.
- Feature flag: Existing Home narrative write flags remain unchanged.

## Changes Included

- `scripts/ecl/build_home_ecl_narrative_layer.ts` emits `home_ecl_narrative_publication_gate`.
- `scripts/data-build/build-enterprise-thesis.ts` recovers explicit verifier verdicts from malformed JSON responses.
- `scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs` asserts the new proof event and parser recovery path.

## QA / Validation

- PASS: `node scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs`
- PASS: `npx jest tests/behaviors/enterprise-thesis-validation.test.ts scripts/data-build/__tests__/enterprise-signal-packet.test.ts --runInBand`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false --skipLibCheck --project tsconfig.json`
- PASS: `git diff --check`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge through PR. Deploy through the repo-owned ACA main deploy workflow. Re-run the Home narrative plan-only job against the deployed digest. Do not set Home narrative write flags unless the publication gate accepts and the generated Home chapters are manually reviewed as CXO-ready.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Resolved by the deploy workflow after merge.
- ACA runtime invariant: Required before the operator job run.
- Worker image invariant: Required before the operator job run.
- Feature/env flag update path: None.
- Live signed-in proof required: No product UI change in this release.

## Rollback Plan

Revert the PR and redeploy the prior ACA digest through the repo-owned deploy workflow. No database rollback is required because this release does not mutate data.

## Audit Evidence

Inspect the PR diff, local test output, ACA deploy evidence after merge, and the subsequent plan-only operator job log containing `home_ecl_narrative_publication_gate`.

## Known Gaps

This does not make the Home narrative publishable. It only makes rejected plan runs easier to diagnose and reduces verifier parse fragility.
