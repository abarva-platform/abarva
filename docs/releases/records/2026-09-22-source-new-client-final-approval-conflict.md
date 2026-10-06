# 2026-09-22-source-new-client-final-approval-conflict - Source New Client-Final Authority State

## Release ID

`2026-09-22-source-new-client-final-approval-conflict`

## Status

`candidate`

## Plain-English Summary

The Source New Files detail panel now separates client-final authority from workflow approval state. If a recorded client-final artifact is accepted while the workflow approval row is still draft or otherwise not approved, the panel keeps the client-final acceptance visible and adds a plain state note instead of making the two labels look like one approval decision.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Products: changes only Source New Files presentation for already-recorded artifact metadata.
- Layers 1-3: no intake files, adapters, canonical records, file records, approval records, lifecycle states, parser output, or index state are changed.

## Client Applicability

- All clients: yes, for Source New event users opening the Files workspace detail panel.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/source/new-workspace/SourceNewFiles.tsx`: renames the approval row to `Workflow approval` and adds an authority-state note when accepted client-final authority coexists with a non-approved workflow approval state.
- `src/components/source/new-workspace/SourceNewFiles.test.tsx`: adds focused behavior coverage for accepted client-final authority plus draft workflow approval.

## QA / Validation

- RED FIRST: `npx jest src/components/source/new-workspace/SourceNewFiles.test.tsx --runInBand` failed 1 of 19 because the panel still rendered `Approval` and lacked the authority-state note.
- PASS: `npx jest src/components/source/new-workspace/SourceNewFiles.test.tsx --runInBand`
- PASS: mutation proof temporarily weakened the authority-state note; the focused suite failed 1 of 19 on the new regression and passed after restoration.
- PASS: `npx eslint src/components/source/new-workspace/SourceNewFiles.tsx src/components/source/new-workspace/SourceNewFiles.test.tsx`
- PASS: `git diff --check`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npm run typecheck`
- PASS: `npm run release:check`
- Pending: PR checks, deployment, runtime invariant, and signed-in proof.

## Rollout Plan

Squash merge through PR after validation. The repo-owned Azure Container Apps main deploy workflow publishes the merged revision. No migration, data build, data mutation, parser or indexer job, upload, approval action, lifecycle transition, external send, or manual deploy is included.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this change.
- Approved image digest: to be recorded by the deploy workflow.
- ACA runtime invariant: required after deployment.
- Worker image invariant: required after deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, on the Source New Files workspace detail panel for an accepted client-final artifact whose workflow approval state remains non-approved.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main workflow. No database, artifact, approval, lifecycle, parser, or index rollback is required.

## Audit Evidence

Focused test output, mutation proof output, TypeScript output, scoped ESLint output, release check output, PR checks, ACA runtime-invariant artifact after deploy, and signed-in Source New Files readback after deployment.

## Known Gaps

- No deployed runtime or signed-in browser proof is claimed in this candidate record.
- This release does not reconcile or mutate conflicting recorded states; it only presents the already-recorded states honestly.
