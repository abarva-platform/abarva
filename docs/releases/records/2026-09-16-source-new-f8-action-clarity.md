# 2026-09-16 Source New F8 Action Clarity

## Release ID

`2026-09-16-source-new-f8-action-clarity`

## Status

`candidate`

## Plain-English Summary

The Work view of the Source New event workspace now names one next action from the persisted lifecycle and stage, with a link to the governed event or intake review. Earlier phases do not claim completion; later phases clearly say they are not yet open. Viewing either does not advance the event or approve a gate.

## Layer Impact

`global-control-lane`, Layer 4 product presentation only. No canonical records, adapters, queries, migrations, or data-plane code is touched.

## Client Applicability

- All clients: Source New event workspace users on the Work view.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None added.

## Changes Included

- `src/components/source/new-workspace/SourceNewWorkspace.tsx`: stage-specific action labels and details for intake review, scope and strategy, and market package; "Earlier" replaces "Past work"; earlier and later phases have distinct guidance and a return-to-current-work action.
- `src/components/source/new-workspace/SourceNewWorkspace.test.tsx`: rendered behavior tests cover intake review, active strategy, active market package, and earlier/later navigation.
- This release record.

## QA / Validation

- Focused Files and Work view Jest suites: 16 tests passed locally.
- Scoped ESLint, TypeScript, and `npm run release:check` are required before merge.
- Signed-in navigation proof remains required after deployment.

## Rollout Plan

Review and merge through a pull request. The repo-owned ACA main deploy workflow is the only path to shared runtime traffic. No deployment or traffic change is part of this candidate.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` after an approved merge.
- Shared runtime mutators: None in this candidate.
- Approved image digest: Not applicable before deployment.
- ACA runtime invariant: Must be checked by the deployment owner after deployment.
- Worker image invariant: No worker change.
- Feature/env flag update path: None.
- Live signed-in proof required: Work view navigation across phases, including earlier and later phase selection, after deployment.

## Rollback Plan

Revert the presentation change through a follow-up pull request and the repo-owned deployment workflow. No data rollback is required.

## Audit Evidence

Test output, lint result, and pull request diff provide candidate evidence. Deployment and signed-in proof remain pending.

## Known Gaps

- No live signed-in browser proof captured for this candidate.
- The "suppliers" phase has no stage keys mapped in `currentPhase()` so it never appears as the current phase; this pre-existing gap is out of scope for this pass.
