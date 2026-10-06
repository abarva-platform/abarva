# 2026-09-23-moves-generated-draft-approval-storage — Moves Generated Draft Approval Storage

## Release ID

`2026-09-23-moves-generated-draft-approval-storage`

## Status

`candidate`

## Plain-English Summary

Generated Move deliverables can no longer be accepted as authoritative unless the accepted version can render as an editable final artifact and be stored in the Move artifact vault. The review drawer now shows a readable draft body before acceptance, and generated artifact downloads request editable output instead of the HTML preview default.

## Layer Impact

Layer 4 Products; release lane `global-control-lane`: Updates the shared Moves approval and artifact-review surface. This does not change intake, adapters, canonical data, schemas, or tenant source data.

## Client Applicability

- All clients: Moves users reviewing generated phase deliverables.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Generated draft client-approval route stores a final editable artifact before sign-off.
- Artifact vault review drawer loads a readable generated draft preview before enabling acceptance.
- Generated artifact downloads from the vault and phase build panel request final editable formats.
- Move artifact persistence supports a fail-closed `requireBlobStored` option for approval-critical artifacts.

## QA / Validation

- `npm test -- --runTestsByPath src/app/api/v1/programs/[programId]/artifacts/[artifactId]/client-approval/__tests__/route.test.ts --runInBand` — passed, 9 tests.
- `npm test -- --runTestsByPath src/components/strategic-moves/__tests__/FileCabinetPanel.labels.test.ts --runInBand` — passed, 8 tests.
- `npm run typecheck` — passed.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps deploy workflow may build and deploy the resulting image.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Verify after deploy before claiming live runtime proof.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for the affected Moves approval/download path.

## Rollback Plan

Revert the PR and allow the repo-owned deploy workflow to roll the application code back. No schema rollback or tenant data rollback is required.

## Audit Evidence

- PR URL: To be added after PR creation.
- Focused unit tests listed above.
- Post-merge deploy run and signed-in browser proof to be attached after rollout.

## Known Gaps

This candidate does not remediate other phase-specific smoke findings such as later-phase aVa answer grounding, upload automation coverage, or cross-surface evidence-count reconciliation.
