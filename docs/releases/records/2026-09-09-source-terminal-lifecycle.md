# Source terminal lifecycle

## Release ID

`2026-09-09-source-terminal-lifecycle`

## Status

`candidate`

## Plain-English Summary

Make final-stage Source approval close the event lifecycle instead of leaving a fully approved event marked active. Add a guarded operator repair for events approved before this behavior shipped.

## Layer Impact

- Layer 3 canonical workflow state, `global-control-lane` and `client-data-lane`: final approval may persist `source_events.lifecycle_state = completed`; the optional repair changes one explicitly scoped event row only after verifying tenant ownership, terminal stage, and an existing terminal approval.
- Layer 4 product projection, `global-control-lane`: Source canvas and portfolio consume the corrected lifecycle label through the existing event mapper.
- No intake template, adapter, contract fact, cube, retrieval corpus, or schema object changes.

## Client Applicability

All clients receive the forward approval behavior. No client receives a historical row update unless its exact tenant and event are explicitly named in a governed operator run. This is not internal-only, public/demo-only, or feature-flagged behavior.

## Changes Included

- Approval decision contract recognizes a positively identified terminal journey stage.
- Source approval route persists `completed` for final Value approval and does not advance beyond Value.
- Focused decision and route regression tests.
- `source:event-terminal-lifecycle:repair-job` for guarded, idempotent historical reconciliation and proof emission.
- This release record.

## QA / Validation

- **PASS:** 22 focused approval-decision and route tests cover terminal completion, unresolved-stage fail-safe behavior, persisted `completed` state, and no stage advance at Value.
- **PASS:** scoped ESLint for every touched TypeScript file.
- **PASS:** full TypeScript check with `npx tsc --noEmit --pretty false`.
- **PASS:** `npm run release:check`.
- **PENDING after deployment:** digest-pinned operator repair proof and signed-in event plus portfolio readback.

## Rollout Plan

Merge through a squash PR. The repo-owned ACA main workflow builds and deploys the exact release. For a previously approved terminal event, run `source:event-terminal-lifecycle:repair-job` through the private ACA operator wrapper with explicit tenant, event, run, build, input, idempotency, and release metadata.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: repo-owned main deploy workflow only.
- Approved image digest: recorded after deployment.
- ACA runtime invariant: template image and 100% traffic revision must match the approved digest.
- Worker image invariant: the private operator job must use the same digest-pinned image.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR to restore prior approval behavior. A repaired event is not automatically reopened; that would require a separate tenant-scoped decision and operator action because an append-only final approval already exists.

## Audit Evidence

- PR and merge SHA.
- ACA deploy run and runtime digest invariant.
- Operator job request, execution logs, extracted proof bundle, terminal approval count, and before/after readback.
- Signed-in canvas and portfolio proof.

## Known Gaps

Historical completed events are not bulk inferred. Each repair must be explicitly scoped and backed by a terminal approval record.
