# 2026-07-13-data-pr30-all-tenant-data-quality-audit — All-Tenant Data Quality And Coverage Audit

## Release ID

`2026-07-13-data-pr30-all-tenant-data-quality-audit`

## Status

`candidate`

## Plain-English Summary

Adds a read-only all-tenant data quality and coverage audit that compares
discovered source-estate richness with candidate coverage, canonical fact
quality, relationship graph readiness, evidence coverage, generated-data
caveats, tenant isolation, module readiness, promotion safety, and Admin/Home
caveats.

The audit makes the SkyHarbor risk explicit: rich source files exist for
systems, integrations, mainframe/core, Teradata/data estate, SAP, BI, Source,
Moves, and Tower evidence, but the current candidate proof is materially thin
and has zero planned relationship operations. That must block broad promotion
claims until the packet projection and mappings are expanded.

## Layer Impact

- `internal-admin`: adds a visible all-tenant quality matrix to
  `/admin/data-layer-explorer`.
- `global-control-lane`: adds repeatable non-destructive audit commands and
  report artifacts under `reports/data-quality/all-tenants/latest/`.
- Runtime behavior: no module runtime consumption change.
- Data layer: no production data writes, no physical table writes, no Active
  Tenant Access update, and no candidate promotion.

## Client Applicability

- All clients: yes, the audit scans all known tenant source packs and candidate
  proof artifacts.
- Specific clients: SkyHarbor is the clearest source-rich/candidate-thin
  reference finding.
- Internal only: yes.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/enterprise-data/data-quality/all-tenant-data-quality-audit.ts`
- `src/lib/enterprise-data/data-quality/__tests__/all-tenant-data-quality-audit.test.ts`
- `scripts/audit/build-all-tenant-data-quality-audit.ts`
- `scripts/audit/check-all-tenant-candidate-coverage.ts`
- `scripts/audit/check-data-quality-tenant-isolation.ts`
- `npm run audit:data-quality:all-tenants`
- `npm run audit:candidate-coverage:all-tenants`
- `npm run audit:tenant-isolation:data-quality`
- `reports/data-quality/all-tenants/latest/*`
- `/admin/data-layer-explorer` all-tenant quality matrix panel.

## QA / Validation

- Pass: `npm run audit:data-quality:all-tenants`
- Pass: `npm run audit:candidate-coverage:all-tenants`
- Pass: `npm run audit:tenant-isolation:data-quality`
- Pass: `npm run audit:admin-data-layer-explorer`
- Pass: `npx jest --runTestsByPath src/lib/enterprise-data/data-quality/__tests__/all-tenant-data-quality-audit.test.ts src/lib/admin/__tests__/data-layer-explorer.test.ts src/app/'(maestro)'/admin/data-layer-explorer/__tests__/page-source.test.ts --runInBand`
- Pass: `npx eslint scripts/audit/build-all-tenant-data-quality-audit.ts scripts/audit/check-all-tenant-candidate-coverage.ts scripts/audit/check-data-quality-tenant-isolation.ts src/lib/enterprise-data/data-quality/all-tenant-data-quality-audit.ts src/lib/enterprise-data/data-quality/__tests__/all-tenant-data-quality-audit.test.ts src/app/'(maestro)'/admin/data-layer-explorer/page.tsx src/app/'(maestro)'/admin/data-layer-explorer/__tests__/page-source.test.ts`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run audit:architecture-rules`
- Pass: `npm run release:check`
- Pass: isolated TypeScript compile for the new data-quality audit builder with Node types.
- Pass: `git diff --check`

## Rollout Plan

Merge to `main` and deploy through the repo-owned Azure Container Apps main
workflow. After deploy, run runtime invariant, production health, and focused
signed-in crawl for `/admin/data-layer-explorer`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this change.
- Approved image digest: to be populated by ACA main deploy.
- ACA runtime invariant: required after merge/deploy.
- Worker image invariant: required after merge/deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: focused Admin Data Layer Explorer crawl if
  merged to main.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow.
Because this is a read-only audit/report/Admin UI change with no data writes,
rollback does not require data migration or tenant data repair.

## Audit Evidence

- `reports/data-quality/all-tenants/latest/summary.md`
- `reports/data-quality/all-tenants/latest/tenant-quality-matrix.json`
- `reports/data-quality/all-tenants/latest/source-estate-coverage.json`
- `reports/data-quality/all-tenants/latest/candidate-coverage.json`
- `reports/data-quality/all-tenants/latest/relationship-graph-quality.json`
- `reports/data-quality/all-tenants/latest/admin-home-caveats.json`
- `reports/data-quality/all-tenants/latest/data-quality-control.html`

## Known Gaps

- This release does not expand any tenant candidate packet.
- This release does not add source adapters or mapping profiles.
- This release does not write production tenant data.
- This release does not update Active Tenant Access.
- This release does not promote any candidate data.
- This release does not make modules read candidate data by default.

## Runtime Fallback Addendum

Post-deploy browser proof showed that `reports/` is intentionally excluded from
the production image by `.dockerignore`, so `/admin/data-layer-explorer` could
not read the generated latest matrix at runtime. The follow-up hotfix keeps the
report bundle as release evidence and adds an embedded generated matrix fallback
for the Admin panel. The fallback remains read-only and preserves all
non-destructive guardrails.
