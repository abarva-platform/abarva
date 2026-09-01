# 2026-09-01-home-ecl-approved-plan-write - Home ECL Approved Plan Write

## Release ID

`2026-09-01-home-ecl-approved-plan-write`

## Status

`candidate`

## Plain-English Summary

This change makes the Home ECL narrative write path commit the exact plan artifact that passed review. Approved writes now require a plan JSON path plus its SHA-256 hash, verify that the current evidence packet still matches the plan, and refuse to write if the plan has drifted or failed either publication gate.

## Layer Impact

Products: Home narrative generation keeps plan review and approved writes bound to the same chapter prose.

Data plane: The operator script can still write scoped Home projection narrative rows, but only after the approved-plan artifact passes hash, scope, story-plan, signal-packet, publication-gate, and visible-quality checks.

Source adapters and canonical model: No change.

## Client Applicability

- All clients: Applies to Home ECL narrative operator behavior.
- Specific clients: None.
- Internal only: Operator script execution path and contract tests.
- Public/demo only: None.
- Feature flag: Existing write approval environment variables still gate mutation.

## Changes Included

- `scripts/ecl/build_home_ecl_narrative_layer.ts`
- `scripts/data-build/build-home-chapters.ts`
- `scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs`

## QA / Validation

- PASS: `node scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge by PR. The repo-owned Azure Container Apps main deploy workflow builds and deploys the shared web image. Mutating Home ECL narrative jobs must run through the governed ACA job path, using the deployed digest-pinned image, explicit write approval variables, `--from-plan`, and `--plan-sha256`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this change.
- Approved image digest: Resolved by main deploy workflow after merge.
- ACA runtime invariant: Required after deployment before live proof.
- Worker image invariant: Required before operator execution.
- Feature/env flag update path: No runtime flag update.
- Live signed-in proof required: Yes, after any approved narrative write.

## Rollback Plan

Revert the PR and redeploy through the repo-owned Azure Container Apps main deploy workflow. No database migration is included in this release record. If an approved narrative write already ran, use the prior accepted proof bundle or a scoped data-plane restore plan to replace only the written narrative rows.

## Audit Evidence

- PR URL after creation
- CI check output
- ACA deploy evidence after merge
- Operator plan proof bundle hash
- Operator write log showing `write_from_plan`
- Readback proof after any approved data-plane execution

## Known Gaps

This release does not itself generate, approve, or persist Home narrative rows. It only makes the approved write path artifact-bound so plan review and write execution cannot diverge.
