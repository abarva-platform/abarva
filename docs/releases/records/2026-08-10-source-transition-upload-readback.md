# 2026-08-10-source-transition-upload-readback — Source Transition Upload Readback

## Release ID

`2026-08-10-source-transition-upload-readback`

## Status

`candidate`

## Plain-English Summary

Source stage uploads now refresh the server-rendered workflow shell after a registry-only file is stored. This prevents a user from seeing a successful upload receipt while the stage progress counter still appears unchanged. Transition readiness files also reconcile to the canonical transition milestone requirement when filenames use readiness, go-live, checkpoint, or plan language.

## Layer Impact

- Release lane: `global-control-lane`.
- Client intake: transition readiness upload filenames are matched to the correct governed evidence requirement.
- Source adapters: no schema or parser change; the upload sync now has additional canonical filename tokens for transition planning evidence.
- Products: Source stage canvas refreshes after successful registry-only uploads so persisted artifact readback can update the visible stage state.

## Client Applicability

- All clients: yes, for Source event stage workflows.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Source event canvas path only.

## Changes Included

- `src/lib/source/canonical-specs/evidence-requirements.ts`
- `src/components/source/canvas/analytics/TaskChecklist.tsx`
- `src/lib/source/canvas-substrate/__tests__/upload-sync.test.ts`
- `src/components/source/canvas/analytics/__tests__/TaskChecklist.upload.test.tsx`

## QA / Validation

- `npm test -- --runInBand src/lib/source/canvas-substrate/__tests__/upload-sync.test.ts` passed.
- `npm test -- --runInBand src/components/source/canvas/analytics/__tests__/TaskChecklist.upload.test.tsx` passed.
- Broader validation and live signed-in proof will be added before release.

## Rollout Plan

Open a PR, merge through the protected main branch, and deploy through the repo-owned Azure Container Apps main deployment workflow.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none in this change.
- Approved image digest: produced by main deploy workflow after merge.
- ACA runtime invariant: required after deployment.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Source event Transition upload readback.

## Rollback Plan

Revert the PR. The rollback restores previous upload-token matching and previous client refresh behavior. No migration rollback is required.

## Audit Evidence

- PR URL: pending.
- CI/deploy run: pending.
- Live Source Transition upload proof: pending.

## Known Gaps

- Stage approval permissions are a separate authorization issue and are not changed here.
