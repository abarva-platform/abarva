# 2026-09-09 Source Artifact Acceptance Layout

## Release ID

`2026-09-09-source-artifact-acceptance-layout`

## Status

`candidate`

## Plain-English Summary

Keeps long select controls and the submission action within narrow artifact-review cards so operators can complete an artifact acceptance without clipped or unreachable controls.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: adjusts presentation sizing in the Source artifact acceptance panel only. No data model, adapter, canonical record, or approval policy changes.

## Client Applicability

- All clients: Yes, anywhere the Source artifact acceptance panel is shown.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source route availability only; no new flag.

## Changes Included

- Constrain shared acceptance inputs to the available card width.
- Add a focused component regression test for the three longest select controls.

## QA / Validation

- Focused Jest component suite passes: 12 tests.
- Scoped ESLint for the component and test passes.
- Live operator workflow reproduced the pre-release clipping mechanism; post-deploy signed-in proof remains required.

## Rollout Plan

Merge through a protected pull request. The repo-owned ACA main deploy workflow builds and deploys the exact merged SHA. Verify the artifact acceptance panel on the deployed Source event route.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Workflow only; no ad-hoc runtime update.
- Approved image digest: Recorded by the deploy workflow.
- ACA runtime invariant: Template image and 100% traffic revision must match the workflow-approved digest.
- Worker image invariant: No worker image change.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, confirm long controls and submit action remain visible inside a narrow artifact card.

## Rollback Plan

Revert the squash commit through a new pull request and redeploy the resulting main SHA through the repo-owned ACA workflow.

## Audit Evidence

- Focused Jest output and scoped ESLint output.
- Pull request, merge SHA, ACA deploy run, runtime digest proof, and signed-in screenshot after release.

## Known Gaps

- This release does not change artifact lifecycle policy, parsing, indexing, or route authorization.
