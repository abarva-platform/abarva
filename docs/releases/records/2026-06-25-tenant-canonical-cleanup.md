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
- Follow-up: `scripts/tenant-canonical-cleanup.ts` detects alias rows that would collide with existing canonical unique keys and deletes the duplicate alias-side row before rewriting the remaining rows.
- Follow-up: `scripts/tenant-canonical-cleanup.ts` uses an explicit tenant-column script type so the production image TypeScript build remains predictable.
- Follow-up: `scripts/tenant-canonical-cleanup.ts` reads unique-index columns as `string_agg` so the ACA runtime parses duplicate-key metadata deterministically.
- Follow-up: `scripts/tenant-canonical-cleanup.ts` includes partial unique indexes in duplicate detection so apply deletes alias-side collisions before rewriting tenant keys.
- Follow-up: `scripts/tenant-canonical-cleanup.ts` adds an explicit relationship-key collision rule for `enterprise_context_relationships` so Lakeshore alias edges merge cleanly into the canonical parent tenant.
- Follow-up: `scripts/tenant-canonical-cleanup.ts` deduplicates multiple alias-side relationship rows with the same `relationship_key` before rewriting them into the canonical tenant.
- Follow-up: `scripts/tenant-canonical-cleanup.ts` groups alias relationship keys before canonical collision checks so private-VNet dry-runs do not perform a per-row canonical lookup across the relationship table.
- Follow-up: `scripts/tenant-canonical-cleanup.ts` materializes canonical relationship keys once and joins them to alias groups so the private-VNet collision scan avoids correlated lookups entirely.
- Follow-up: `scripts/tenant-canonical-cleanup.ts` adds bounded statement timeout and per-column/alias progress logs for private-VNet operator runs so slow live cleanup scans fail visibly instead of spinning silently.
- Follow-up: `scripts/tenant-canonical-cleanup.ts` carries actual stored alias values into generic duplicate detection so large fact tables can use exact tenant-key joins instead of re-normalizing every row during canonical collision checks.
- Follow-up: `scripts/tenant-canonical-cleanup.ts` matches normal Postgres unique-index semantics for generic duplicate detection by using equality on non-null key columns, making large semantic source-row collision checks index-friendly.
- Follow-up: `scripts/tenant-canonical-cleanup.ts` orders base-table cleanup before view verification, skips direct ordinary-view mutation, and refreshes materialized views after base-table alias rewrites so apply cannot trip base-table unique constraints through an updatable view.
- Follow-up: `scripts/verify-tenant-key-canonical.ts` records relation kind for each discovered tenant column so cleanup can distinguish base tables, ordinary views, and materialized views while keeping verifier coverage strict.
- `scripts/verify-tenant-key-canonical.ts` now discovers active tenant columns dynamically and fails on aliases in product/runtime/read-model tables.
- `package.json` adds `npm run db:cleanup:tenant-keys`.

## QA / Validation

- pass: focused tenant-key and Azure Search normalization tests passed locally (`17 passed`).
- pass: ESLint passed locally for the changed tenant helpers, tests, and cleanup/verifier scripts.
- pass: cleanup and verifier scripts load through `tsx` and stop only at the expected missing-`DATABASE_URL` local boundary.
- pass: cleanup script supports `TENANT_CLEANUP_OUT_DIR=/tmp/...` for private operator manifest output.
- pass: cleanup script supports `TENANT_CLEANUP_APPLY=1` for private operator apply runs.
- pass: live dry-run found duplicate alias rows that require canonical-side merge/delete handling before apply.
- pass: first relationship alias dedup dry-run was stopped before apply because the per-row collision scan was too slow; the cleanup now uses grouped relationship-key collision detection before the next private-VNet run.
- pass: second relationship alias dry-run was stopped before apply because the grouped query still used a correlated canonical-key existence check; the cleanup now uses a join between alias relationship groups and distinct canonical relationship keys.
- pass: third dry-run was stopped before apply because it remained silent too long; the cleanup now emits scan progress and sets a 60s default statement timeout to identify the exact slow table/alias if it recurs.
- pass: fourth dry-run failed safely before apply on `enterprise_context_facts.tenant_key` duplicate detection; the cleanup now uses stored alias values and key-based victim CTEs for large fact-table duplicate checks.
- pass: fifth dry-run progressed through prior fact/entity blockers and failed safely before apply on `semantic2_source_rows.tenant_key`; metadata proved a `(tenant_key, source_table, source_primary_key)` unique key, so duplicate detection now uses equality on non-null key columns for normal unique-index behavior.
- pass: sixth dry-run succeeded inside the private VNet against image digest `sha256:8b356aab1f1347179215fa8dacbfd41017bc354f9de14896d5e111ed9107037c`, auditing 211 active tenant columns and reporting 132,351 alias rows plus 456 duplicate alias rows before apply.
- pass: first apply attempt failed safely inside a transaction before commit when an updatable view (`ai_control_graph_view`) attempted to rewrite `enterprise_context_relationships` before the base-table duplicate cleanup; the cleanup now mutates base relations first and treats views as verification surfaces rather than primary mutation targets.
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
