# 2026-10-05 — Moves Capture Step Readiness

## Release ID

`2026-10-05-moves-capture-step-readiness`

## Status

`candidate`

## Plain-English Summary

The redesigned Moves capture flow now keeps Continue disabled until the current step's required answers are saved and complete. On P1, a field is complete only when its saved answer has a valid recorded basis: matching approved evidence, a workspace assertion, or an owned assumption with a P2 validation plan. Basis saves must be acknowledged before the step can advance.

## Layer Impact

Release lane: `experimental` — this interaction applies only to the existing
feature-flagged, non-default capture flow.

- **Layer 4 — Products / Moves:** presentation and interaction readiness only. The flow uses the existing phase-capture state and P1 basis contract; gate policy, evidence records, artifacts, and canonical data models are unchanged.
- **Control plane:** no feature-flag values or runtime configuration are changed.

## Client Applicability

- All clients: no change when the redesigned capture flow is not enabled.
- Specific clients: workspaces already enabled for the redesigned Moves capture flow.
- Internal only: no.
- Public/demo only: the current synthetic demo tenant is included through its existing enrollment.
- Feature flag: existing `moves_capture_v2` and, for P1 basis alternatives, `moves_charter_basis_v1`; this release changes neither flag.

## Changes Included

- Require capture-step completeness before the redesigned flow's Continue action is enabled.
- Count P1 evidence, assertions, and owned assumptions according to the existing P1 basis contract; do not treat an assumption as approved evidence.
- Keep Continue blocked while a basis save is pending or has failed.
- Regression tests cover incomplete capture, unsaved edits, missing/invalid basis, matching evidence, valid assertion/assumption, and the flag-off evidence-backed path.

## QA / Validation

- `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx src/components/strategic-moves/__tests__/MovesCaptureFlow.test.tsx --runInBand` — 180 passed.
- `npx eslint` on both changed source/test files — 0 errors; 3 existing warnings in the source file.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` — passed.
- The new incomplete-step regressions failed against the unmodified implementation because Continue was enabled; they pass with the fix.
- Signed-in baseline: the live P1 capture screen showed Continue enabled while its first step reported `0/7 answered` and no basis was selected. No answer, basis, approval, or phase was changed during verification.

## Rollout Plan

Merge through a squash PR. Ship only through `.github/workflows/aca-main-deploy.yml`. Existing feature-flag enrollment remains unchanged. After deployment, repeat a signed-in P1 walk and verify disabled Continue on an incomplete step, re-enablement only after save acknowledgement and valid basis, and no unintended phase transition.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: pending merge/deploy.
- ACA runtime invariant: pending post-deploy verification.
- Worker image invariant: pending post-deploy verification.
- Feature/env flag update path: none; existing flag assignments remain unchanged.
- Live signed-in proof required: yes; browser baseline is captured, fixed behavior is not yet deployed or live-proven.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No migration or data rollback is required; no Move state is written by this change.

## Audit Evidence

- PR: pending.
- Focused Jest, ESLint, and TypeScript results are recorded above.
- Signed-in baseline observation: P1 first step reported `0/7 answered` with no declared basis while Continue remained enabled; phase state was left untouched.
- Post-deploy revision, digest parity, and signed-in regression walk: pending.

## Known Gaps

- Existing pre-redesign Move records may show completed phase gates without corresponding redesigned capture answers; this release does not backfill them.
- The inspected P1 Move remains blocked from P2 because its reviewed readiness responses are insufficient. This UI fix does not override that evidence/readiness decision.
