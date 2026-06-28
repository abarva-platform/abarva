# 2026-06-27-moves-review-regenerate-loop — Moves Review Regeneration Loop

## Release ID

`2026-06-27-moves-review-regenerate-loop`

## Status

`candidate`

## Plain-English Summary

Moves File Cabinet artifacts can now accept client review feedback and create a new version from that feedback. The new version is clearly marked as regenerated from feedback, review required, and passed with caveats when missing evidence still prevents final approval.

## Layer Impact

- `global-control-lane`: Adds a shared tenant-scoped API route and File Cabinet UI behavior for all Moves clients.
- `client-data-lane`: No schema or migration change. The route writes only through the existing `move_artifacts` registry and Blob/object-storage path.

## Client Applicability

- All clients: Yes, for Moves File Cabinet artifacts.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Added `POST /api/v1/programs/[programId]/artifacts/[artifactId]/review-regenerate`.
- Added deterministic review feedback parsing and regenerated artifact metadata.
- Extended the File Cabinet artifact response with review, feedback, quality, and golden-bar status fields.
- Added a File Cabinet review-feedback action that creates the next artifact version and reloads inventory.
- Added focused tests for feedback parsing, route behavior, and existing cabinet merging.

## QA / Validation

- Focused Jest: `3` suites / `9` tests passed.
- Focused ESLint: clean on touched files.
- TypeScript: patch-owned errors cleared; full `tsc --noEmit` is currently blocked by unrelated missing dependency declarations/modules for `js-yaml`, `@azure-rest/ai-document-intelligence`, and `@axe-core/playwright`.

## Rollout Plan

Merge to `main`, build the exact git SHA into Azure Container Registry, deploy through Azure Container Apps, shift 100% traffic to the new revision, then perform signed-in Lakeshore proof against a clearly marked safe test artifact.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main lane.
- Shared runtime mutators: `app.abarva.ai` web container only.
- Approved image digest: To be recorded after ACA build.
- ACA runtime invariant: Verify active revision and 100% traffic after deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Rollback by shifting ACA traffic to the prior healthy revision or reverting this PR and redeploying. No migration rollback is required.

## Audit Evidence

- PR URL: to be added after PR creation.
- Focused Jest and ESLint outputs from the branch.
- Signed-in proof bundle after deploy with test artifact ID, regenerated artifact/version ID, screenshots/page text, tenant identity, ACA revision, and image digest.

## Known Gaps

- This pass proves the review/regenerate mutation loop. It does not add adaptive rigor, new Move phases, or broad artifact redesign.
- Golden-bar status is recorded as review-loop metadata for regenerated drafts; this does not yet invoke the full deliverable golden-bar scorer against every regenerated artifact format.
