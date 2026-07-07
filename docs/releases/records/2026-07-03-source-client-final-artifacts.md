# 2026-07-03-source-client-final-artifacts — Source Client-Final Artifact Governance

## Release ID

`2026-07-03-source-client-final-artifacts`

## Status

`candidate`

## Plain-English Summary

Source now supports the governed handoff from AbarVa-generated working draft to client-approved final artifact. A user can accept a client-final file for a specific Source artifact, preserve the generated draft as lineage, and mark the uploaded client file as the authoritative deliverable of record.

## Layer Impact

- `global-control-lane`: Adds the shared Source route and UI action used by all tenants.
- `client-data-lane`: Adds non-destructive Source artifact metadata columns for client-final lineage and authoritative-version resolution.

## Client Applicability

- All clients: Yes, once the migration and app deploy are active.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Migration: `supabase/migrations/20260703120000_source_client_final_artifacts.sql`
- Route: `POST /api/v1/source/[eventId]/artifacts/[artifactCode]/client-final`
- Route: `GET/POST /api/v1/source/[eventId]/artifacts/[artifactCode]/render` now streams a matching client-final artifact before falling back to generated rendering.
- UI: Source Document tab action `Accept Client Final`
- Helpers: shared client-final governance/resolution helper
- Tests: client-final resolver tests and Document tab rendering tests

## QA / Validation

- Unit tests: Pass — `npm test -- src/lib/source/__tests__/client-final-artifacts.test.ts src/components/source/canvas/workspace-tabs/__tests__/DocumentTab.test.tsx --runInBand`.
- Component tests: Pass — same focused Jest command covers the Source Document tab client-final banner/action.
- TypeScript: Pass — `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit`.
- ESLint: Pass — focused ESLint on changed Source routes, helper, UI, registry, File Cabinet, and adapter files.
- Release check: Pass — `npm run release:check`.
- Live signed-in browser proof: Not run. This branch is not deployed.

## Rollout Plan

Merge to main after review and QA, apply the additive migration through the approved Azure/Postgres deployment path, build the ACA image from the merged SHA, deploy through the repo-owned ACA main deploy workflow, and verify a signed-in Source event can accept a D09 client-final artifact.

## Deployment Authority

- Repo-owned deploy workflow: Required for ACA rollout.
- Shared runtime mutators: The new route writes Source artifact metadata and Source artifact state rows.
- Approved image digest: To be recorded at deployment time.
- ACA runtime invariant: Web app must remain on the approved Azure Container Apps lane.
- Worker image invariant: Not applicable for this slice.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes before claiming production-ready.

## Rollback Plan

Rollback the ACA image to the previous healthy revision if the UI or route misbehaves. The migration is additive and should remain in place; if necessary, disable the UI entry point in app code while preserving uploaded artifact rows and lineage.

## Audit Evidence

- PR URL: To be added.
- CI run: To be added.
- Deployment URL: To be added if deployed.
- Smoke output: To be added after signed-in proof.

## Known Gaps

Detailed redline/diff comparison between generated draft and client-final upload is intentionally out of scope. Acceptance is metadata/governance based: the uploaded client-final file is authoritative, and the generated draft remains available as lineage.
