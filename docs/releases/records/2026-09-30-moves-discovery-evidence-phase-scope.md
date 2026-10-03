# 2026-09-30 — Moves discovery evidence phase scope

## Release ID

`2026-09-30-moves-discovery-evidence-phase-scope`

## Status

`candidate`

## Plain-English Summary

Discovery-evidence readiness is now assigned to P2 or later. P0 and P1 no longer treat the
discovery evidence checklist as a current-phase gate. P0 retains its separate requirement for one
uploaded, parsed, and human-reviewed source file; required discovery evidence still blocks P2 until
covered or formally waived.

## Layer Impact

- Release lane: `global-control-lane`.
- **Products:** Moves phase readiness and evidence-need presentation use the evidence's minimum
  collection phase. No other product projection changes.
- **Canonical data:** No schema, evidence, tenant identity, or stored approval data changes.
- **Source adapters:** None.

## Client Applicability

- All clients: Yes, for Moves phase readiness.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `buildMoveEvidenceNeedPackets` assigns discovery-family evidence to P2 at minimum and preserves
  the active phase for P2+.
- Regression coverage verifies P0/P1 look-ahead does not block those phases, the distinct P0
  reviewed-source requirement still blocks until satisfied, and missing discovery evidence remains
  blocking in P2.

## QA / Validation

- Test-first regression was observed failing on the deployed-main baseline for both P0 and P1.
- Focused packet, phase-readiness, stage-readiness workbook, and phase-build route suites pass:
  9 suites / 49 tests.
- ESLint passed for both changed TypeScript files; `npm run typecheck` passed.
- `node scripts/release-check.mjs --base origin/main --head HEAD` passed.
- CI and signed-in proof remain pending; this candidate is not yet released.

## Rollout Plan

Merge through a protected PR, then deploy the exact merge SHA using the repo-owned ACA main deploy
workflow. No database migration or data backfill is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Set by the exact merge SHA's deploy run.
- ACA runtime invariant: The deployment run must prove the template image and 100%-traffic revision
  use the same digest.
- Worker image invariant: Required worker jobs must use the same approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes; verify the P0 gate remains closed without reviewed source
  evidence and that P2 discovery evidence remains blocking in P2.

## Rollback Plan

Revert the release commit in a protected PR and redeploy through the repo-owned ACA main deploy
workflow. No migration rollback is needed.

## Audit Evidence

- Pull request and required CI results.
- Exact merge-SHA ACA deploy run and runtime-invariant artifact.
- Signed-in P0 gate and P2 readiness proof captured in the private synthetic E2E ledger.

## Known Gaps

This change scopes when discovery-evidence requirements block progression; it does not change
evidence-family classification, evidence quality scoring, or human-review policy.
