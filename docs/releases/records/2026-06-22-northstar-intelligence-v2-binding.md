# 2026-06-22-northstar-intelligence-v2-binding - Northstar Intelligence v2 Binding

## Release ID

`2026-06-22-northstar-intelligence-v2-binding`

## Status

`candidate`

## Plain-English Summary

Northstar Clinical Technologies had committed synthetic context data, but it was missing the derived Intelligence v2 binding payload used by `/intelligence`. That made Northstar fall back to the older Context Explorer view while the other pilot clients rendered the new v2 Intelligence surface. This release adds the Northstar binding payload and resolver aliases so Northstar follows the same data-bound path as the other pilot clients.

## Layer Impact

- `client-data-lane`: Adds a Northstar client-scoped derived Intelligence binding asset from the committed Northstar synthetic dataset.
- `global-control-lane`: Extends the existing binding resolver alias map so the app keys `northstar`, `northstar-clinical`, and `northstar-clinical-technologies` resolve to the same payload.

## Client Applicability

- All clients: No.
- Specific clients: Northstar Clinical Technologies.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Uses the existing Intelligence v2 binding behavior; no new flag.

## Changes Included

- Added `datasets/northstar-clinical-tech-synthetic-v1/derived-intelligence/intelligence-binding-payload.json`.
- Added Northstar to `src/lib/intelligence/binding/all-tenants.json`.
- Added Northstar aliases in `src/lib/intelligence/binding/binding-payload.ts`.
- Added focused binding resolver coverage in `src/lib/intelligence/binding/__tests__/binding-payload.test.ts`.

## QA / Validation

- PASS: JSON parse validation for the derived payload and all-tenant binding index.
- PASS: Focused Jest coverage for existing pilot tenants and Northstar aliases.
- PASS: `npm run release:check`.

## Rollout Plan

Merge to main and let the repo-owned Azure Container Apps deploy workflow publish the new image. No DB migration, no data migration, no feature-flag change, and no DNS change.

## Deployment Authority

- Repo-owned deploy workflow: Required for runtime activation after merge.
- Shared runtime mutators: None outside the repo workflow.
- Approved image digest: Captured by deploy workflow after merge.
- ACA runtime invariant: Existing post-deploy invariant should confirm template image, traffic revision, and active revision image agree.
- Worker image invariant: Not applicable; this is a web read-model binding asset.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, verify Northstar `/intelligence` renders the v2 Intelligence surface instead of the legacy Context Explorer.

## Rollback Plan

Revert the PR. Northstar would fall back to the prior legacy explorer behavior; other tenant bindings are unchanged.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/3833
- CI/release check: To be attached.
- Post-deploy crawl or signed-in Northstar `/intelligence` screenshot: To be attached after merge/deploy.

## Known Gaps

This release does not claim Northstar data was newly loaded into the live database or retrieved by Ava. It only adds the committed Intelligence v2 binding asset needed for the surface to render consistently for Northstar.
