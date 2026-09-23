# 2026-09-23-source-stage-plan-authority — Stable Stage-Plan Identity

## Release ID

`2026-09-23-source-stage-plan-authority`

## Status

`candidate`

## Plain-English Summary

The projected stage-plan hash now identifies the plan, rather than the event's current progress. Advancing a stage does not change the hash; changing the selected archetype within the same journey does.

## Layer Impact

Release lane: `global-control-lane`. Layer 4 Source projection only. No canonical record, intake data, adapter, schema, or tenant fact is changed by this release.

## Client Applicability

- All clients: The pure stage-plan projection has the corrected hash contract.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Add explicit stage-catalog and gate-policy version identifiers to the projected plan.
- Hash stable plan inputs, including archetype and gate criteria, while leaving current-stage status outside the hash.
- Add red-first behavioral tests for stage advancement and same-journey archetype changes.

## QA / Validation

- The stage-advancement test failed before the fix because the current stage and lifecycle changed the hash; the archetype test failed because two archetypes sharing a journey had the same hash.
- Focused Jest: six tests passed after the fix.
- Scoped ESLint, TypeScript no-emit with an 8 GiB Node heap, and `git diff --check` passed locally.
- CI and signed-in acceptance remain pending.

## Rollout Plan

After reviewed PR and applicable CI, merge to main and let the repo-owned ACA main workflow deploy. No migration or data build is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None from this branch.
- Approved image digest: Record from the successful workflow artifact after deployment.
- ACA runtime invariant: Verify template and sole 100%-traffic revision use that digest.
- Worker image invariant: Verify both required workers use that digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes; runtime proof alone is not product acceptance.

## Rollback Plan

Revert this code-only commit by PR and redeploy through the repo-owned ACA main workflow. No schema rollback is required.

## Audit Evidence

The reviewed PR, local red/green test output, applicable CI, and any later deploy/runtime and signed-in readback belong in the execution ledger.

## Known Gaps

This is a narrow D-008 sub-fix, not completion of D-008. There is still no persisted activation-time plan, historical plan read, governed replan version, or signed-in acceptance of that capability. The frozen event's external sponsor and artifact-review gate is unchanged.
