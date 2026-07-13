# 2026-07-13-data-pr26-active-tenant-access-promotion — Active Tenant Access Promotion For One Safe Demo Tenant

## Release ID

`2026-07-13-data-pr26-active-tenant-access-promotion`

## Status

`candidate`

## Plain-English Summary

Promotes the SkyHarbor safe demo tenant by writing an auditable Active Tenant
Access metadata pointer to the candidate version. This is the first controlled
promotion step after DATA-PR25 dry-run and rollback proof. It remains scoped to
SkyHarbor only and does not write production tenant data, write physical tables,
change module runtime consumption, make modules read promoted data by default,
or execute rollback against production.

## Layer Impact

- `global-control-lane`: adds a controlled Active Tenant Access metadata
  promotion artifact for one safe demo tenant.
- `internal-admin`: adds promotion receipt, active access record, Markdown, HTML,
  and JSON evidence under `reports/active-tenant-access/skyharbor/`.
- Runtime behavior: no module runtime consumption change in this release.

## Client Applicability

- All clients: no all-tenant promotion and no runtime module-read change.
- Specific clients: SkyHarbor safe demo tenant only.
- Internal only: yes.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/enterprise-data/active-tenant-access-promotion/active-tenant-access-promotion.ts`
- `scripts/audit/build-active-tenant-access-promotion.ts`
- `npm run audit:active-tenant-access-promotion`
- `reports/active-tenant-access/skyharbor/*`

## QA / Validation

- Pass: `npm run audit:promotion-execution-dry-run`
- Pass: `npm run audit:active-tenant-access-promotion`
- Pass: `npx eslint scripts/audit/build-active-tenant-access-promotion.ts src/lib/enterprise-data/active-tenant-access-promotion/active-tenant-access-promotion.ts`
- Pass: isolated TypeScript compile for the new active-access builder with Node
  types.
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run audit:architecture-rules`
- Pass: `npm run release:check`
- Pass: `git diff --check`

## Rollout Plan

Merge to `main` and deploy through the normal Azure Container Apps main
workflow. This adds proof/report artifacts and an Active Tenant Access metadata
record, but no production table mutation or module runtime read change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this change.
- Approved image digest: to be populated by ACA main deploy.
- ACA runtime invariant: required after merge/deploy.
- Worker image invariant: required after merge/deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: standard post-deploy crawl if merged to main.

## Rollback Plan

Revert the PR to remove the active-access metadata pointer artifact. Since this
release does not write production tenant data or change module runtime reads,
rollback does not require data repair.

## Audit Evidence

- PR URL: to be added.
- Active access record:
  `reports/active-tenant-access/skyharbor/active-tenant-access-record.json`
- Promotion receipt:
  `reports/active-tenant-access/skyharbor/promotion-receipt.json`

## Known Gaps

This release does not prove module reads from the promoted active pointer. That
is DATA-PR27. This release does not execute rollback. That is DATA-PR28.
