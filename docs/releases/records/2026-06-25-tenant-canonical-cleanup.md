# 2026-06-25-tenant-canonical-cleanup — Tenant Canonical Cleanup

## Release ID

`2026-06-25-tenant-canonical-cleanup`

## Status

`candidate`

## Plain-English Summary

This release closes the tenant-key drift gap that allowed aliases such as `skyharbor`, `lakeshore`, `morganstreet`, and `mona-street` to remain active beside canonical tenant keys. The cleanup now discovers active tenant columns dynamically, rewrites aliases into canonical parent tenants through an archive-first script, and fails verification if any active runtime table still stores an alias.

## Layer Impact

- `client-data-lane`: Adds a controlled cleanup path for active Postgres tenant columns and expands canonical alias coverage for Lakeshore/Morgan/Mona references.
- `global-control-lane`: Strengthens the canonical tenant verifier used by release checks so new semantic/Home/Tower tables cannot silently bypass tenant-key rules.
- `retrieval-layer`: Extends Azure Search backfill normalization so retired aliases do not create separate search documents.

## Client Applicability

- All clients: canonical tenant enforcement applies globally.
- Specific clients: Lakeshore receives explicit Morgan/Mona alias normalization to `lakeshore-holdings`; SkyHarbor short-key rows normalize to `skyharbor-air`.
- Internal only: cleanup execution is an operator data-plane action.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/tenant/aliases.ts` adds retired Morgan/Mona aliases under the Lakeshore canonical tenant.
- `src/lib/azure-search/tenant-context-backfill.ts` normalizes Lakeshore/Morgan/Mona aliases before search document writes.
- `scripts/tenant-canonical-cleanup.ts` adds dry-run/apply cleanup with a manifest under `verification/tenant-canonical-cleanup/`.
- Follow-up: `scripts/tenant-canonical-cleanup.ts` also supports `TENANT_CLEANUP_OUT_DIR` so private operator runs can write manifests to `/tmp` inside the non-root runtime image.
- Follow-up: `scripts/tenant-canonical-cleanup.ts` also supports `TENANT_CLEANUP_APPLY=1` so ACA jobs can enter apply mode without forwarding fragile `--apply` CLI args.
- `scripts/verify-tenant-key-canonical.ts` now discovers active tenant columns dynamically and fails on aliases in product/runtime/read-model tables.
- `package.json` adds `npm run db:cleanup:tenant-keys`.

## QA / Validation

- pass: focused tenant-key and Azure Search normalization tests passed locally (`17 passed`).
- pass: ESLint passed locally for the changed tenant helpers, tests, and cleanup/verifier scripts.
- pass: cleanup and verifier scripts load through `tsx` and stop only at the expected missing-`DATABASE_URL` local boundary.
- pass: cleanup script supports `TENANT_CLEANUP_OUT_DIR=/tmp/...` for private operator manifest output.
- pass: cleanup script supports `TENANT_CLEANUP_APPLY=1` for private operator apply runs.
- blocked: full repo TypeScript check reaches the existing dependency baseline failures for missing `js-yaml`, Azure Document Intelligence, and axe Playwright type packages before this PR can be isolated.
- blocked: live data-plane cleanup requires the private VNet operator run after PR merge: dry-run, manifest review, `--apply`, then verifier.

## Rollout Plan

1. Merge to main through the repo-owned PR path.
2. Run `npm run db:cleanup:tenant-keys` in dry-run mode inside the private VNet.
3. Review the generated manifest and alias counts.
4. Run `npm run db:cleanup:tenant-keys -- --apply` or `npx tsx scripts/tenant-canonical-cleanup.ts --apply` inside the private VNet.
5. Run `npm run db:verify:tenant-keys`.
6. Refresh affected read models/search indexes if the manifest shows enterprise context or search-backed rows changed.

## Deployment Authority

- Repo-owned deploy workflow: normal main deploy only if app code changes need runtime rollout.
- Shared runtime mutators: none in this PR.
- Approved image digest: not applicable until merged/deployed.
- ACA runtime invariant: unchanged by this data cleanup script.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: yes after data cleanup and search/read-model refresh, verify Home/Intelligence/Tower for Lakeshore and SkyHarbor.

## Rollback Plan

The cleanup is an update from alias keys to canonical keys. Rollback should not restore aliases unless explicitly needed for forensic replay. If a conflict is detected, stop before apply. If an apply has completed and must be reverted, use the generated `verification/tenant-canonical-cleanup/<timestamp>/tenant-canonical-cleanup-report.json` manifest to construct a scoped reversal for the affected rows.

## Audit Evidence

- Cleanup manifest: `verification/tenant-canonical-cleanup/<timestamp>/MANIFEST.md`.
- Verifier command: `npm run db:verify:tenant-keys`.
- Unit test output for tenant alias normalization.
- Live signed-in screenshots after cleanup.

## Known Gaps

This PR provides the cleanup and enforcement path. The live private-VNet apply is still required before production data is actually clean.
