# 2026-09-21-source-new-intake-return — Keep Intake Inside Source New

## Release ID

`2026-09-21-source-new-intake-return`

## Status

`candidate`

## Plain-English Summary

The request-intake footer now returns users to the Source New request workspace instead of leaving the new-event journey for the existing-contract portfolio.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 — Products: updates one Source New navigation link and its behavioral test. No canonical records, adapters, ingestion paths, or tenant data change.

## Client Applicability

- All clients: yes, for users with access to Source New intake.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/source/SourceOriginatePage.tsx`
- `src/__tests__/integration/source/source-originate-page.test.ts`

## QA / Validation

- Red-first focused test proved the existing link did not expose the Source New return destination.
- Focused behavioral test passed after the navigation fix.
- Mutation check restored the prior destination and reproduced the focused failure before the fix was restored.
- Scoped ESLint, TypeScript, and release validation are required before merge.

## Rollout Plan

Squash-merge through the protected repository workflow. The repo-owned Azure Container Apps main deployment workflow builds and deploys the exact merge SHA. Verify the runtime digest invariant, then confirm the signed-in intake footer returns to `/source/new`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the workflow.
- Approved image digest: recorded by the deploy artifact after merge.
- ACA runtime invariant: template, active revision, traffic, and worker images must match the approved digest.
- Worker image invariant: required readback; no worker code changes are included.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the squash merge and allow the repo-owned deployment workflow to restore the prior navigation behavior.

## Audit Evidence

- Focused Jest output and mutation failure.
- Pull request checks and merge commit.
- ACA deploy run and runtime-invariant artifact.
- Signed-in browser verification of the footer label and destination.

## Known Gaps

The surrounding legacy integration file contains unrelated stale copy assertions. This release validates the changed navigation behavior with a focused test and does not rewrite those assertions.
