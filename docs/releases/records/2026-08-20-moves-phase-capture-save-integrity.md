# 2026-08-20-moves-phase-capture-save-integrity — Phase capture save integrity

## Release ID

`2026-08-20-moves-phase-capture-save-integrity`

## Status

`candidate`

## Plain-English Summary

Moves phase-capture fields now separate draft text from server-persisted text. A
field can show `Done` and unblock Approve & Build only after the phase-capture
API acknowledges the saved value and returns the updated revision. Failed or
pending saves stay visibly unsaved and keep the phase gate blocked.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 4 (Products) — Moves.** Updates the signed-in Moves phase workspace
  UI and phase-capture write contract so local keystrokes cannot masquerade as
  completed capture.
- **Layer 3 (Canonical Model).** No schema or canonical-data change. The
  existing phase-capture API continues to write the same `program_modules`
  capture state; it now returns the persisted value map and revision to the
  client after a save.

## Client Applicability

- All clients: yes, shared Moves phase workspace behavior.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
- `src/app/api/v1/programs/[programId]/phase-capture/route.ts`
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`

## QA / Validation

- `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand`
  - Passed: 65/65 tests.
  - Existing suite warnings remain for duplicate manual mocks and async act
    warnings in unrelated mounted panels.
- `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx 'src/app/api/v1/programs/[programId]/phase-capture/route.ts' src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  - Passed.
- `npx tsc --noEmit --pretty false`
  - Passed.
- `git diff --check`
  - Passed.

## Rollout Plan

Merge through pull request to `main`. The repo-owned ACA main deploy workflow
will build and deploy the merged application image.

## Deployment Authority

- Repo-owned deploy workflow: yes, main-branch ACA workflow.
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: assigned by the deploy workflow after merge.
- ACA runtime invariant: required after deploy before claiming live behavior.
- Worker image invariant: no worker image change expected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, signed-in Moves phase-capture save failure
  and success path should be verified after deploy.

## Rollback Plan

Revert the pull request. Rollback restores the prior client behavior and the
prior phase-capture API response shape. No database rollback is required.

## Audit Evidence

- Pull request: pending.
- CI/deploy run: pending.
- Signed-in proof: pending.

## Known Gaps

- P0-to-P1 inheritance by reference is intentionally out of scope for this
  release and should follow as a separate change.
