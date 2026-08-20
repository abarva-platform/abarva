# 2026-08-20-renderable-board-artifact-plumbing — Structured Board Artifact Source

## Release ID

`2026-08-20-renderable-board-artifact-plumbing`

## Status

`candidate`

## Plain-English Summary

Board-grade Moves artifact generation now preserves the structured renderable document alongside the existing HTML projection. This keeps one structured source available for later DOCX/PDF/PPTX projections while leaving the current HTML response path intact.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 product projection: Moves board-grade artifact persistence now stores the structured renderable source in generated-artifact metadata when the orchestrated deliverable path succeeds. The HTML projection remains the current user-facing rendering, and this change does not alter canonical data, tenant intake, adapters, or graph/materialized data.

## Client Applicability

- All clients: Applies to shared Moves board-grade artifact plumbing when the existing orchestrated deliverable path is used.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Uses the existing orchestrated Moves deliverable path; this record does not activate new routing or tenant data.

## Changes Included

- Preserve `RenderableDeliverable` from the orchestrated Moves deliverable runner.
- Persist optional `metadata.renderableDoc` and `metadata.renderableMetadata` for generated board-grade Move artifacts.
- Pass structured renderable source through the board-grade persistence adapter.
- Update focused tests for persistence, repository metadata, and the decomposed orchestrator fixture.

## QA / Validation

- `npx jest src/lib/programs/board-artifacts/__tests__/board-grade-persistence.test.ts src/lib/artifacts/__tests__/repository.test.ts src/lib/programs/deliverables/orchestrated/__tests__/orchestrated-business-case.test.ts --runInBand --silent` — passed.
- `npx eslint src/lib/artifacts/repository.ts src/lib/artifacts/__tests__/repository.test.ts src/lib/programs/board-artifacts/board-grade-persistence.ts src/lib/programs/board-artifacts/orchestrated-move-route.ts src/lib/programs/board-artifacts/__tests__/board-grade-persistence.test.ts src/lib/programs/deliverables/orchestrated/run-orchestrated-move-deliverable.ts src/lib/programs/deliverables/orchestrated/__tests__/orchestrated-business-case.test.ts` — passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` — passed.
- `npm run release:check` — passed.
- `git diff --check` — passed.

## Rollout Plan

Merge to main through a pull request. The repo-owned main deploy workflow may rebuild and deploy the application image after merge. No database migration, tenant data load, registry activation, feature flag change, or manual runtime mutation is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: Allowed after merge.
- Shared runtime mutators: None.
- Approved image digest: Produced by the repo-owned main deploy workflow if it runs.
- ACA runtime invariant: Required only if the main deploy workflow deploys a new image.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Basic route/invariant proof only if the repo-owned deploy runs; no new product workflow activation is claimed by this record.

## Rollback Plan

Revert the PR. Existing HTML-only artifacts remain readable because the HTML projection is still stored as `metadata.renderedHtml`; consumers that do not use `metadata.renderableDoc` are unaffected.

## Audit Evidence

- Pull request URL: https://github.com/abarva-platform/abarva/pull/6550
- Local focused tests listed above.
- CI and deploy evidence: to be added after PR validation/merge if applicable.

## Known Gaps

This is Increment A only. It does not implement final DOCX design standards, PPTX projection, artifact approval/versioning UI, answer-changing edit workflow, or offline document re-ingestion.
