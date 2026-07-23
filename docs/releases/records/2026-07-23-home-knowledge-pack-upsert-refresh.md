# 2026-07-23-home-knowledge-pack-upsert-refresh — Home Pack Upsert Refresh

## Release ID

`2026-07-23-home-knowledge-pack-upsert-refresh`

## Status

`candidate`

## Plain-English Summary

Signed-in browser proof showed that rerunning the Home pack writer could approve a tenant pack while the live page still displayed older relationship text. The root cause was the database upsert path: when a tenant pack already existed for the same `tenant_key` and `pack_version`, the writer updated approval status and quality fields but did not update the `render_pack` body or Claude generation metadata.

This release fixes the upsert so every governed rerun refreshes the actual approved Home pack content, not only its approval shell.

## Layer Impact

- `client-data-lane`: governed Home pack reruns now update the approved Postgres content body for the tenant.
- `global-control-lane`: shared Home pack writer behavior changes for all tenants using the `home:knowledge-pack-v2:write` pipeline.

## Client Applicability

- All clients: yes, when their Home pack is regenerated through the shared writer.
- Specific clients: Meridian and FS Demo are the immediate signed-in proof targets.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/knowledge/build-home-knowledge-pack-v2.mjs`

## QA / Validation

- Pass: `node --check scripts/knowledge/build-home-knowledge-pack-v2.mjs`
- Pass: `npx eslint scripts/knowledge/build-home-knowledge-pack-v2.mjs`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`
- Pass: `npm run release:check`
- Not-run: governed ACA operator rerun for Meridian and FS Demo.
- Not-run: signed-in browser proof that Relationships no longer displays stale row/count mechanics.

## Rollout Plan

Merge through PR, deploy through the repo-owned Azure Container Apps main lane, then rerun the Home pack writer through the governed ACA operator job using the deployed digest. Browser-proof the signed-in Home page after the regenerated packs are approved.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: governed ACA operator job only for database pack regeneration.
- Approved image digest: pending deploy.
- ACA runtime invariant: required before data regeneration.
- Worker image invariant: required by deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR. Existing approved packs remain available. If a bad pack is generated, rerun the writer from the prior known-good deployed digest or retire the affected approved pack row and allow the previous approved pack to serve.

## Audit Evidence

- PR: pending.
- Failing signed-in proof before fix: `/tmp/home-knowledge-v3-rel-slot-fix-browser-proof-20260723/browser-proof-summary.json`.
- Root-cause code path: `ON CONFLICT (tenant_key, pack_version)` in `scripts/knowledge/build-home-knowledge-pack-v2.mjs`.

## Known Gaps

Release acceptance is pending PR merge, deploy, pack regeneration, and signed-in browser proof.
