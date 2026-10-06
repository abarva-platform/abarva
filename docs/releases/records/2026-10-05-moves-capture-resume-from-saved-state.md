# 2026-10-05-moves-capture-resume-from-saved-state — Moves: resume capture at the first incomplete step

## Release ID

`2026-10-05-moves-capture-resume-from-saved-state`

## Status

`candidate`

## Plain-English Summary

When someone returns to a Move after a reload, the redesigned phase capture now
opens at the first step whose required answers are not durably complete. A
completed earlier step is shown as complete, rather than making the user replay
the wizard. If every capture step is complete, the flow opens the final step so
the existing governed approval action remains explicit. An explicitly requested
substep still takes precedence.

Completion uses the existing server-backed capture predicate, including saved
value, structured validity, and the applicable P1 basis or evidence condition.
No gate, evidence rule, saved data, artifact, or phase-transition behavior
changes.

## Layer Impact

Lane: `experimental` — presentation behavior within the tenant-scoped redesigned
Moves capture flow.

- `4 PRODUCTS` (Moves): adjusts the initial UI step from authoritative saved
  capture state. Capture fields, persistence, evidence policy, approvals,
  generation, and phase gates are unchanged.
- `3 CANONICAL MODEL`: no change; no schema, migration, or stored object change.

## Client Applicability

- All clients: No.
- Specific clients: No client-specific data or configuration change.
- Internal only: No.
- Public/demo only: No.
- Feature flag: `moves_capture_v2`; the behavior appears only where that
  tenant-scoped capture experience is enabled.

## Changes Included

- `src/components/strategic-moves/MovesCaptureFlow.tsx` — infer the initial
  step from complete server-backed section state when no explicit step was
  requested; stop at the final step when all capture groups are complete.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — preserve
  explicit substep navigation while allowing normal entry/reload to resume.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  — verify resume after completed saved answers and fail-closed behavior when a
  required answer is missing.

## QA / Validation

- `jest` on `MovesCaptureFlow.test.tsx` and
  `MovesPhaseStandaloneClient.test.tsx` — **PASS**, 2 suites / 220 tests.
- ESLint on the three changed TypeScript files — **PASS**, 0 errors; two
  existing unused-variable warnings remain in the host component.
- `tsc --noEmit` — **NOT LOCALLY VERIFIED**: local Node process exhausted its
  approximately 4 GB heap. The PR CI typecheck is authoritative.
- Live signed-in post-deploy walk — **OWED**; the existing signed-in view
  reproduced the old reset-to-step-one behavior, and no code from this release
  has been deployed yet.

## Rollout Plan

Merge via squash PR. The change applies only where the existing tenant-scoped
`moves_capture_v2` flag is enabled. Production code ships through the
repo-owned `.github/workflows/aca-main-deploy.yml` workflow. No data build,
migration, flag change, or worker update is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this change
- Approved image digest: assigned by the repo-owned workflow after merge
- ACA runtime invariant: must be checked after deployment before claiming live
- Worker image invariant: verify against the approved digest under the standard
  release procedure
- Feature/env flag update path: none; existing flag is not changed
- Live signed-in proof required: Yes; reload a Move with a fully completed first
  capture group and confirm it resumes at the first incomplete group without
  changing or advancing the Move.

## Rollback Plan

Revert the PR through a follow-up PR and redeploy through the repo-owned ACA
workflow. No migration or data rollback is required. The existing capture flag
may remain unchanged.

## Audit Evidence

- PR URL: added when opened.
- Local Jest, ESLint, and TypeScript results recorded above.
- CI typecheck and release-control checks on the PR.
- Post-deploy signed-in proof is required before claiming live-proven.

## Known Gaps

- The live signed-in confirmation of resumed-step behavior is still owed after
  deployment.
- Full local TypeScript validation was not possible due to the local heap limit;
  CI must pass before merge.
