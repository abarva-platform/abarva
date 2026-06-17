# 2026-06-17 Artifact Download Client-UUID — generated deliverables open instead of 404

## Release ID
`2026-06-17-artifact-download-client-uuid`

## Status
`candidate`

## Plain-English Summary
A successfully generated deliverable could not be opened or downloaded — `GET /api/v1/artifacts/{id}` returned
404. The row is stored under the client's resolved id (`ctx.clientId`, a UUID; the egress path requires the UUID
form), but the download route scoped its lookup with `getActiveClientKey()` — the app client KEY (e.g.
`skyharbor-air`), not the UUID. UUID ≠ key, so `getGeneratedArtifactById` matched no row and 404'd a deliverable
that exists. The route now resolves the active client's UUID (`getActiveClientRow().id`) for the scoped lookup,
so the deliverable opens (HTML preview) and downloads (DOCX/XLSX rendered on demand from the stored structured doc).

## Layer Impact
- **Lane:** `global-control-lane`
- **Layer:** Runtime API route — `GET /api/v1/artifacts/[artifactId]`. No schema/data change; the artifact was
  always persisted, it just wasn't retrievable through the key-scoped lookup.

## Client Applicability
- **All clients:** Yes — any generated deliverable. **Feature flag:** None.

## Changes Included
- `src/app/api/v1/artifacts/[artifactId]/route.ts` — use `getActiveClientRow().id` (client UUID) instead of
  `getActiveClientKey()` (app key) when scoping `getGeneratedArtifactById`.

## QA / Validation
- **PASS** — `npx tsc --noEmit` clean for the route.
- **Live evidence (before fix):** decomposed Charter run `44d1ce10` on SkyHarbor `7416481a` succeeded with
  `artifactId 3c3106f5`, 12 sections, 0 blockers, but `GET /api/v1/artifacts/3c3106f5` returned 404
  (key-vs-uuid client scope mismatch).
- **Post-deploy (to attach):** `GET /api/v1/artifacts/3c3106f5` (signed in, active tenant SkyHarbor) returns the
  rendered HTML/DOCX; the "Open deliverable" link opens it.

## Rollout Plan
Merge to `main` (squash); `az acr build`; roll the web revision (download is a web route — worker image bump
optional); deactivate idle revisions.

## Rollback Plan
Re-point to the prior image tag.

## Audit Evidence
- PR + CI above; a generated SkyHarbor deliverable opening/downloading from `/api/v1/artifacts/{id}`.

## Known Gaps
- The File Cabinet read-model lists the legacy program-artifacts source, not `generated_artifacts`; surfacing
  generated deliverables in the cabinet (and the Documents-tab declutter + gate-driven auto-generation) is tracked
  separately as the Documents-surface slice.
