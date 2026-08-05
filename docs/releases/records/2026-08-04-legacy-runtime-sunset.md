# 2026-08-04-legacy-runtime-sunset — Disable Retired Runtime Fallbacks

## Release ID

`2026-08-04-legacy-runtime-sunset`

## Status

`candidate`

## Plain-English Summary

This change moves signed-in Home and Tower runtime behavior away from retired demo-pack and old Tower chat entry points. SkyHarbor now resolves to the current `skyharbor_global` tenant key, Tower chat uses the current `tower.*` read model path, and Home no longer falls back to local V6/V7 dossier browsers when governed current context is unavailable.

## Layer Impact

- Products: Home and Tower route behavior changes so current governed context is preferred and old runtime fallbacks are not used.
- Canonical model: SkyHarbor alias resolution now canonicalizes to `skyharbor_global`, the current loaded tenant key.
- Source adapters / client intake: No change.
- Data plane: No database mutation, purge, migration, or row delete is included.

## Client Applicability

- All clients: Tower chat route naming and stale response headers are neutralized.
- Specific clients: SkyHarbor routes and Tower reads resolve to `skyharbor_global`.
- Internal only: Retired-layer cleanup posture and route governance.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Added `/api/tower/chat` backed by `answerCurrentTowerQuestion` and the current `tower.*` read path.
- Repointed the Tower command-center aVa shell from `/api/tower/cio-chat` to `/api/tower/chat`.
- Removed the retired `/api/tower/cio-chat` route.
- Removed Home summary snapshot fallback to V6/V7 context browsers.
- Removed Home KNOW local dimension dossier fallback after curated dossier misses.
- Updated SkyHarbor aliasing in tenant and Tower canonicalizers to `skyharbor_global`.
- Replaced stale `X-AbarVa-V6-Surface` response headers with current layer headers on touched routes.

## QA / Validation

- `npx eslint` on changed source files: passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`: passed.
- Direct text scan confirmed no active reference remains to `/api/tower/cio-chat` or `X-AbarVa-V6-Surface` in non-test app/component/lib source.

## Rollout Plan

Merge through PR to main. The repo-owned Azure Container Apps main deploy workflow publishes the new web image. After deployment, verify signed-in Home summary, Home aVa, Tower page load, and Tower aVa chat for the active SkyHarbor account.

## Deployment Authority

- Repo-owned deploy workflow: required for `app.abarva.ai`.
- Shared runtime mutators: none in this PR.
- Approved image digest: produced by the main ACA deploy workflow after merge.
- ACA runtime invariant: verify after deploy before claiming live proof.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for Home and Tower aVa.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA workflow. No database rollback is required because this release does not mutate data.

## Audit Evidence

- PR diff for this release record and changed runtime files.
- TypeScript and ESLint command output.
- Post-deploy signed-in browser proof for Home and Tower.

## Known Gaps

This release does not delete retired tenant rows or drop retired schemas. Use the retired-tenant inventory/export/delete plan and a separate operator job only after the new runtime path is deployed and signed-in proof passes.
