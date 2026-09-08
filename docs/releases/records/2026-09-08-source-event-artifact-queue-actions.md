# Source Event Artifact Queue Actions

## Release ID

`2026-09-08-source-event-artifact-queue-actions`

## Status

`candidate`

## Plain-English Summary

The Source event Files workspace now distinguishes supporting evidence from authoritative deliverables. Parsed evidence no longer offers an invalid authoritative-acceptance action, missing stage artifacts can be generated from the review queue, and advancing between upload steps clears the prior step's local upload state.

## Layer Impact

- **Lane:** `global-control-lane`
- **Layer 4, Products:** Source event workflow controls and focused component tests only.
- Layers 1 through 3, tenant data, schemas, loaders, and canonical facts are unchanged.

## Client Applicability

- All clients: Yes, for Source event workflows.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Supporting evidence cards explain their workflow role without exposing an authoritative acceptance form that their artifact type cannot satisfy.
- Missing current-stage artifact rows invoke the existing governed artifact-generation endpoint and show generation errors inline.
- The active step body remounts when the selected step changes so file name, parse readback, and local upload state cannot carry into a different evidence requirement.
- Focused tests cover the evidence-role boundary, artifact generation action, and upload-state transition.

## QA / Validation

- PASS: `jest --runInBand` for `ArtifactAcceptancePanel.test.tsx` and `SourceAnalyticsCanvas.stageApproval.test.tsx` (23 tests).
- PASS: scoped ESLint for the two changed components and two changed tests.
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 tsc --noEmit`.
- PASS: `npm run release:check` after this record was added.
- PENDING: signed-in Source event workflow proof after the exact merge SHA deploys.

## Rollout Plan

Merge by pull request. The repo-owned ACA main deploy workflow builds and deploys the exact merge SHA. Confirm the digest-pinned runtime invariant, then verify the Files review queue and step transition in a signed-in Source event.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: The repo-owned workflow only.
- Approved image digest: Pending deploy output.
- ACA runtime invariant: Must pass after deploy.
- Worker image invariant: Must match the approved web digest where required by the deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the pull request and redeploy through the repo-owned ACA main deploy workflow. No schema or data rollback is required.

## Audit Evidence

- Pull request and merge SHA: Pending.
- ACA deploy run, revision, digest, and runtime-invariant artifact: Pending.
- Signed-in Source event proof: Pending.

## Known Gaps

- This release exposes existing governed generation in the current review queue; it does not change generation prompts, model selection, artifact authority, or client-final acceptance requirements.
