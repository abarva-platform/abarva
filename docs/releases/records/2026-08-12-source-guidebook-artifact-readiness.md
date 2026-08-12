# 2026-08-12-source-guidebook-artifact-readiness — Source Guidebook Gate Truth

## Release ID

`2026-08-12-source-guidebook-artifact-readiness`

## Status

`candidate`

## Plain-English Summary

The Source stage Guidebook no longer describes a completed step checklist as
gate-ready when required artifacts still need client-final or quality review.
The Guidebook now separates input completion from approval readiness and points
users to clear the artifact queue before treating the stage as ready to advance.

## Layer Impact

- Release lane: `global-control-lane`
- `PRODUCTS`: Updates the Source event canvas Guidebook projection and its
  regression coverage.
- `CANONICAL MODEL`: No schema, tenant data, or canonical object changes.
- `SOURCE ADAPTERS`: No parser, upload, or adapter behavior changes.
- `CLIENT INTAKE`: No intake template or source workbook changes.

## Client Applicability

- All clients: Source event Guidebook surfaces using the shared event canvas.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.guidebook.test.tsx`

## QA / Validation

- `npm test -- --runTestsByPath src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.guidebook.test.tsx --runInBand` — PASS.
- Additional lint, typecheck, release control, PR checks, ACA deploy proof, and
  signed-in browser proof are required before this candidate can be called
  released.

## Rollout Plan

Merge through the protected GitHub PR lane. The repo-owned ACA main deploy
workflow builds and deploys the merged image to the shared application runtime.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: repo-owned workflow only
- Approved image digest: recorded by the deploy workflow after merge
- ACA runtime invariant: required before live-proof claim
- Worker image invariant: required before live-proof claim
- Feature/env flag update path: none
- Live signed-in proof required: yes, on a Source event Guidebook route with
  completed inputs and artifact blockers

## Rollback Plan

Revert the PR and allow the repo-owned ACA main deploy workflow to publish the
previous behavior. No data rollback is required.

## Audit Evidence

- PR URL: pending
- Local unit test: listed above
- ACA deploy evidence: pending
- Signed-in browser proof: pending

## Known Gaps

This change does not modify file parsing, artifact acceptance, or approval
persistence. It only corrects the Guidebook readiness narrative so it matches
the existing artifact-readiness model.
