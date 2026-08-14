# 2026-08-14-source-live-files-checklist — Source Live Files Checklist

## Release ID

`2026-08-14-source-live-files-checklist`

## Status

`candidate`

## Plain-English Summary

The Source event Files workspace now shows a stage-specific evidence checklist before the file ledger. Users can see which evidence is required versus optional, the expected upload shape, likely source system, owner role, accepted formats, template link, upload action, parse/readiness status, green done state, and next action.

## Layer Impact

Layer 4 PRODUCTS: Source presentation only. The route passes already-loaded evidence-state rows into the live canvas and renders them against the canonical evidence requirement catalog.

No Layer 1, Layer 2, or Layer 3 changes. No workflow persistence, parser, schema, upload API, or data-plane mutation changed.

## Client Applicability

- All clients: yes, for the live Source event detail Files workspace.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/source/events/[eventId]/page.tsx`
- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`
- `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.artifactRoleBadge.test.tsx`

## QA / Validation

- `npx prettier --write src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.artifactRoleBadge.test.tsx 'src/app/(maestro)/source/events/[eventId]/page.tsx'` — passed.
- `npx eslint src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.artifactRoleBadge.test.tsx 'src/app/(maestro)/source/events/[eventId]/page.tsx'` — passed.
- `npm test -- --runTestsByPath src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.artifactRoleBadge.test.tsx --runInBand` — passed, with pre-existing duplicate manual mock warnings.
- `./node_modules/.bin/tsc --noEmit --pretty false --incremental false` — local compiler run hit Node heap limit before diagnostics.
- `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false --incremental false` — passed.

## Rollout Plan

Merge to main through a PR. The repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting image to the shared web runtime.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this release.
- Approved image digest: assigned by the deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, open a live Source event Files workspace and confirm the stage evidence checklist renders with required/optional rows and readiness marks.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. Because this is UI/read-model presentation only, rollback does not require data repair or migration rollback.

## Audit Evidence

Inspect the PR, CI output, focused Jest output, deploy workflow run, ACA runtime invariant proof, and live signed-in Source Files workspace proof.

## Known Gaps

Row-level upload actions scroll to the existing governed upload surface; they do not introduce requirement-specific parser routing. Parser, evidence-state mutation, and workflow persistence remain out of scope.
