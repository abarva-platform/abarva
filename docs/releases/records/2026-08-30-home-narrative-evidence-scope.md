# 2026-08-30-home-narrative-evidence-scope — Home Narrative Evidence Scope Contract

## Release ID

`2026-08-30-home-narrative-evidence-scope`

## Status

`candidate`

## Plain-English Summary

The Home enterprise-thesis prompt now includes a deterministic evidence-scope contract before the generic JSON schema. For sparse packets, unsupported sections such as strategic bets, leadership consensus, performance improvement, and management questions are explicitly forced empty instead of relying on the model to infer that absence from broad instructions.

## Layer Impact

Lane: `global-control-lane`

Layer 2 / Source adapters: No change.

Layer 3 / Canonical model: No change.

Layer 4 / Products: Home narrative generation receives stricter per-packet instructions before producing thesis content. No Home narrative rows are written by this release.

Operations: The next Home narrative plan-only run should show whether structurally invalid and unsupported sparse-section claims fall. The publication gate remains unchanged.

## Client Applicability

- All clients: Home narrative generation path only.
- Specific clients: None.
- Internal only: Yes, for Home narrative build proof and prompt discipline.
- Public/demo only: No.
- Feature flag: Existing Home narrative write flags remain unchanged.

## Changes Included

- `scripts/data-build/build-enterprise-thesis.ts` adds `buildEvidenceScopeInstructions()` and injects its output before the thesis output schema.
- `scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs` asserts the evidence-scope contract and forced-empty sparse-section instructions.

## QA / Validation

- PASS: `node scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs`
- PASS: `npx jest tests/behaviors/enterprise-thesis-validation.test.ts scripts/data-build/__tests__/enterprise-signal-packet.test.ts --runInBand`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false --skipLibCheck --project tsconfig.json`
- PASS: `git diff --check`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge through PR and deploy through the repo-owned ACA main deploy workflow. Re-run the Home narrative plan-only job against the deployed digest. Do not set Home narrative write flags unless the publication gate accepts and the generated chapters are manually reviewed as CXO-ready.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Resolved by the deploy workflow after merge.
- ACA runtime invariant: Required before the operator job run.
- Worker image invariant: Required before the operator job run.
- Feature/env flag update path: None.
- Live signed-in proof required: No product UI change in this release.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. No database rollback is required because this release does not mutate data.

## Audit Evidence

Inspect the PR diff, local test output, ACA deploy evidence after merge, and the subsequent plan-only operator job log containing `home_ecl_narrative_publication_gate`.

## Known Gaps

This does not publish Home narrative rows. If the plan-only gate still rejects after deployment, the next fix should use the compact failed ledger rather than weakening verifier thresholds.
