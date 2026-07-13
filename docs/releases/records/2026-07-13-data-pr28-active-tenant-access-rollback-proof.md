# 2026-07-13-data-pr28-active-tenant-access-rollback-proof — Active Tenant Access Rollback Proof

## Release ID

`2026-07-13-data-pr28-active-tenant-access-rollback-proof`

## Status

`candidate`

## Plain-English Summary

Adds a rollback proof for the promoted SkyHarbor Active Tenant Access metadata
pointer. The proof verifies the restore target and rollback steps after the
post-promotion module read proof, but intentionally leaves the active pointer
unchanged and does not execute rollback against production.

## Layer Impact

- `global-control-lane`: adds a rollback proof over the promoted Active Tenant
  Access metadata pointer.
- `internal-admin`: adds rollback receipt, steps CSV, Markdown, HTML, and JSON
  evidence under `reports/active-tenant-access-rollback/skyharbor/`.
- Runtime behavior: no change.

## Client Applicability

- All clients: no runtime change.
- Specific clients: SkyHarbor safe demo tenant proof only.
- Internal only: yes.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/enterprise-data/active-tenant-access-rollback-proof/active-tenant-access-rollback-proof.ts`
- `scripts/audit/build-active-tenant-access-rollback-proof.ts`
- `npm run audit:active-tenant-access-rollback-proof`
- `reports/active-tenant-access-rollback/skyharbor/*`

## QA / Validation

- Pass: `npm run audit:post-promotion-module-read-proof`
- Pass: `npm run audit:active-tenant-access-rollback-proof`
- Pass: `npx eslint scripts/audit/build-active-tenant-access-rollback-proof.ts src/lib/enterprise-data/active-tenant-access-rollback-proof/active-tenant-access-rollback-proof.ts`
- Pass: isolated TypeScript compile for the rollback proof builder with Node
  types.
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run audit:architecture-rules`
- Pass: `npm run release:check`
- Pass: `git diff --check`

## Rollout Plan

Merge to `main` and deploy through the normal Azure Container Apps main
workflow. This adds proof artifacts only and does not execute rollback or change
runtime behavior.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this change.
- Approved image digest: to be populated by ACA main deploy.
- ACA runtime invariant: required after merge/deploy.
- Worker image invariant: required after merge/deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: standard post-deploy crawl if merged to main.

## Rollback Plan

Revert the PR. Since this release is proof/report-only and does not execute
rollback, rollback does not require data repair.

## Audit Evidence

- PR URL: to be added.
- Rollback proof:
  `reports/active-tenant-access-rollback/skyharbor/active-tenant-access-rollback-proof.json`
- Rollback receipt:
  `reports/active-tenant-access-rollback/skyharbor/rollback-receipt.json`

## Known Gaps

This release does not prove repeatable new-client onboarding. That is DATA-PR29.
