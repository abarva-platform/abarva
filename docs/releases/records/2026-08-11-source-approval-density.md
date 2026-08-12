# 2026-08-11-source-approval-density — Source Approval Page Density

## Release ID

`2026-08-11-source-approval-density`

## Status

`candidate`

## Plain-English Summary

Tightens the Source event approval page so it reads like a professional working
approval console instead of a presentation slide. The event title, banner,
decision panel, and brief card use denser spacing while preserving the same
approval controls, audit rationale, gate checks, and supporting evidence.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source approval-page presentation only. The change adjusts
  visual hierarchy and density for the existing approval projection.

## Client Applicability

- All clients: yes, for Source event approval pages.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/source/approval/EventApprovalCard.tsx`
- `src/components/source/approval/__tests__/EventApprovalCard.test.tsx`

## QA / Validation

- Pass: `npx jest --runTestsByPath src/components/source/approval/__tests__/EventApprovalCard.test.tsx --runInBand`
- Pass: `npx eslint src/components/source/approval/EventApprovalCard.tsx src/components/source/approval/__tests__/EventApprovalCard.test.tsx`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds
and deploys the updated web image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the approved workflow.
- Approved image digest: populated by the deploy workflow.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Source approval page.

## Rollback Plan

Revert the PR or roll back to the prior ACA image digest through the approved
deploy lane. No schema, data-plane, or workflow-state rollback is required.

## Audit Evidence

- Pull request and CI checks.
- ACA deployment run and runtime invariant after merge.
- Source approval page browser proof after deploy.

## Known Gaps

This release does not change approval workflow logic, event routing, artifact
quality, or aVa behavior. It only addresses the visible density and typography
of the approval page.
