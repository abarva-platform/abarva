# 2026-07-13-data-pr27-post-promotion-module-read-proof — Post-Promotion Module Read Proof

## Release ID

`2026-07-13-data-pr27-post-promotion-module-read-proof`

## Status

`candidate`

## Plain-English Summary

Adds a post-promotion proof showing that Home, Intelligence, Moves, Source, and
Tower can resolve the promoted SkyHarbor Active Tenant Access metadata pointer
through the proof harness. This does not change default module runtime reads or
write production tenant data.

## Layer Impact

- `global-control-lane`: adds a report-only module read proof over the promoted
  Active Tenant Access metadata pointer.
- `internal-admin`: adds JSON, Markdown, CSV, and HTML evidence under
  `reports/post-promotion-module-read-proof/skyharbor/`.
- Runtime behavior: no default module read-path change.

## Client Applicability

- All clients: no runtime change.
- Specific clients: SkyHarbor safe demo tenant proof only.
- Internal only: yes.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/enterprise-data/post-promotion-module-read-proof/post-promotion-module-read-proof.ts`
- `scripts/audit/build-post-promotion-module-read-proof.ts`
- `npm run audit:post-promotion-module-read-proof`
- `reports/post-promotion-module-read-proof/skyharbor/*`

## QA / Validation

- Pass: `npm run audit:active-tenant-access-promotion`
- Pass: `npm run audit:post-promotion-module-read-proof`
- Pass: `npx eslint scripts/audit/build-post-promotion-module-read-proof.ts src/lib/enterprise-data/post-promotion-module-read-proof/post-promotion-module-read-proof.ts`
- Pass: isolated TypeScript compile for the new module-read proof builder with
  Node types.
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run audit:architecture-rules`
- Pass: `npm run release:check`
- Pass: `git diff --check`

## Rollout Plan

Merge to `main` and deploy through the normal Azure Container Apps main
workflow. The proof consumes repository proof artifacts only and does not change
module runtime behavior.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this change.
- Approved image digest: to be populated by ACA main deploy.
- ACA runtime invariant: required after merge/deploy.
- Worker image invariant: required after merge/deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: standard post-deploy crawl if merged to main.

## Rollback Plan

Revert the PR. Since this release is proof/report-only and does not change
runtime module reads, rollback does not require data repair.

## Audit Evidence

- PR URL: to be added.
- Module read proof:
  `reports/post-promotion-module-read-proof/skyharbor/post-promotion-module-read-proof.json`
- Module read matrix:
  `reports/post-promotion-module-read-proof/skyharbor/module-read-matrix.csv`

## Known Gaps

This release does not execute rollback. That is DATA-PR28.
