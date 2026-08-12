# 2026-08-12-source-stage-guidebook-evidence-prep — Source stage guidebook evidence prep checklist

## Release ID

`2026-08-12-source-stage-guidebook-evidence-prep`

## Status

`candidate`

## Plain-English Summary

The Source stage Guidebook workspace now shows a concrete evidence-prep checklist for the current stage. Each row tells the sourcing team what to collect, which source/owner should provide it, the expected format or template, what parser/writeback it supports, and the next action. This keeps the guidebook from feeling like generic facilitation prose and makes it usable as the practical prep plan for the next working session.

## Layer Impact

- `global-control-lane`: updates the shared Source event canvas Guidebook workspace only.
- Canonical/data layer: no schema, migration, loader, tenant-data, or calculation change. The checklist is rendered from the same stage step requirement metadata already used by the Steps and Evidence surfaces.

## Client Applicability

- All clients: yes, for Source event users who can access the stage Guidebook workspace.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag.

## Changes Included

- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx` renders `StageGuideEvidencePrepTable` in authored and default guidebook paths.
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.guidebook.test.tsx` asserts that default guidebooks include the evidence-prep checklist and a concrete volumetrics row with source, owner, format, parser/writeback, and template code.

## QA / Validation

- `pass` — `npx jest src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.guidebook.test.tsx --runInBand`
- `pass` — `npx eslint src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.guidebook.test.tsx`
- `pass` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`

## Rollout Plan

Merge through the protected GitHub PR path. The repo-owned ACA main deploy workflow builds and deploys the merged `main` SHA. Signed-in browser proof is required before claiming the guidebook checklist is live.

## Deployment Authority

- Repo-owned deploy workflow: required after merge.
- Shared runtime mutators: none in this PR.
- Approved image digest: provided by the ACA main deploy workflow after merge.
- ACA runtime invariant: must be captured after deployment.
- Worker image invariant: must be captured after deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, on a Source event Guidebook workspace.

## Rollback Plan

Revert the PR. The Guidebook workspace returns to the previous authored/default guidebook rendering. No data rollback is required.

## Audit Evidence

- PR URL: pending.
- CI/validation: commands listed above.
- ACA deploy evidence: pending after merge.
- Live browser proof: pending after deploy.

## Known Gaps

This slice does not add new parser coverage, upload APIs, or stage-specific authored guidebook content. It makes the existing stage requirements visible in the Guidebook workspace.
