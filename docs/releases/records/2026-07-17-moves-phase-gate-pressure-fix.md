# 2026-07-17-moves-phase-gate-pressure-fix — Moves Phase Gate Pressure Fix

## Release ID

`2026-07-17-moves-phase-gate-pressure-fix`

## Status

`candidate`

## Plain-English Summary

Fixes two live Moves workflow failures found during signed-in Meridian pressure testing. P1 Charter now shows the actual phase-capture inputs that the gate saves and approves, and Approve & Build is blocked with a clear message when those inputs are incomplete. Move File Cabinet uploads now preserve separate uploaded evidence files instead of overwriting the previous upload under the same `uploaded_evidence` artifact type.

## Layer Impact

- `global-control-lane`: shared Strategic Moves UI and artifact upload behavior changes for all tenants using Moves.
- No data-layer promotion, Active Tenant Access update, candidate read path change, or tenant-specific dataset change.

## Client Applicability

- All clients: yes, for Strategic Moves phase workspaces and Move artifact uploads.
- Specific clients: not tenant-specific.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Moves surfaces only; no new flag.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
- `src/components/strategic-moves/PhaseApproveAndBuild.tsx`
- `src/app/api/v1/programs/[programId]/artifacts/upload/route.ts`
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
- `src/app/api/v1/programs/[programId]/artifacts/upload/__tests__/route.test.ts`

## QA / Validation

- Pass: `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/PhaseApproveAndBuild.tsx 'src/app/api/v1/programs/[programId]/artifacts/upload/route.ts' 'src/app/api/v1/programs/[programId]/artifacts/upload/__tests__/route.test.ts' src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
- Pass: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand`
- Pass: `npx jest --runTestsByPath 'src/app/api/v1/programs/[programId]/artifacts/upload/__tests__/route.test.ts' --runInBand`
- Pass: `git diff --check`
- Pending: full TypeScript, release check, and browser smoke before PR merge.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow must build and deploy the exact merged SHA before this is live on `app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none in this PR.
- Approved image digest: pending ACA main deploy.
- ACA runtime invariant: pending ACA main deploy.
- Worker image invariant: not changed by this PR.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, run a disposable Meridian/SkyHarbor Move pressure smoke after deploy.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No schema migration or tenant data rollback is required.

## Audit Evidence

- PR URL: pending.
- Local proof: focused Jest and ESLint output in the Codex transcript.
- Browser proof: pending.

## Known Gaps

- Existing evidence-readiness classification can still require specific required evidence families before final build; this release makes multiple uploads persist correctly but does not change evidence-readiness policy.
