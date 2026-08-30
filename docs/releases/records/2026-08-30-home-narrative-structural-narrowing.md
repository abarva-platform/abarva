# 2026-08-30-home-narrative-structural-narrowing — Home Narrative Structural Narrowing

## Release ID

`2026-08-30-home-narrative-structural-narrowing`

## Status

`candidate`

## Plain-English Summary

Tightens the Home enterprise-thesis prompt so single-domain facts in action-oriented sections stay as facts or observations instead of being promoted into cross-domain or advisory claims. Structural-drop ledger entries now include the dropped claim statement when available, making the publication gate diagnosable without reading the full model payload.

## Layer Impact

Lane: `global-control-lane`

Layer 2 / Source adapters: No change.

Layer 3 / Canonical model: No change.

Layer 4 / Products: Home narrative generation receives narrower structural instructions before producing thesis content. No Home narrative rows are written by this release.

Operations: The next Home narrative plan-only run should show whether structurally invalid action-section claims fall. The publication gate remains unchanged.

## Client Applicability

- All clients: Home narrative generation path only.
- Specific clients: None.
- Internal only: Yes, for Home narrative build proof and prompt discipline.
- Public/demo only: No.
- Feature flag: Existing Home narrative write flags remain unchanged.

## Changes Included

- `scripts/data-build/build-enterprise-thesis.ts` adds explicit single-domain action-section discipline, blocks unsupported explanations of differences between totals, and records structural-drop claim statements.
- `scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs` asserts the new prompt and ledger markers.

## QA / Validation

- PASS: `node scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs`
- PASS: `npx jest tests/behaviors/enterprise-thesis-validation.test.ts scripts/data-build/__tests__/enterprise-signal-packet.test.ts --runInBand`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false --skipLibCheck --project tsconfig.json`
- PASS: `git diff --check`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge through PR and deploy through the repo-owned ACA main deploy workflow. After deployment, run the Home ECL narrative plan-only ACA job on the deployed digest and inspect the `home_ecl_narrative_publication_gate` structured event.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Resolved by the deploy workflow after merge.
- ACA runtime invariant: Required before the operator job run.
- Worker image invariant: Required before the operator job run.
- Feature/env flag update path: None.
- Live signed-in proof required: No product UI change in this release.

## Rollback Plan

Revert the prompt and ledger-observability change. Because no write flags are enabled by this release, rollback is code-only and does not require data cleanup.

## Audit Evidence

The plan-only ACA job must report whether the raw publication gate accepts or rejects the generated thesis. A rejection remains a safe outcome; it means the narrative was not published.

## Known Gaps

This does not publish Home narrative rows. If the plan-only gate still rejects after deployment, the next fix should use the compact failed ledger rather than weakening verifier thresholds.
