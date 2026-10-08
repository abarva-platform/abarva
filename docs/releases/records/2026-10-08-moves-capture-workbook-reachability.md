# 2026-10-08-moves-capture-workbook-reachability — Transition workbook after capture

## Release ID

`2026-10-08-moves-capture-workbook-reachability`

## Status

`candidate`

## Plain-English Summary

The redesigned Move workspace now lets a team finish phase capture before reviewing the transition readiness workbook. The workbook still blocks the final build and phase gate until its required answers are reviewed. Other missing required evidence still blocks capture.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Moves capture progress distinguishes evidence needed for the design answers from the transition workbook reviewed at the gate. No canonical data or data-plane write path changes.

## Client Applicability

- All clients: The capture rule applies to Move phases with a transition workbook.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: The reported reachability case uses `moves_capture_v2` and `moves_workspace_v2`; the underlying capture status rule is shared.

## Changes Included

- Moves phase capture status excludes an open `stage_readiness_*` workbook from Capture's per-answer completion check. Gate evidence evaluation and build blockers are unchanged.
- A component regression test covers Capture reachability, workbook control availability, gate hold, and an unrelated missing-evidence hold.

## QA / Validation

- Targeted regression: passed.
- `MovesPhaseStandaloneClient.test.tsx`: 255 passed.
- TypeScript `tsc --noEmit`: passed with an 8 GiB heap.
- `npm run release:check`: all 11 gates passed.
- Targeted ESLint: 0 errors; 2 existing unused-import warnings in the component.
- Prettier check reports existing formatting differences in both touched files; the new hunks follow the local format and unrelated lines were left untouched.
- Live signed-in verification: pending deployment.

## Rollout Plan

Squash merge through a PR. The repository-owned ACA main deploy workflow builds and deploys the approved digest. Recheck runtime image invariants and the signed-in capture, workbook review, and gate behavior before calling this live proven.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: Set by the deploy workflow after merge.
- ACA runtime invariant: Verify template and 100% traffic revision images match the approved digest.
- Worker image invariant: Verify required worker jobs still use the approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for Capture reachability and unchanged gate hold.

## Rollback Plan

Revert the PR and redeploy through the repository-owned main workflow. No schema or data rollback is needed.

## Audit Evidence

PR and deploy workflow links after merge; focused test output; signed-in runtime screenshots after deployment.

## Known Gaps

The phase design still requires a reviewed transition workbook before the final build or gate. This change only makes its normal review control reachable after capture.
