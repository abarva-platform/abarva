# 2026-09-02-home-visible-record-source - Home Visible Record Source

## Release ID

`2026-09-02-home-visible-record-source`

## Status

`candidate`

## Plain-English Summary

Home now states which record source is on screen. When the served ECL projection renders, the rail labels it as the ECL serving projection. When Home recovers through the reviewed snapshot fallback, the rail labels that path instead of leaving the distinction only in server logs.

## Layer Impact

Product projection: Home rendering receives and displays record-source metadata derived from the bundle provenance. No canonical data, intake data, loader, adapter, or serving table is changed.

Release lane: `global-control-lane`.

## Client Applicability

- All clients: Home can display the record-source metadata for any rendered bundle.
- Specific clients: ECL-enabled Home routes pass explicit fallback-vs-served metadata for their projection path.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/home/page.tsx`
- `src/components/home/preview/HomePreviewAppRoot.tsx`
- `src/components/home/v4/HomeV4App.tsx`
- `src/components/home/v4/Rail.tsx`
- `src/lib/home/preview/ecl-projection-bundle.ts`
- `src/lib/home/preview/types.ts`
- Focused Home provenance tests.

## QA / Validation

- `npx jest src/components/home/v4/__tests__/served-record-surface.test.tsx src/lib/home/preview/__tests__/ecl-projection-bundle.test.ts --runInBand` - passed.
- `npx eslint src/app/'(maestro)'/home/page.tsx src/components/home/preview/HomePreviewAppRoot.tsx src/components/home/v4/HomeV4App.tsx src/components/home/v4/Rail.tsx src/components/home/v4/__tests__/served-record-surface.test.tsx src/lib/home/preview/ecl-projection-bundle.ts src/lib/home/preview/__tests__/ecl-projection-bundle.test.ts src/lib/home/preview/types.ts` - passed.

## Rollout Plan

Open a PR, merge to `main` after checks pass, and let the repo-owned Azure Container Apps main deploy workflow build and promote the image.

## Deployment Authority

- Repo-owned deploy workflow: Required for production.
- Shared runtime mutators: None in this change.
- Approved image digest: To be produced by the repo-owned deploy workflow.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment if the deploy workflow updates workers.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for `/home`.

## Rollback Plan

Revert the rendering and metadata-threading commit, then deploy through the same repo-owned main workflow. No data rollback is required.

## Audit Evidence

- PR URL after creation.
- GitHub checks for the focused tests and release gate.
- ACA main deploy run after merge.
- Signed-in `/home` screenshot or DOM proof showing the rail's "Record on screen" status.

## Known Gaps

This does not repair an unavailable ECL serving projection. It makes the fallback path visible so future live proof cannot confuse reviewed-snapshot availability with served-projection coverage.
