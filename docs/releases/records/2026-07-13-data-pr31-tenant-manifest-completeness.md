# 2026-07-13-data-pr31-tenant-manifest-completeness — Tenant Manifest Completeness and Source Projection Audit

## Release ID

`2026-07-13-data-pr31-tenant-manifest-completeness`

## Status

`candidate`

## Plain-English Summary

Adds the DATA-PR31 control-plane audit that shows which rich tenant source files exist, which files are included in candidate manifests, which source domains are stranded upstream, and whether Home/aVa are reading a thinner representation than the available source estate. This is a visibility and proof correction after the source-rich / candidate-thin failure class.

## Layer Impact

- `internal-admin`: extends `/admin/data-layer-explorer` with tenant manifest completeness and source projection visibility.
- `client-data-lane`: adds read-only source/candidate/Home/aVa representation audit logic and generated proof reports; no tenant data writes.
- `global-control-lane`: moves Home Data Quality behind an explicit Context Explorer option so quality posture is not automatically rendered on the already-busy Home canvas.
- Reports: writes deterministic DATA-PR31 proof artifacts under `reports/data-quality/manifest-projection/latest/` and `reports/admin-data-layer-explorer/latest/tenant-manifest-projection-audit.json`.

## Client Applicability

- All active audited demo tenants: SkyHarbor / Airline Demo, Lakeshore, Meridian, Apex, and First Capital.
- SkyHarbor receives explicit required findings for the 412-app portfolio CSV, 900-row app/system estate, 956-row transformed app/system template, and 13-row upgrade candidate source.
- Northstar is explicitly marked retired/excluded per operator instruction and is not processed as an active tenant.
- Internal only: yes.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds `src/lib/admin/tenant-manifest-projection-audit.ts`.
- Adds `scripts/audit/tenant-manifest-completeness.ts`.
- Extends `src/lib/admin/data-layer-explorer.ts` proof model and output artifacts.
- Extends `/admin/data-layer-explorer` to render manifest/source projection warnings.
- Updates Home so Data Quality is an explicit left-explorer option, not automatic default content.
- Adds audit commands for tenant manifest completeness, source projection, and Home/aVa representation.

## QA / Validation

- Pass: `npm run audit:tenant-manifest-completeness`
- Pass: `npm run audit:admin-data-layer-explorer`
- Pass: `npm run audit:data-quality:all-tenants`
- Pass: `npm run audit:candidate-coverage:all-tenants`
- Pass: `npm run audit:tenant-isolation:data-quality`
- Pass: `npm run audit:source-projection:all-tenants`
- Pass: `npm run audit:home-ava-representation`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run audit:architecture-rules`
- Pass: `npx jest --runTestsByPath src/lib/admin/__tests__/data-layer-explorer.test.ts src/app/'(maestro)'/admin/data-layer-explorer/__tests__/page-source.test.ts src/lib/enterprise-data/data-quality/__tests__/all-tenant-data-quality-audit.test.ts --runInBand`
- Pass: `npx eslint src/components/home/HomeSurface.tsx src/lib/admin/data-layer-explorer.ts src/lib/admin/tenant-manifest-projection-audit.ts scripts/audit/tenant-manifest-completeness.ts src/app/'(maestro)'/admin/data-layer-explorer/page.tsx src/lib/admin/__tests__/data-layer-explorer.test.ts src/app/'(maestro)'/admin/data-layer-explorer/__tests__/page-source.test.ts src/lib/enterprise-data/data-quality/all-tenant-data-quality-audit.ts src/lib/enterprise-data/data-quality/__tests__/all-tenant-data-quality-audit.test.ts`
- Pass: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false --incremental false`
- Pass: `npm run release:check`
- Pass: `git diff --check`

## Rollout Plan

Merge through the protected PR lane. Deploy only through the repo-owned Azure Container Apps main deployment workflow. After deploy, verify ACA health/runtime invariant and run a signed-in proof of `/admin/data-layer-explorer`.

## Deployment Authority

- Repo-owned deploy workflow: required for production/lab runtime.
- Shared runtime mutators: none in this PR.
- Approved image digest: pending deploy.
- ACA runtime invariant: pending deploy.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: `/admin/data-layer-explorer` after deploy.

## Rollback Plan

Revert the PR. The change is read-only and writes no production tenant data, so rollback has no data-plane side effects. Home returns to the previous automatic quality panel rendering if the PR is reverted.

## Audit Evidence

- DATA-PR31 report bundle: `reports/data-quality/manifest-projection/latest/`
- Admin route proof bundle: `reports/admin-data-layer-explorer/latest/`
- Admin route: `/admin/data-layer-explorer`

## Known Gaps

This PR does not remediate source manifests, regenerate candidates, promote candidates, update Active Tenant Access, or change module runtime consumption. DATA-PR32 should perform the first targeted source remediation.
