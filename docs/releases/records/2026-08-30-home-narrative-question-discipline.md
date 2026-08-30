# 2026-08-30-home-narrative-question-discipline — Home Narrative Question Discipline

## Release ID

`2026-08-30-home-narrative-question-discipline`

## Status

`candidate`

## Plain-English Summary

The Home enterprise-thesis prompt now treats management questions as optional and requires their premise to be fully grounded. It also prevents contract renewal timing and supplier concentration facts from being overstated as exit or negotiation leverage without evidence of exit mechanics.

## Layer Impact

Lane: `global-control-lane`

Layer 2 / Source adapters: No change.

Layer 3 / Canonical model: No change.

Layer 4 / Products: Home narrative generation guidance is tightened. No Home narrative rows are written by this release.

Operations: The next Home narrative plan-only run should show whether unsupported management questions and overstated contract-flexibility language have been reduced by the writer, without weakening the publication gate.

## Client Applicability

- All clients: Home narrative generation path only.
- Specific clients: None.
- Internal only: Yes, for Home narrative build proof and prompt discipline.
- Public/demo only: No.
- Feature flag: Existing Home narrative write flags remain unchanged.

## Changes Included

- `scripts/data-build/build-enterprise-thesis.ts` adds management-question and contract-flexibility instructions to the enterprise-thesis prompt.
- `scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs` asserts the new prompt guardrails remain present.

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

Revert the PR and redeploy the prior ACA digest through the repo-owned deploy workflow. No database rollback is required because this release does not mutate data.

## Audit Evidence

Inspect the PR diff, local test output, ACA deploy evidence after merge, and the subsequent plan-only operator job log containing `home_ecl_narrative_publication_gate`.

## Known Gaps

This does not publish Home narrative rows. The publication gate remains authoritative, and rejected plan-only runs remain rejected.
