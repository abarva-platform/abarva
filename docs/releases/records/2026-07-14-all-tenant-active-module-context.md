# 2026-07-14-all-tenant-active-module-context - All-Tenant Active Module Context Closure

## Release ID

`2026-07-14-all-tenant-active-module-context`

## Status

`candidate`

## Plain-English Summary

This release closes the active module-context gap across every active tenant in
the universal tenant-input registry. It adds all-active-tenant Active Tenant
Access metadata proof generation, app-key to canonical-tenant alias resolution
for module context serving, and governed enterprise profile inputs for active
tenants that previously had profile blockers.

Northstar remains retired/excluded and is not processed as an active tenant.

## Layer Impact

- `global-control-lane`: extends the module context serving contract so
  app-facing tenant aliases resolve to canonical data-layer tenant keys before
  serving active or candidate-preview context.
- `client-data-lane`: updates active synthetic demo tenant inputs with missing
  enterprise profile dimensions, then regenerates canonical/candidate/active
  proof artifacts for all active tenants.
- `internal-admin`: adds an all-active-tenants audit mode for the Active Tenant
  Access metadata proof path.

## Client Applicability

- All clients: none. This is a demo/data-runway proof path, not a production
  client data mutation.
- Specific clients: all active synthetic/demo tenants in the tenant-input
  registry: Apex Retail, First Capital Financial, Lakeshore Holdings, Lakeshore
  Industries, Meridian Health, and SkyHarbor Air.
- Internal only: AbarVa data-layer audit and release proof workflows.
- Public/demo only: demo tenant Home/module-context data surfaces after deploy.
- Feature flag: none.

Northstar Clinical is retired/excluded.

## Changes Included

- Adds all-active-tenants mode to
  `scripts/data-build/promote-active-module-context.ts`.
- Adds all-tenant Active Tenant Access metadata proof generation in
  `src/lib/enterprise-data/active-module-context-promotion/active-module-context-promotion.ts`.
- Adds app-key alias resolution in
  `src/lib/enterprise-data/module-context-serving/module-context-serving.ts`.
- Extends module-context serving tests to cover all active tenants and app
  aliases.
- Updates active tenant enterprise profile inputs so every active tenant has
  headquarters, regions, leadership, mission, vision, source/as-of, segments,
  and synthetic-data caveats.
- Regenerates canonical, candidate, and active module-context proof artifacts.

## QA / Validation

- Pass: `npm run build:canonical-tenant-data`
- Pass: `npm run build:candidate-version`
- Pass: `npm run audit:active-module-context-promotion -- --all-active-tenants --generated-at 2026-07-14T13:00:00.000Z`
- Pass: `npm run audit:module-context-serving`
- Pass: `npm run audit:canonical-data-build`
- Pass: `npm run audit:candidate-version`
- Pass: `npm run audit:enterprise-naming`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Pending after merge: ACA main deploy, runtime invariant, health, and
  signed-in crawl.

## Rollout Plan

Merge through PR and deploy through the approved ACA main deployment workflow.
No manual Azure Container Apps mutation is authorized by this release.

## Deployment Authority

- Repo-owned deploy workflow: required for ACA deployment after merge.
- Shared runtime mutators: none in this PR.
- Approved image digest: pending ACA main deploy.
- ACA runtime invariant: pending ACA main deploy.
- Worker image invariant: pending ACA main deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, after deploy.

## Rollback Plan

Revert the PR. The rollback removes the all-tenant Active Tenant Access
metadata artifacts, alias-serving update, and profile input updates. No
production tenant data tables are written by this release.

## Audit Evidence

- `reports/active-tenant-access/all-tenants/all-tenant-active-module-context-promotion.json`
- `reports/active-tenant-access/all-tenants/all-tenant-active-module-context-promotion.md`
- `reports/active-tenant-access/*/active-tenant-access-record.json`
- `reports/active-tenant-access/*/module-context-read-proof.json`
- `reports/candidate-version-build/latest/tenant-candidate-versions.json`
- `reports/canonical-data-build/latest/tenant-build-index.json`

## Known Gaps

Post-merge ACA deploy and signed-in crawl are pending until this PR is merged.
This release does not write production tenant data, does not write physical
tenant tables, does not make modules read candidate data by default, does not
change module runtime behavior, and does not claim realized value.
