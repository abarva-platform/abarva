# 2026-08-14-source-zero-reference-cleanup-s2 — Source Zero-Reference Cleanup S2

## Release ID

`2026-08-14-source-zero-reference-cleanup-s2`

## Status

`candidate`

## Plain-English Summary

This removes two Source files that no route, component, test, or script imports. They were left over from retired Source canvas iterations and were still counted in the Source reachability baseline, creating avoidable places for future work to land where no user can see it.

The cleanup keeps the live Source analytics canvas unchanged and refreshes the reachability baseline from 130 to 128 unreachable files.

## Layer Impact

Layer 4 Products: Source code cleanup only.

No Layer 1 client intake, Layer 2 adapter, Layer 3 canonical model, parser, schema, workflow persistence, approval automation, tenant data, or live data-plane mutation is included.

## Client Applicability

- All clients: No expected rendered behavior change; the deleted files had no consumers.
- Specific clients: None.
- Internal only: Yes, this reduces dead Source UI maintenance surface.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Deletes `src/components/source/canvas/canvas-three-choices.ts`.
- Deletes the unused `src/components/source/index.ts` barrel.
- Refreshes `docs/architecture/source-canvas-orphans.json` from 130 to 128 unreachable Source files.

## QA / Validation

Pre-merge local validation:

- Pass: `rg "canvas-three-choices|from ['\\\"]@/components/source['\\\"]|require\\(['\\\"]@/components/source['\\\"]\\)" src scripts docs -n --glob "!docs/releases/**"` returned no matches.
- Pass: `node scripts/audit/source-canvas-reachability.mjs` — 616 route entry points, 128 unreachable files, no new unreachable components.
- Pass: `git diff --check`
- Pass: `npm run release:check` — Release Control Gate, Deploy Authority Gate, Azure deployment lane check, and Pilot Data Loader Gate passed.

Live signed-in Source route proof is not claimed for this cleanup slice. The deleted files had no route or component consumers; active Source canvas proof remains covered by the post-deploy crawl after merge.

## Rollout Plan

Open a PR, merge through the protected repository flow, and deploy through the repo-owned Azure Container Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge through `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: Not used by this change.
- Approved image digest: To be recorded after deployment.
- ACA runtime invariant: Required after deployment before claiming deployed main healthy.
- Worker image invariant: Required after deployment before claiming deployed main healthy.
- Feature/env flag update path: None.
- Live signed-in proof required: No for the deleted zero-reference files.

## Rollback Plan

Revert the PR or redeploy the prior healthy Azure Container Apps image through the approved repo-owned deployment lane. No migration rollback is required.

## Audit Evidence

Local validation evidence is listed above. PR, merge, deploy, and ACA invariant proof will be recorded after the protected repository and repo-owned deployment flow completes.

## Known Gaps

This is the second cleanup slice only. The reachability baseline still lists 128 unreachable Source components after this deletion.
